<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityEntryTest extends TestCase
{
    use RefreshDatabase;

    private const JOG = ['started_at' => '2026-10-17T06:30:00+06:00', 'activity_type' => 'jogging', 'duration_min' => 30, 'energy_kcal' => 210, 'energy_source' => 'estimated'];

    private function signIn(): User
    {
        $user = User::factory()->create(['timezone' => 'Asia/Dhaka']);
        Sanctum::actingAs($user, ['app']);

        return $user;
    }

    public function test_activity_entry_lifecycle(): void
    {
        $this->signIn();

        $entry = $this->postJson('/api/journal/activities', self::JOG)
            ->assertCreated()
            ->assertJsonPath('data.date', '2026-10-17')
            ->assertJsonPath('data.activity_type', 'jogging')
            ->assertJsonPath('data.energy_source', 'estimated')
            ->assertJsonPath('data.provenance', 'manual')
            ->json('data');

        $this->putJson("/api/journal/activities/{$entry['id']}", [...self::JOG, 'duration_min' => 45, 'energy_kcal' => 300, 'energy_source' => 'entered', 'updated_at' => $entry['updated_at']])
            ->assertOk()
            ->assertJsonPath('data.duration_min', 45)
            ->assertJsonPath('data.energy_source', 'entered');

        $this->getJson('/api/journal/activities?from=2026-10-17&to=2026-10-17')->assertJsonCount(1, 'data');
        $this->deleteJson("/api/journal/activities/{$entry['id']}")->assertOk();
        $this->assertDatabaseCount('activity_entries', 0);
    }

    public function test_energy_is_optional_and_values_are_validated(): void
    {
        $this->signIn();

        $this->postJson('/api/journal/activities', ['started_at' => '2026-10-17T18:00:00+06:00', 'activity_type' => 'chores', 'duration_min' => 40])
            ->assertCreated()
            ->assertJsonPath('data.energy_kcal', null)
            ->assertJsonPath('data.energy_source', null);

        $this->postJson('/api/journal/activities', ['started_at' => '2026-10-17', 'activity_type' => 'skydiving', 'duration_min' => 0, 'energy_kcal' => 100])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['started_at', 'activity_type', 'duration_min', 'energy_source']);
    }

    public function test_a_workout_keeps_its_exercises_and_replaces_them_on_edit(): void
    {
        $this->signIn();
        $workout = ['started_at' => '2026-10-17T19:00:00+06:00', 'activity_type' => 'workout', 'duration_min' => 25, 'energy_kcal' => 150, 'energy_source' => 'estimated',
            'exercises' => [['name' => 'Bench press', 'sets' => 3, 'reps' => 10, 'duration_min' => 12], ['name' => 'Plank', 'sets' => 3, 'duration_min' => 5]]];

        $entry = $this->postJson('/api/journal/activities', $workout)
            ->assertCreated()
            ->assertJsonPath('data.exercises.0', ['name' => 'Bench press', 'sets' => 3, 'reps' => 10, 'duration_min' => 12])
            ->assertJsonPath('data.exercises.1.reps', null)
            ->json('data');

        $this->putJson("/api/journal/activities/{$entry['id']}", [...$workout, 'exercises' => [['name' => 'Squats', 'sets' => 4, 'reps' => 8]]])
            ->assertOk()
            ->assertJsonCount(1, 'data.exercises')
            ->assertJsonPath('data.exercises.0.name', 'Squats');
        $this->assertDatabaseCount('activity_entry_exercises', 1);

        $this->deleteJson("/api/journal/activities/{$entry['id']}")->assertOk();
        $this->assertDatabaseCount('activity_entry_exercises', 0);
    }

    public function test_entries_are_private_to_their_owner(): void
    {
        $this->signIn();
        $id = $this->postJson('/api/journal/activities', self::JOG)->json('data.id');

        $this->signIn();
        $this->putJson("/api/journal/activities/{$id}", self::JOG)->assertNotFound();
        $this->getJson('/api/journal/activities?from=2026-10-17&to=2026-10-17')->assertJsonCount(0, 'data');
    }
}
