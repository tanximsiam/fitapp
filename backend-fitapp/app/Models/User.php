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

    public const DEFAULT_GOALS = [
        'steps' => 8000,
        'active_kcal' => 450,
        'distance_m' => 6000,
        'sleep_min' => 450,
    ];

    /** @var list<string> */
    protected $fillable = [
        'name',
        'email',
        'password',
        'timezone',
        'goals',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_dev' => 'boolean',
            'goals' => 'array',
        ];
    }

    /** Stored goals merged over the defaults. */
    public function effectiveGoals(): array
    {
        return array_merge(self::DEFAULT_GOALS, $this->goals ?? []);
    }

    public function dataSources(): HasMany
    {
        return $this->hasMany(DataSource::class);
    }
}
