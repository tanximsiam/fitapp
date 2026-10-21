<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** An activity logged by hand. Never merged into the watch's activity totals. */
class ActivityEntry extends Model
{
    public const TYPES = ['chores', 'walking', 'jogging', 'running', 'cycling', 'swimming', 'workout', 'yoga', 'other'];

    public const ENERGY_SOURCES = ['estimated', 'entered'];

    protected $fillable = ['date', 'started_at', 'activity_type', 'duration_min', 'energy_kcal', 'energy_source'];

    protected function casts(): array
    {
        return ['started_at' => 'datetime'];
    }

    /** For a workout: the exercises in the order they were logged. */
    public function exercises(): HasMany
    {
        return $this->hasMany(ActivityEntryExercise::class)->orderBy('id');
    }

    /** @param list<array{name: string, sets: int, reps?: ?int, duration_min?: ?int}> $rows */
    public function setExercises(array $rows): void
    {
        $this->exercises()->delete();
        $this->exercises()->createMany(array_map(fn ($r) => [
            'name' => $r['name'],
            'sets' => $r['sets'],
            'reps' => $r['reps'] ?? null,
            'duration_min' => $r['duration_min'] ?? null,
        ], $rows));
        $this->load('exercises');
    }
}
