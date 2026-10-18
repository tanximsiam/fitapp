<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** The main sleep of a night, keyed by the local date it ended. */
class SleepSession extends Model
{
    protected $fillable = ['user_id', 'data_source_id', 'date', 'start_at', 'end_at', 'deep_min', 'light_min', 'rem_min', 'awake_min', 'score'];

    protected function casts(): array
    {
        return ['start_at' => 'datetime', 'end_at' => 'datetime'];
    }
}
