<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSource;
use Illuminate\Database\Eloquent\Model;

/** Nightly skin-temperature deviation from the wearer's baseline, in °C. */
class SkinTemperatureDay extends Model
{
    use BelongsToSource;

    protected $fillable = ['data_source_id', 'date', 'deviation_c'];

    protected function casts(): array
    {
        return ['deviation_c' => 'float'];
    }
}
