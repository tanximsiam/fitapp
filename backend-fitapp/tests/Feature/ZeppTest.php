<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ZeppConnection;
use App\Services\Zepp\FitParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Zepp integration against faked HTTP responses shaped like Zepp's published documentation.
 * This proves FitApp's side of the contract, not the live Zepp service.
 */
class ZeppTest extends TestCase
{
    use RefreshDatabase;

    private const WEBHOOK = '/api/zepp/webhook/test-webhook-token';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'zepp.client_id' => 'client-123',
            'zepp.client_secret' => 'secret-456',
            'zepp.webhook_token' => 'test-webhook-token',
            'zepp.redirect_uri' => 'https://api.example.test/api/zepp/callback',
            'zepp.frontend_url' => 'https://app.example.test',
        ]);
    }

    private function connected(array $attrs = []): ZeppConnection
    {
        $user = User::factory()->create(['timezone' => 'Asia/Shanghai']);

        return ZeppConnection::create($attrs + [
            'user_id' => $user->id,
            'zepp_user_id' => '1188969166',
            'access_token' => 'access-1',
            'refresh_token' => 'refresh-1',
            'expires_at' => now()->addHour(),
            'status' => 'connected',
            'connected_at' => now(),
        ]);
    }

    /** Zepp wraps each event as a JSON string inside a JSON array, sent as text/plain. */
    private function deliver(array ...$events)
    {
        $body = json_encode(array_map(fn ($e) => json_encode($e), $events));

        return $this->call('POST', self::WEBHOOK, [], [], [], ['CONTENT_TYPE' => 'text/plain;charset=UTF-8'], $body);
    }

    public function test_status_reports_unconfigured_server_and_refuses_to_connect(): void
    {
        config(['zepp.client_id' => null]);
        Sanctum::actingAs(User::factory()->create(), ['app']);

        $this->getJson('/api/zepp/status')
            ->assertOk()
            ->assertJsonPath('data.configured', false)
            ->assertJsonPath('data.connection', null)
            ->assertJsonFragment(['required_env' => ['ZEPP_CLIENT_ID', 'ZEPP_CLIENT_SECRET', 'ZEPP_WEBHOOK_TOKEN', 'ZEPP_REDIRECT_URI']]);
        $this->postJson('/api/zepp/authorize')->assertStatus(409);
        $this->call('POST', self::WEBHOOK, [], [], [], [], '[]')->assertNotFound();
    }

    public function test_oauth_flow_stores_encrypted_tokens_and_creates_the_source(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['app']);
        $url = $this->postJson('/api/zepp/authorize')->assertOk()->json('data.url');
        $this->assertStringStartsWith('https://user.zepp.com/oauth2/index.html#/login?client_id=client-123&response_type=code&state=', $url);
        $this->assertStringEndsWith('&token=%5B%22access%22,%22refresh%22%5D', $url);
        parse_str(parse_url(str_replace('#/login', '', $url), PHP_URL_QUERY), $q);

        Http::fake([
            'auth.zepp.com/v2/oauth2/access_token' => Http::response(['access_token' => 'zat', 'token_type' => 'Bearer', 'expires_in' => 3600, 'refresh_token' => 'zrt', 'user_id' => '300002']),
            'api-open.zepp.com/users/-/profile' => Http::response(['userId' => '300002', 'nickName' => 'Huhd']),
        ]);
        $this->get("/api/zepp/callback?code=AUTH_CODE&state={$q['state']}")
            ->assertRedirect('https://app.example.test/device?zepp=connected');

        Http::assertSent(fn (HttpRequest $r) => $r->url() === 'https://auth.zepp.com/v2/oauth2/access_token'
            && $r['grant_type'] === 'authorization_code' && $r['code'] === 'AUTH_CODE' && $r['client_secret'] === 'secret-456'
            && $r['redirect_uri'] === 'https://api.example.test/api/zepp/callback');
        $connection = ZeppConnection::firstOrFail();
        $this->assertSame(['300002', 'zat', 'connected'], [$connection->zepp_user_id, $connection->access_token, $connection->status]);
        $this->assertStringNotContainsString('zat', (string) DB::table('zepp_connections')->value('access_token'));
        $this->assertDatabaseHas('data_sources', ['user_id' => $user->id, 'key' => 'zepp']);

        $this->getJson('/api/zepp/status')->assertJsonPath('data.connection.status', 'connected')->assertJsonMissing(['access_token']);
    }

    public function test_callback_rejects_unknown_state_and_denied_consent(): void
    {
        Http::fake();
        $this->get('/api/zepp/callback?code=x&state=forged')->assertRedirect('https://app.example.test/device?zepp=error&reason=invalid-state');

        Cache::put('zepp_oauth:s1', User::factory()->create()->id, 600);
        $this->get('/api/zepp/callback?error=access_denied&state=s1')->assertRedirect('https://app.example.test/device?zepp=error&reason=denied');
        Http::assertNothingSent();
        $this->assertDatabaseCount('zepp_connections', 0);
    }

    public function test_dailies_and_sleep_events_are_ingested_idempotently(): void
    {
        $connection = $this->connected();
        $dailies = ['dailies' => [[
            'userId' => '1188969166', 'summaryId' => 'daily-1776009600', 'calendarDate' => '2026-04-13',
            'startTimeInSeconds' => 1776009600, 'startTimeOffsetInSeconds' => 28800, 'durationInSeconds' => 86400,
            'steps' => 8312, 'distanceInMeters' => 6120, 'activeKilocalories' => 410, 'restingHeartRateInBeatsPerMinute' => 58,
        ]]];
        $sleeps = ['sleeps' => [[
            'userId' => '1188969166', 'summaryId' => null, 'calendarDate' => '2026-04-14',
            'startTimeInSeconds' => 1776097200, 'startTimeOffsetInSeconds' => 28800, 'durationInSeconds' => 23160,
            'deepSleepDurationInSeconds' => 4380, 'lightSleepDurationInSeconds' => 13080, 'remSleepInSeconds' => 5700,
            'awakeDurationInSeconds' => 780, 'overallSleepScore' => ['value' => 64, 'qualifierKey' => 'FAIR'],
        ]]];

        $this->deliver($dailies, $sleeps)->assertNoContent();
        $this->deliver($dailies, $sleeps)->assertNoContent(); // Zepp may redeliver

        $this->assertDatabaseCount('activity_days', 1);
        $this->assertDatabaseHas('activity_days', ['date' => '2026-04-13', 'steps' => 8312, 'distance_m' => 6120, 'active_kcal' => 410, 'active_minutes' => null]);
        $this->assertDatabaseHas('heart_rate_days', ['date' => '2026-04-13', 'resting_bpm' => 58]);
        $this->assertDatabaseCount('sleep_sessions', 1);
        // 2026-04-14 00:20 +08:00 asleep for 6h26m plus 13m awake → woke 06:59 local.
        $this->assertDatabaseHas('sleep_sessions', [
            'date' => '2026-04-14', 'start_at' => '2026-04-13 16:20:00', 'end_at' => '2026-04-13 22:59:00',
            'deep_min' => 73, 'light_min' => 218, 'rem_min' => 95, 'awake_min' => 13, 'score' => 64,
        ]);
        $this->assertNotNull($connection->fresh()->last_event_at);
    }

    public function test_activity_ping_downloads_fit_file_once_and_stores_the_workout(): void
    {
        $connection = $this->connected();
        Http::fake(['zepp-download.example/*' => Http::response($this->fitFile(), 200, ['Content-Type' => 'application/octet-stream'])]);
        $ping = ['activityFiles' => [[
            'userId' => '1188969166', 'summaryId' => '991-file', 'fileType' => 'FIT',
            'callbackURL' => 'https://zepp-download.example/fit?token=one-time', 'activityType' => 'OUTDOOR_RUN',
            'deviceName' => 'Amazfit Example', 'startTimeInSeconds' => 1776074400, 'activityId' => 991,
        ]]];

        $this->deliver($ping)->assertNoContent();
        $this->deliver($ping)->assertNoContent();

        Http::assertSentCount(1);
        Http::assertSent(fn (HttpRequest $r) => $r->hasHeader('Authorization', 'Bearer access-1'));
        $this->assertDatabaseCount('workouts', 1);
        $this->assertDatabaseHas('workouts', [
            'type' => 'running', 'date' => '2026-04-13', 'start_at' => '2026-04-13 10:00:00', 'end_at' => '2026-04-13 10:42:00',
            'distance_m' => 6500, 'active_kcal' => 420, 'avg_bpm' => 148, 'max_bpm' => 171,
        ]);
        $this->assertDatabaseHas('data_sources', ['user_id' => $connection->user_id, 'key' => 'zepp', 'device' => 'Amazfit Example']);
    }

    public function test_unknown_users_and_unsupported_events_are_acknowledged_without_storing(): void
    {
        $this->connected();
        $this->deliver(['dailies' => [['userId' => 'someone-else', 'calendarDate' => '2026-04-13', 'steps' => 1]]], ['pulseOx' => [['userId' => '1188969166']]])
            ->assertNoContent();
        $this->assertDatabaseCount('activity_days', 0);
        $this->call('POST', self::WEBHOOK, [], [], [], [], 'not json')->assertStatus(400);
        $this->call('POST', '/api/zepp/webhook/wrong-token', [], [], [], [], '[]')->assertNotFound();
    }

    public function test_authorization_change_revokes_the_connection(): void
    {
        $connection = $this->connected();
        $this->deliver(['userId' => '1188969166', 'eventType' => 'authorizationChange', 'changeType' => 'delete', 'eventTime' => 1785822275955])->assertNoContent();

        $connection->refresh();
        $this->assertSame('revoked', $connection->status);
        $this->assertNull($connection->access_token);
    }

    public function test_sync_refreshes_an_expired_token_and_pulls_heart_rate(): void
    {
        $connection = $this->connected(['expires_at' => now()->subMinute()]);
        Http::fake([
            'auth.zepp.com/v2/oauth2/refresh_token' => Http::response(['access_token' => 'access-2', 'expires_in' => 3600, 'refresh_token' => 'refresh-1']),
            'api-open.zepp.com/users/-/heartrates*' => Http::response(['items' => [
                ['date' => '2026-04-13', 'minute' => 600, 'heartRateData' => 72, 'timestamp' => 1776045600, 'measureType' => 'AUTO'],
                ['date' => '2026-04-13', 'minute' => 601, 'heartRateData' => 0, 'timestamp' => 1776045660, 'measureType' => 'AUTO'],
            ]]),
        ]);

        $this->artisan('fitapp:zepp-sync')->assertSuccessful();

        Http::assertSent(fn (HttpRequest $r) => str_contains($r->url(), 'refresh_token') && $r->hasHeader('Authorization', 'Bearer refresh-1') && $r['grant_type'] === 'refresh_token');
        Http::assertSent(fn (HttpRequest $r) => str_contains($r->url(), '/users/-/heartrates') && $r->hasHeader('Authorization', 'Bearer access-2') && $r['timezone'] === 'Asia/Shanghai');
        $this->assertSame('access-2', $connection->fresh()->access_token);
        $this->assertDatabaseCount('heart_rate_samples', 1); // the 0 bpm placeholder is dropped
        $this->assertDatabaseHas('heart_rate_samples', ['measured_at' => '2026-04-13 02:00:00', 'date' => '2026-04-13', 'bpm' => 72]);
    }

    public function test_backfill_and_disconnect(): void
    {
        $connection = $this->connected();
        Sanctum::actingAs($connection->user, ['app']);
        Http::fake([
            'api-open.zepp.com/wellness-api/rest/backfill/*' => Http::response(['requestId' => 'req-1', 'status' => 'ACCEPTED'], 202),
            'api-open.zepp.com/users/-/thirdparty/unauthorize' => Http::response(null, 200),
        ]);

        $this->postJson('/api/zepp/backfill', ['days' => 31])->assertUnprocessable();
        $this->postJson('/api/zepp/backfill', ['days' => 30])->assertStatus(202)->assertJsonPath('data.requests', ['sleeps' => 'req-1', 'activities' => 'req-1']);
        Http::assertSent(function (HttpRequest $r) {
            if (! str_contains($r->url(), 'backfill/sleeps')) {
                return false;
            }
            parse_str(parse_url($r->url(), PHP_URL_QUERY), $q);

            return $q['summaryEndTimeInSeconds'] - $q['summaryStartTimeInSeconds'] < 2592000;
        });

        $this->deleteJson('/api/zepp/connection')->assertOk();
        Http::assertSent(fn (HttpRequest $r) => str_ends_with($r->url(), '/users/-/thirdparty/unauthorize'));
        $this->assertSame('revoked', $connection->fresh()->status);
        $this->assertNull($connection->fresh()->refresh_token);
    }

    public function test_fit_parser_reads_sessions_with_developer_fields_and_compressed_headers(): void
    {
        $sessions = (new FitParser)->sessions($this->fitFile());
        $this->assertCount(1, $sessions);
        $this->assertEquals(['start' => 1776074400, 'elapsed_s' => 2520.0, 'distance_m' => 6500.0, 'kcal' => 420, 'avg_bpm' => 148, 'max_bpm' => 171, 'sport' => 1], $sessions[0]);
    }

    /** Builds a small FIT activity file: file_id, a record with a developer field, and a session. */
    private function fitFile(): string
    {
        $fitTime = 1776074400 - 631065600;
        $def = fn (int $local, int $global, array $fields, array $dev = []) => chr(0x40 | $local | ($dev ? 0x20 : 0)).pack('CCvC', 0, 0, $global, count($fields))
            .implode('', array_map(fn ($f) => pack('CCC', ...$f), $fields))
            .($dev ? chr(count($dev)).implode('', array_map(fn ($f) => pack('CCC', ...$f), $dev)) : '');

        $data = $def(0, 0, [[0, 1, 0], [4, 4, 0x86]]).chr(0).pack('CV', 4, $fitTime)          // file_id
            .$def(1, 20, [[253, 4, 0x86], [3, 1, 2]], [[0, 2, 0]]).chr(1).pack('VC', $fitTime, 120).'xx' // record + dev field
            .chr(0x80 | (1 << 5) | 5).pack('VC', $fitTime + 5, 125).'yy'                      // compressed-timestamp record
            .$def(2, 18, [[253, 4, 0x86], [2, 4, 0x86], [7, 4, 0x86], [9, 4, 0x86], [11, 2, 0x84], [16, 1, 2], [17, 1, 2], [5, 1, 0]])
            .chr(2).pack('VVVVvCCC', $fitTime + 2520, $fitTime, 2520000, 650000, 420, 148, 171, 1);

        return pack('CCvV', 14, 0x20, 2132, strlen($data)).'.FIT'.pack('v', 0).$data.pack('v', 0);
    }
}
