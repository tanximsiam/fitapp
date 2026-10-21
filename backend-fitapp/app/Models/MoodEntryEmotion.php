<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoodEntryEmotion extends Model
{
    public $timestamps = false;

    protected $fillable = ['emotion'];
}
