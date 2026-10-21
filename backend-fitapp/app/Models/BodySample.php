<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSource;
use Illuminate\Database\Eloquent\Model;

/** A watch reading of stress (0–100) or blood oxygen (SpO₂ %). */
class BodySample extends Model
{
    use BelongsToSource;

    public const KINDS = ['stress', 'spo2'];

    protected $fillable = ['data_source_id', 'kind', 'date', 'measured_at', 'value'];

    protected function casts(): array
    {
        return ['measured_at' => 'datetime'];
    }
}
