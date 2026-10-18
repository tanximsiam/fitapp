<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoodEntry extends Model
{
    protected $fillable = ['date', 'recorded_at', 'mood', 'energy', 'stress', 'emotions', 'note'];

    protected function casts(): array
    {
        return ['recorded_at' => 'datetime', 'emotions' => 'array', 'note' => 'encrypted'];
    }
}
