<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An external provider or bridge that uploads data for one user, identified by its `key`. */
class DataSource extends Model
{
    protected $fillable = ['user_id', 'key', 'name', 'last_ingested_at'];

    protected function casts(): array
    {
        return ['last_ingested_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
