<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A FitApp user's OAuth authorisation with the Zepp Open Platform. Tokens never leave the server. */
class ZeppConnection extends Model
{
    protected $fillable = [
        'user_id', 'zepp_user_id', 'access_token', 'refresh_token', 'expires_at',
        'status', 'connected_at', 'last_event_at', 'last_sync_at', 'last_error',
    ];

    protected $hidden = ['access_token', 'refresh_token'];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'expires_at' => 'datetime',
            'connected_at' => 'datetime',
            'last_event_at' => 'datetime',
            'last_sync_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'connected' && $this->access_token !== null;
    }
}
