<?php

namespace App\Models\Concerns;

use App\Models\DataSource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Watch data owned by one data source; the user is reached through the source, never stored twice. */
trait BelongsToSource
{
    public function source(): BelongsTo
    {
        return $this->belongsTo(DataSource::class, 'data_source_id');
    }

    /** Records from any of this user's sources. */
    public function scopeForUser(Builder $query, User $user): void
    {
        $query->whereIn('data_source_id', $user->dataSources()->select('id'));
    }
}
