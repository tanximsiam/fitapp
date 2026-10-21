<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityEntryExercise extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'sets', 'reps', 'duration_min'];
}
