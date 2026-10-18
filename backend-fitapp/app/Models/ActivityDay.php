<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Cumulative daily totals; a re-upload for the same source and date replaces the values. */
class ActivityDay extends Model
{
    protected $fillable = ['user_id', 'data_source_id', 'date', 'steps', 'distance_m', 'active_kcal', 'active_minutes'];
}
