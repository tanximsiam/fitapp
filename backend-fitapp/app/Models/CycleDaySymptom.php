<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CycleDaySymptom extends Model
{
    public $timestamps = false;

    protected $fillable = ['symptom'];
}
