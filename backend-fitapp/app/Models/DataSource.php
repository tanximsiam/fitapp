<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A watch connection or app that uploads data for one user, identified per user by its `key`. */
class DataSource extends Model
{
    protected $fillable = ['user_id', 'key', 'name', 'device', 'last_ingested_at'];

    protected function casts(): array
    {
        return ['last_ingested_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** What the source says it can measure. */
    public function measurements(): HasMany
    {
        return $this->hasMany(DataSourceMeasurement::class)->orderBy('id');
    }

    /** Replaces the declared measurements with this list. */
    public function declareMeasurements(array $names): void
    {
        $this->measurements()->delete();
        $this->measurements()->createMany(array_map(fn ($m) => ['measurement' => $m], array_values(array_unique($names))));
    }
}
