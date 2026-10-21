<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataSourceMeasurement extends Model
{
    public $timestamps = false;

    protected $fillable = ['measurement'];
}
