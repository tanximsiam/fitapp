<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IngestionTest extends TestCase
{
    use RefreshDatabase;

    private function sample(): array
    {
        return json_decode(file_get_contents(base_path('../docs/examples/ingest-sample.json')), true);
    }

    private function asIngestClient(?User $user = null): User
    {
        $user ??= User::factory()->create(['timezone' => 'Asia/Dhaka']);
        // The phone uploads with its normal sign-in token.
        Sanctum::actingAs($user, ['app']);

        return $user;
    }

    public function test_documented_sample_payload_is_accepted_and_served(): void
    {
        $user = $this->asIngestClient();

        $this->postJson('/api/ingest', $this->sample())
            ->assertOk()
            ->assertJsonPath('data.source.key', 'my-bridge')
            ->assertJsonPath('data.received', ['activity_days' => 2, 'sleep_sessions' => 1, 'workouts' => 1, 'resting_heart_rate_days' => 1, 'heart_rate_samples' => 4, 'stress_samples' => 3, 'spo2_samples' => 2, 'skin_temperature_days' => 1]);

        Sanctum::actingAs($user, ['app']);
        $days = $this->getJson('/api/fitness/days?from=2026-10-16&to=2026-10-17')->assertOk()->json('data');

        $this->assertSame(9412, $days[0]['activity']['steps']);
        $this->assertNull($days[0]['sleep']);
        $this->assertNull($days[1]['activity']['active_minutes'], 'missing measurements stay null');
        $this->assertSame(444, $days[1]['sleep']['duration_min']);
        $this->assertSame('2026-10-16T23:42:00+06:00', $days[1]['sleep']['start_at']);
        $this->assertSame(['resting_bpm' => 57, 'min_bpm' => 61, 'max_bpm' => 121, 'avg_bpm' => 86, 'sample_count' => 4, 'source' => 'my-bridge'], $days[1]['heart_rate']);
    }

    public function test_reuploading_cumulative_totals_replaces_instead_of_adding(): void
    {
        $user = $this->asIngestClient();
        $payload = $this->sample();
        $this->postJson('/api/ingest', $payload)->assertOk();
        $this->postJson('/api/ingest', $payload)->assertOk();

        $payload['activity'] = [['date' => '2026-10-17', 'steps' => 7800]];
        $this->postJson('/api/ingest', $payload)->assertOk();

        $this->assertDatabaseCount('activity_days', 2);
        $this->assertDatabaseCount('heart_rate_samples', 4);
        $this->assertDatabaseHas('activity_days', ['data_source_id' => $user->dataSources()->value('id'), 'date' => '2026-10-17', 'steps' => 7800, 'distance_m' => 2990]);
    }

    public function test_samples_get_local_dates_and_utc_instants(): void
    {
        $this->asIngestClient();
        $payload = $this->sample();
        // 23:59 local on the 17th is 17:59 UTC; 00:30 local on the 18th is still the 17th in UTC.
        $payload['heart_rate']['samples'][] = ['at' => '2026-10-17T18:30:00Z', 'bpm' => 70];
        $this->postJson('/api/ingest', $payload)->assertOk();

        $this->assertDatabaseHas('heart_rate_samples', ['measured_at' => '2026-10-17 17:59:00', 'date' => '2026-10-17']);
        $this->assertDatabaseHas('heart_rate_samples', ['measured_at' => '2026-10-17 18:30:00', 'date' => '2026-10-18']);
    }

    public function test_invalid_payloads_are_rejected_with_field_errors(): void
    {
        $this->asIngestClient();
        $payload = $this->sample();
        $payload['source']['key'] = 'Not Valid!';
        $payload['activity'][0]['steps'] = -5;
        $payload['activity'][1]['date'] = '2026-10-16';
        $payload['sleep'][0]['end_at'] = '2026-10-16T22:00:00+06:00';
        $payload['heart_rate']['samples'][0]['at'] = '2026-10-17T08:00:00';

        $this->postJson('/api/ingest', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['source.key', 'activity.0.steps', 'activity.1.date', 'sleep.0.end_at', 'heart_rate.samples.0.at']);

        $this->postJson('/api/ingest', ['source' => ['key' => 'x', 'name' => 'X']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['activity']);

        $this->assertDatabaseCount('data_sources', 0);
    }

    public function test_ingest_requires_a_signed_in_app_token(): void
    {
        $this->postJson('/api/ingest', $this->sample())->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create(), []);
        $this->postJson('/api/ingest', $this->sample())->assertForbidden();
    }

    public function test_uploads_are_private_to_their_owner(): void
    {
        $this->asIngestClient();
        $this->postJson('/api/ingest', $this->sample())->assertOk();

        Sanctum::actingAs(User::factory()->create(), ['app']);
        $this->getJson('/api/fitness/status')->assertJsonCount(0, 'data.sources');
        $this->getJson('/api/fitness/days?from=2026-10-16&to=2026-10-17')->assertJsonPath('data.0.activity', null);
    }

    public function test_deleting_a_source_removes_its_records(): void
    {
        $user = $this->asIngestClient();
        $this->postJson('/api/ingest', $this->sample())->assertOk();

        $user->dataSources()->first()->delete();
        $this->assertDatabaseCount('activity_days', 0);
        $this->assertDatabaseCount('heart_rate_samples', 0);
        $this->assertDatabaseCount('data_source_measurements', 0);
    }

    public function test_workouts_device_and_latest_reading_are_served(): void
    {
        $user = $this->asIngestClient();
        $this->postJson('/api/ingest', $this->sample())->assertOk();
        $this->postJson('/api/ingest', $this->sample())->assertOk();

        Sanctum::actingAs($user, ['app']);
        $this->getJson('/api/fitness/days?from=2026-10-16&to=2026-10-16')
            ->assertJsonCount(1, 'data.0.workouts')
            ->assertJsonPath('data.0.workouts.0.type', 'running')
            ->assertJsonPath('data.0.workouts.0.duration_min', 42)
            ->assertJsonPath('data.0.workouts.0.start_at', '2026-10-16T18:10:00+06:00');

        $status = $this->getJson('/api/fitness/status')->assertOk();
        $status->assertJsonPath('data.sources.0.device', 'Example watch')
            ->assertJsonPath('data.latest_heart_rate', ['at' => '2026-10-17T23:59:00+06:00', 'bpm' => 61, 'source' => 'my-bridge']);
        $this->assertContains('workouts', $status->json('data.sources.0.measurements'));
        $this->assertEqualsCanonicalizing(
            ['activity', 'workouts', 'sleep', 'resting_heart_rate', 'heart_rate', 'stress', 'spo2', 'skin_temperature'],
            $status->json('data.sources.0.received'),
        );
    }

    public function test_stress_spo2_and_skin_temperature_are_stored_and_summarised(): void
    {
        $user = $this->asIngestClient();
        $this->postJson('/api/ingest', $this->sample())->assertOk();
        $this->postJson('/api/ingest', $this->sample())->assertOk();
        $this->assertDatabaseCount('body_samples', 5);

        Sanctum::actingAs($user, ['app']);
        $day = $this->getJson('/api/fitness/days?from=2026-10-17&to=2026-10-17')->json('data.0');
        $this->assertSame(['avg' => 45, 'min' => 25, 'max' => 67, 'sample_count' => 3, 'source' => 'my-bridge'], $day['stress']);
        $this->assertSame(['avg' => 96, 'min' => 95, 'max' => 97, 'sample_count' => 2, 'source' => 'my-bridge'], $day['spo2']);
        $this->assertEquals(['deviation_c' => -0.3, 'source' => 'my-bridge'], $day['skin_temperature']);

        $this->getJson('/api/fitness/readings/spo2/2026-10-17')
            ->assertJsonPath('data.samples', [['at' => '2026-10-17T02:00:00+06:00', 'value' => 97], ['at' => '2026-10-17T04:30:00+06:00', 'value' => 95]]);
        $this->getJson('/api/fitness/readings/temperature/2026-10-17')->assertNotFound();
    }

    public function test_body_signal_values_are_validated(): void
    {
        $this->asIngestClient();
        $payload = $this->sample();
        $payload['stress']['samples'][0]['value'] = 140;
        $payload['spo2']['samples'][0]['percent'] = 40;
        $payload['skin_temperature'][0]['deviation_c'] = 9;

        $this->postJson('/api/ingest', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['stress.samples.0.value', 'spo2.samples.0.percent', 'skin_temperature.0.deviation_c']);
    }

    public function test_workout_span_and_measurement_names_are_validated(): void
    {
        $this->asIngestClient();
        $payload = $this->sample();
        $payload['workouts'][0]['end_at'] = '2026-10-16T18:00:00+06:00';
        $payload['source']['measurements'][] = 'blood_oxygen_guess';

        $this->postJson('/api/ingest', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['workouts.0.end_at', 'source.measurements.13']);
    }
}
