<?php

namespace App\Jobs;

use App\Models\ZeppConnection;
use App\Services\Zepp\ZeppSync;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/** Pulls an activity FIT file announced by a Zepp activity ping and stores its workout. */
class FetchZeppActivityFile implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [60, 300];

    public function __construct(public int $connectionId, public array $ping) {}

    public function handle(ZeppSync $sync): void
    {
        $connection = ZeppConnection::with('user')->find($this->connectionId);
        if (! $connection?->isActive()) {
            return;
        }
        try {
            $sync->processActivityFile($connection, $this->ping);
            $connection->update(['last_sync_at' => now(), 'last_error' => null]);
        } catch (Throwable $e) {
            $connection->update(['last_error' => mb_substr('Activity file download failed: '.$e->getMessage(), 0, 255)]);
            throw $e;
        }
    }
}
