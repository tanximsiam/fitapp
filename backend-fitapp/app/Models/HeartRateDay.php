<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSource;
use Illuminate\Database\Eloquent\Model;

class HeartRateDay extends Model
{
    use BelongsToSource;

    protected $fillable = ['data_source_id', 'date', 'resting_bpm'];
}
