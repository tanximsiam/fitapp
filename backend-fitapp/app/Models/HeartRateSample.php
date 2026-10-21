<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSource;
use Illuminate\Database\Eloquent\Model;

class HeartRateSample extends Model
{
    use BelongsToSource;

    protected $fillable = ['data_source_id', 'date', 'measured_at', 'bpm'];

    protected function casts(): array
    {
        return ['measured_at' => 'datetime'];
    }
}
