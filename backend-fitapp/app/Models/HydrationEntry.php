<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HydrationEntry extends Model
{
    protected $fillable = ['date', 'recorded_at', 'volume_ml'];

    protected function casts(): array
    {
        return ['recorded_at' => 'datetime'];
    }
}
