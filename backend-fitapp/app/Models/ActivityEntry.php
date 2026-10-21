<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** An activity logged by hand. Never merged into the watch's activity totals. */
class ActivityEntry extends Model
{
    public const TYPES = ['chores', 'walking', 'jogging', 'running', 'cycling', 'swimming', 'strength', 'yoga', 'other'];

    public const ENERGY_SOURCES = ['estimated', 'entered'];

    protected $fillable = ['date', 'started_at', 'activity_type', 'duration_min', 'energy_kcal', 'energy_source'];

    protected function casts(): array
    {
        return ['started_at' => 'datetime'];
    }
}
