<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSource;
use Illuminate\Database\Eloquent\Model;

/** A recorded exercise session, keyed by its start instant per source. */
class Workout extends Model
{
    use BelongsToSource;

    protected $fillable = ['data_source_id', 'date', 'start_at', 'end_at', 'type', 'active_kcal', 'distance_m', 'avg_bpm', 'max_bpm'];

    protected function casts(): array
    {
        return ['start_at' => 'datetime', 'end_at' => 'datetime'];
    }
}
