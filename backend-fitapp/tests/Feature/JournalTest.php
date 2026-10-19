<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\IngestionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class JournalTest extends TestCase
{
    use RefreshDatabase;

    private function actingUser(array $attrs = []): User
    {
        $user = User::factory()->create(['timezone' => 'Asia/Dhaka'] + $attrs);
        Sanctum::actingAs($user, ['app']);

        return $user;
    }

    public function test_mood_entry_lifecycle(): void
    {
        $this->actingUser();

        $created = $this->postJson('/api/journal/mood', [
            'recorded_at' => '2026-10-17T00:30:00+06:00',
            'mood' => 4, 'energy' => 2, 'stress' => 3, 'emotions' => ['calm', 'tired'], 'note' => 'Long day',
        ])->assertCreated()
            ->assertJsonPath('data.date', '2026-10-17') // local date, although it is still the 16th in UTC
            ->assertJsonPath('data.provenance', 'manual')
            ->json('data');

        $this->getJson('/api/journal/mood?from=2026-10-17&to=2026-10-17')->assertJsonCount(1, 'data')->assertJsonPath('data.0.note', 'Long day');

        $this->putJson("/api/journal/mood/{$created['id']}", ['recorded_at' => '2026-10-17T08:00:00+06:00', 'mood' => 5, 'updated_at' => $created['updated_at']])
            ->assertOk()
            ->assertJsonPath('data.mood', 5)
            ->assertJsonPath('data.energy', null)
            ->assertJsonPath('data.emotions', []);

        $this->deleteJson("/api/journal/mood/{$created['id']}")->assertOk();
        $this->assertDatabaseCount('mood_entries', 0);
    }

    public function test_notes_are_encrypted_at_rest(): void
    {
        $this->actingUser();
        $this->postJson('/api/journal/mood', ['recorded_at' => '2026-10-17T08:00:00+06:00', 'mood' => 3, 'note' => 'private thought'])->assertCreated();

        $this->assertStringNotContainsString('private thought', (string) DB::table('mood_entries')->value('note'));
    }

    public function test_stale_edit_is_rejected_instead_of_overwriting(): void
    {
        $this->actingUser();
        $entry = $this->postJson('/api/journal/hydration', ['recorded_at' => '2026-10-17T08:00:00+06:00', 'volume_ml' => 250])->json('data');

        $this->putJson("/api/journal/hydration/{$entry['id']}", ['recorded_at' => $entry['recorded_at'], 'volume_ml' => 300, 'updated_at' => '2020-01-01T00:00:00Z'])
            ->assertStatus(409)
            ->assertJsonStructure(['message']);
        $this->assertDatabaseHas('hydration_entries', ['id' => $entry['id'], 'volume_ml' => 250]);
    }

    public function test_meals_store_entered_items_and_replace_them_on_edit(): void
    {
        $this->actingUser();
        $meal = $this->postJson('/api/journal/meals', [
            'eaten_at' => '2026-10-17T13:10:00+06:00',
            'meal_type' => 'lunch',
            'items' => [
                ['name' => 'Rice', 'quantity' => 180, 'unit' => 'g', 'energy_kcal' => 234, 'nutrition_source' => 'database'],
                ['name' => 'Dal', 'quantity' => 1, 'unit' => 'cup'],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.items.0.energy_kcal', 234)
            ->assertJsonPath('data.items.1.energy_kcal', null)
            ->assertJsonPath('data.items.0.nutrition_source', 'database')
            ->assertJsonPath('data.items.1.nutrition_source', null)
            ->json('data');

        $this->putJson("/api/journal/meals/{$meal['id']}", [
            'eaten_at' => $meal['eaten_at'], 'meal_type' => 'lunch', 'items' => [['name' => 'Rice', 'quantity' => 200, 'unit' => 'g']],
        ])->assertOk()->assertJsonCount(1, 'data.items');
        $this->assertDatabaseCount('meal_items', 1);

        $this->postJson('/api/journal/meals', ['eaten_at' => '2026-10-17T13:10', 'meal_type' => 'brunch', 'items' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['eaten_at', 'meal_type', 'items']);
    }

    public function test_cycle_days_are_one_record_per_date(): void
    {
        $this->actingUser();
        $this->putJson('/api/journal/cycle-days/2026-10-01', ['flow' => 'medium', 'symptoms' => ['cramps']])->assertCreated();
        $this->putJson('/api/journal/cycle-days/2026-10-01', ['flow' => 'heavy', 'symptoms' => ['cramps', 'fatigue']])->assertOk();
        $this->assertDatabaseCount('cycle_days', 1);

        $this->getJson('/api/journal/cycle-days?from=2026-09-01&to=2026-10-31')->assertJsonPath('data.0.flow', 'heavy');

        $this->putJson('/api/journal/cycle-days/2026-10-02', [])->assertUnprocessable()->assertJsonValidationErrors('flow');
        $this->putJson('/api/journal/cycle-days/2026-10-02', ['flow' => 'extreme', 'symptoms' => ['diagnosis']])
            ->assertUnprocessable()->assertJsonValidationErrors(['flow', 'symptoms.0']);

        $this->deleteJson('/api/journal/cycle-days/2026-10-01')->assertOk();
        $this->deleteJson('/api/journal/cycle-days/2026-10-01')->assertNotFound();
    }

    public function test_records_are_private_to_their_owner(): void
    {
        $owner = $this->actingUser();
        $id = $this->postJson('/api/journal/mood', ['recorded_at' => '2026-10-17T08:00:00+06:00', 'mood' => 3])->json('data.id');
        $this->putJson('/api/journal/cycle-days/2026-10-01', ['flow' => 'light'])->assertCreated();

        $this->actingUser();
        $this->getJson('/api/journal/mood?from=2026-10-01&to=2026-10-31')->assertJsonCount(0, 'data');
        $this->putJson("/api/journal/mood/$id", ['recorded_at' => '2026-10-17T08:00:00+06:00', 'mood' => 1])->assertNotFound();
        $this->deleteJson("/api/journal/mood/$id")->assertNotFound();
        $this->getJson('/api/journal/cycle-days?from=2026-10-01&to=2026-10-31')->assertJsonCount(0, 'data');

        $this->assertDatabaseHas('mood_entries', ['id' => $id, 'user_id' => $owner->id, 'mood' => 3]);
    }

    public function test_journal_requires_an_app_token(): void
    {
        $this->getJson('/api/journal/mood')->assertUnauthorized();
        Sanctum::actingAs(User::factory()->create(), ['ingest']);
        $this->postJson('/api/journal/hydration', ['recorded_at' => '2026-10-17T08:00:00+06:00', 'volume_ml' => 250])->assertForbidden();
    }

    public function test_ingestion_never_touches_manual_records(): void
    {
        $user = $this->actingUser();
        $this->postJson('/api/journal/mood', ['recorded_at' => '2026-10-17T08:00:00+06:00', 'mood' => 3])->assertCreated();
        app(IngestionService::class)->ingest($user, ['source' => ['key' => 'w', 'name' => 'W'], 'activity' => [['date' => '2026-10-17', 'steps' => 5]]]);

        $this->getJson('/api/journal/mood?from=2026-10-17&to=2026-10-17')->assertJsonPath('data.0.mood', 3);
    }

    public function test_tracker_preferences(): void
    {
        $this->actingUser();
        $this->getJson('/api/user')->assertJsonPath('data.preferences.trackers', ['mood' => true, 'food' => true, 'cycle' => false]);
        $this->patchJson('/api/user', ['preferences' => ['trackers' => ['cycle' => true]]])
            ->assertOk()
            ->assertJsonPath('data.preferences.trackers', ['mood' => true, 'food' => true, 'cycle' => true]);
        $this->patchJson('/api/user', ['preferences' => ['trackers' => ['gender' => 'x']]])->assertUnprocessable();
    }
}
