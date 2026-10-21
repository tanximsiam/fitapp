<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\IngestionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FitnessReadTest extends TestCase
{
    use RefreshDatabase;

    private function ingest(User $user, string $key, array $activity, array $extra = []): void
    {
        app(IngestionService::class)->ingest($user, ['source' => ['key' => $key, 'name' => ucfirst($key)], 'activity' => $activity] + $extra);
    }

    public function test_users_only_see_their_own_data(): void
    {
        [$alice, $bob] = User::factory()->count(2)->create();
        $this->ingest($alice, 'watch', [['date' => '2026-10-01', 'steps' => 1000]]);
        $this->ingest($bob, 'watch', [['date' => '2026-10-01', 'steps' => 2000]]);

        Sanctum::actingAs($bob, ['app']);
        $this->getJson('/api/fitness/days?from=2026-10-01&to=2026-10-01')->assertJsonPath('data.0.activity.steps', 2000);
        $this->getJson('/api/fitness/status')->assertJsonCount(1, 'data.sources');
    }

    public function test_range_includes_empty_days_as_null(): void
    {
        $user = User::factory()->create();
        $this->ingest($user, 'watch', [['date' => '2026-10-02', 'steps' => 10]]);
        Sanctum::actingAs($user, ['app']);

        $this->getJson('/api/fitness/days?from=2026-10-01&to=2026-10-03')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0', ['date' => '2026-10-01', 'activity' => null, 'sleep' => null, 'heart_rate' => null, 'workouts' => [], 'stress' => null, 'spo2' => null, 'skin_temperature' => null])
            ->assertJsonPath('meta.to', '2026-10-03');
    }

    public function test_most_recently_updated_source_wins_per_date(): void
    {
        $user = User::factory()->create();
        Carbon::setTestNow('2026-10-05 10:00:00');
        $this->ingest($user, 'phone', [['date' => '2026-10-04', 'steps' => 500]]);
        Carbon::setTestNow('2026-10-05 11:00:00');
        $this->ingest($user, 'watch', [['date' => '2026-10-04', 'steps' => 800]]);
        Sanctum::actingAs($user, ['app']);

        $this->getJson('/api/fitness/days?from=2026-10-04&to=2026-10-04')
            ->assertJsonPath('data.0.activity.steps', 800)
            ->assertJsonPath('data.0.activity.source', 'watch');
    }

    public function test_default_range_is_thirty_days_ending_today_in_user_timezone(): void
    {
        Carbon::setTestNow('2026-10-17 20:00:00'); // already the 18th in Dhaka (UTC+6)
        Sanctum::actingAs(User::factory()->create(['timezone' => 'Asia/Dhaka']), ['app']);

        $this->getJson('/api/fitness/days')
            ->assertJsonCount(30, 'data')
            ->assertJsonPath('meta.from', '2026-09-19')
            ->assertJsonPath('meta.to', '2026-10-18');
    }

    public function test_invalid_ranges_are_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create(), ['app']);
        $this->getJson('/api/fitness/days?from=2026-10-05&to=2026-10-01')->assertUnprocessable()->assertJsonValidationErrors('to');
        $this->getJson('/api/fitness/days?from=2024-01-01&to=2026-01-01')->assertUnprocessable()->assertJsonValidationErrors('to');
        $this->getJson('/api/fitness/days?from=yesterday&to=2026-10-01')->assertUnprocessable();
    }

    public function test_heart_rate_samples_and_status_freshness(): void
    {
        $user = User::factory()->create(['timezone' => 'Asia/Dhaka']);
        Carbon::setTestNow('2026-10-17 06:00:00');
        $this->ingest($user, 'watch', [['date' => '2026-10-17', 'steps' => 1]], [
            'heart_rate' => ['samples' => [['at' => '2026-10-17T09:00:00+06:00', 'bpm' => 70], ['at' => '2026-10-17T08:00:00+06:00', 'bpm' => 65]]],
        ]);
        Sanctum::actingAs($user, ['app']);

        $this->getJson('/api/fitness/heart-rate/2026-10-17')
            ->assertJsonPath('data.samples', [['at' => '2026-10-17T08:00:00+06:00', 'bpm' => 65], ['at' => '2026-10-17T09:00:00+06:00', 'bpm' => 70]]);
        $this->getJson('/api/fitness/status')
            ->assertJsonPath('data.last_ingested_at', '2026-10-17T06:00:00Z')
            ->assertJsonPath('data.latest_date', '2026-10-17')
            ->assertJsonPath('data.sources.0.latest_date', '2026-10-17');
    }

    public function test_profile_goals_and_timezone_update(): void
    {
        Sanctum::actingAs(User::factory()->create(), ['app']);

        $this->patchJson('/api/user', ['timezone' => 'Europe/Berlin', 'goals' => ['steps' => 10000]])
            ->assertOk()
            ->assertJsonPath('data.timezone', 'Europe/Berlin')
            ->assertJsonPath('data.goals.steps', 10000)
            ->assertJsonPath('data.goals.sleep_min', 450);

        $this->patchJson('/api/user', ['timezone' => 'Mars/Base', 'goals' => ['calories' => 1]])
            ->assertUnprocessable()->assertJsonValidationErrors(['timezone', 'goals']);
    }
}
