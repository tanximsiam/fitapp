<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** API goal name → column. */
    public const GOALS = [
        'steps' => 'goal_steps',
        'active_kcal' => 'goal_active_kcal',
        'distance_m' => 'goal_distance_m',
        'sleep_min' => 'goal_sleep_min',
        'water_ml' => 'goal_water_ml',
    ];

    /** API tracker name → column. Cycle tracking is opt-in. */
    public const TRACKERS = [
        'mood' => 'track_mood',
        'food' => 'track_food',
        'hydration' => 'track_hydration',
        'cycle' => 'track_cycle',
    ];

    /** Watch or tracker families the app knows how to connect (the app's setup screens offer these). */
    public const WEARABLE_BRANDS = ['fitapp', 'amazfit', 'apple', 'samsung', 'google', 'garmin', 'other', 'none'];

    /** Same defaults as the columns, so a new model has them before it is read back. */
    protected $attributes = [
        'timezone' => 'UTC',
        'goal_steps' => 8000,
        'goal_active_kcal' => 450,
        'goal_distance_m' => 6000,
        'goal_sleep_min' => 450,
        'goal_water_ml' => 2000,
        'track_mood' => true,
        'track_food' => true,
        'track_hydration' => true,
        'track_cycle' => false,
    ];

    /** @var list<string> */
    protected $fillable = [
        'name', 'email', 'password', 'timezone', 'birth_date', 'wearable_brand', 'wearable_model',
        'goal_steps', 'goal_active_kcal', 'goal_distance_m', 'goal_sleep_min', 'goal_water_ml',
        'track_mood', 'track_food', 'track_hydration', 'track_cycle',
    ];

    /** @var list<string> */
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'onboarded_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
        ] + array_fill_keys(self::GOALS, 'integer') + array_fill_keys(self::TRACKERS, 'boolean');
    }

    /** @return array<string, int> keyed by API goal name */
    public function goals(): array
    {
        return array_map(fn (string $column) => $this->{$column}, self::GOALS);
    }

    /** @return array<string, bool> keyed by API tracker name */
    public function trackers(): array
    {
        return array_map(fn (string $column) => $this->{$column}, self::TRACKERS);
    }

    /** @return array{brand: string, model: ?string}|null */
    public function wearable(): ?array
    {
        return $this->wearable_brand ? ['brand' => $this->wearable_brand, 'model' => $this->wearable_model] : null;
    }

    public function dataSources(): HasMany
    {
        return $this->hasMany(DataSource::class);
    }

    public function moodEntries(): HasMany
    {
        return $this->hasMany(MoodEntry::class);
    }

    public function meals(): HasMany
    {
        return $this->hasMany(Meal::class);
    }

    public function hydrationEntries(): HasMany
    {
        return $this->hasMany(HydrationEntry::class);
    }

    public function activityEntries(): HasMany
    {
        return $this->hasMany(ActivityEntry::class);
    }

    public function cycleDays(): HasMany
    {
        return $this->hasMany(CycleDay::class);
    }
}
