<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Nightly skin-temperature deviation from the wearer's baseline, in °C. */
class SkinTemperatureDay extends Model
{
    protected $fillable = ['user_id', 'data_source_id', 'date', 'deviation_c'];

    protected function casts(): array
    {
        return ['deviation_c' => 'float'];
    }
}
