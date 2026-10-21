<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(?User $user = null): User
    {
        $user ??= User::factory()->create();
        Sanctum::actingAs($user, ['app']);

        return $user;
    }

    public function test_new_accounts_start_without_a_finished_setup(): void
    {
        $this->signIn();

        $this->getJson('/api/user')
            ->assertJsonPath('data.onboarded', false)
            ->assertJsonPath('data.birth_date', null)
            ->assertJsonPath('data.goals.water_ml', 2000)
            ->assertJsonPath('data.preferences.trackers.hydration', true)
            ->assertJsonPath('data.preferences.wearable', null);
    }

    public function test_setup_saves_profile_wearable_trackers_and_goals_in_one_request(): void
    {
        $this->signIn();

        $this->patchJson('/api/user', [
            'name' => 'Ana',
            'birth_date' => '1994-03-12',
            'goals' => ['steps' => 9000, 'water_ml' => 2500],
            'preferences' => ['trackers' => ['hydration' => false, 'cycle' => true], 'wearable' => ['brand' => 'garmin', 'model' => null]],
            'onboarded' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Ana')
            ->assertJsonPath('data.birth_date', '1994-03-12')
            ->assertJsonPath('data.onboarded', true)
            ->assertJsonPath('data.goals.steps', 9000)
            ->assertJsonPath('data.goals.water_ml', 2500)
            ->assertJsonPath('data.goals.sleep_min', 450)
            ->assertJsonPath('data.preferences.trackers', ['mood' => true, 'food' => true, 'hydration' => false, 'cycle' => true])
            ->assertJsonPath('data.preferences.wearable', ['brand' => 'garmin', 'model' => null]);
    }

    public function test_changing_trackers_keeps_the_wearable_and_the_other_way_round(): void
    {
        $this->signIn();

        $this->patchJson('/api/user', ['preferences' => ['wearable' => ['brand' => 'other', 'model' => 'Ring X']]])->assertOk();
        $this->patchJson('/api/user', ['preferences' => ['trackers' => ['mood' => false]]])
            ->assertJsonPath('data.preferences.wearable.model', 'Ring X')
            ->assertJsonPath('data.preferences.trackers.mood', false);
    }

    public function test_profile_values_are_validated(): void
    {
        $this->signIn();

        $this->patchJson('/api/user', [
            'birth_date' => now()->addDay()->toDateString(),
            'goals' => ['water_ml' => 50],
            'preferences' => ['wearable' => ['brand' => 'toaster']],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['birth_date', 'goals.water_ml', 'preferences.wearable.brand']);
    }
}
