<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeartRateSample extends Model
{
    protected $fillable = ['user_id', 'data_source_id', 'date', 'measured_at', 'bpm'];

    protected function casts(): array
    {
        return ['measured_at' => 'datetime'];
    }
}
