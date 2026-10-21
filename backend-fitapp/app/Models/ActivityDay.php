<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSource;
use Illuminate\Database\Eloquent\Model;

/** Cumulative daily totals; a re-upload for the same source and date replaces the values. */
class ActivityDay extends Model
{
    use BelongsToSource;

    protected $fillable = ['data_source_id', 'date', 'steps', 'distance_m', 'active_kcal', 'active_minutes'];
}
