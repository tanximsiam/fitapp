<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeartRateDay extends Model
{
    protected $fillable = ['user_id', 'data_source_id', 'date', 'resting_bpm'];
}
