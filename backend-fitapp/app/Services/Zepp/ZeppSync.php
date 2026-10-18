<?php

namespace App\Services\Zepp;

use App\Http\Requests\IngestRequest;
use App\Jobs\FetchZeppActivityFile;
use App\Models\ZeppConnection;
use App\Services\IngestionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * Turns Zepp deliveries into FitApp data. Everything goes through the same validated ingestion
 * contract as any other source, under the source key "zepp".
 */
class ZeppSync
{
    public const SOURCE_KEY = 'zepp';

    /** What a Zepp account can provide through the documented events and APIs. */
    public const MEASUREMENTS = ['steps', 'distance', 'active_energy', 'workouts', 'sleep', 'sleep_stages', 'sleep_score', 'heart_rate', 'resting_heart_rate'];

    public function __construct(private ZeppClient $client, private ZeppMapper $mapper, private IngestionService $ingestion) {}

    /**
     * Handles one webhook delivery. The body is a JSON array of JSON-encoded strings, each holding
     * one of: dailies, sleeps, activityFiles, or an authorizationChange event.
     *
     * @return array<string, int> counts by kind, for the response and logs
     */
    public function handleWebhook(string $body): array
    {
        $counts = ['dailies' => 0, 'sleeps' => 0, 'activityFiles' => 0, 'authorizationChange' => 0, 'ignored' => 0];
        $outer = json_decode($body, true);
        if (! is_array($outer)) {
            throw new \InvalidArgumentException('Webhook body is not a JSON array.');
        }

        foreach ($outer as $element) {
            $event = is_string($element) ? json_decode($element, true) : $element;
            if (! is_array($event)) {
                $counts['ignored']++;

                continue;
            }

            if (($event['eventType'] ?? null) === 'authorizationChange') {
                $connection = $this->connectionFor($event['userId'] ?? null);
                if ($connection && ($event['changeType'] ?? null) === 'delete') {
                    $connection->update(['status' => 'revoked', 'access_token' => null, 'refresh_token' => null, 'last_event_at' => now()]);
                }
                $counts['authorizationChange']++;

                continue;
            }

            foreach (['dailies', 'sleeps', 'activityFiles'] as $kind) {
                foreach ($event[$kind] ?? [] as $record) {
                    $connection = $this->connectionFor($record['userId'] ?? null);
                    if (! $connection) {
                        $counts['ignored']++;

                        continue;
                    }
                    $connection->update(['last_event_at' => now()]);
                    match ($kind) {
                        'dailies' => $this->ingest($connection, $this->mapper->dailies([$record])),
                        'sleeps' => $this->ingest($connection, $this->mapper->sleeps([$record])),
                        // Pull later: Zepp expects a fast 2xx, and the download URL stays valid for 24 h.
                        'activityFiles' => FetchZeppActivityFile::dispatch($connection->id, $record),
                    };
                    $counts[$kind]++;
                }
            }
            // HRV, Pulse Ox, skin temperature, nutrition and other events are not part of FitApp's contract yet.
            if (! array_intersect(array_keys($event), ['dailies', 'sleeps', 'activityFiles'])) {
                $counts['ignored']++;
            }
        }

        return $counts;
    }

    /** Downloads and stores one activity file. Repeated pings for the same summaryId are skipped. */
    public function processActivityFile(ZeppConnection $connection, array $ping): bool
    {
        $summaryId = (string) ($ping['summaryId'] ?? '');
        if ($summaryId === '' || empty($ping['callbackURL'])) {
            return false;
        }
        if (DB::table('zepp_processed_files')->where(['zepp_connection_id' => $connection->id, 'summary_id' => $summaryId])->exists()) {
            return false;
        }

        $fit = $this->client->downloadFit($connection, $ping['callbackURL']);
        $timezone = $connection->user->timezone;
        foreach ((new FitParser)->sessions($fit) as $session) {
            $workout = $this->mapper->workout($ping, $session, $timezone);
            if ($workout) {
                $this->ingest($connection, $workout, $ping['deviceName'] ?? null);
            }
        }
        DB::table('zepp_processed_files')->insert(['zepp_connection_id' => $connection->id, 'summary_id' => $summaryId, 'created_at' => now(), 'updated_at' => now()]);

        return true;
    }

    /** Scheduled pull: minute heart-rate readings for the last few days (refreshing tokens as needed). */
    public function pullHeartRates(ZeppConnection $connection): int
    {
        $tz = $connection->user->timezone;
        $end = now($tz)->toDateString();
        $start = now($tz)->subDays(max(1, config('zepp.heart_rate_days')) - 1)->toDateString();
        try {
            $part = $this->mapper->heartRates($this->client->heartRates($connection, $start, $end, $tz), $tz);
            $this->ingest($connection, $part);
            $connection->update(['last_sync_at' => now(), 'last_error' => null]);

            return count($part['heart_rate']['samples'] ?? []);
        } catch (Throwable $e) {
            $connection->update(['last_error' => mb_substr('Heart-rate sync failed: '.$e->getMessage(), 0, 255)]);
            Log::warning('Zepp heart-rate sync failed', ['connection' => $connection->id, 'error' => $e->getMessage()]);

            return 0;
        }
    }

    /** Validates against the public ingestion contract, then stores. */
    public function ingest(ZeppConnection $connection, array $part, ?string $device = null): void
    {
        if (! array_intersect(array_keys($part), ['activity', 'sleep', 'heart_rate', 'workouts'])) {
            return;
        }
        $source = ['key' => self::SOURCE_KEY, 'name' => 'Zepp', 'measurements' => self::MEASUREMENTS];
        if ($device) {
            $source['device'] = mb_substr($device, 0, 100);
        }
        $payload = ['source' => $source, 'timezone' => $connection->user->timezone] + $part;
        $validated = Validator::make($payload, (new IngestRequest)->rules())->validate();
        $this->ingestion->ingest($connection->user, $validated);
    }

    private function connectionFor(?string $zeppUserId): ?ZeppConnection
    {
        return $zeppUserId ? ZeppConnection::with('user')->where('zepp_user_id', $zeppUserId)->where('status', 'connected')->first() : null;
    }
}
