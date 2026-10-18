<?php

namespace App\Services;

use App\Models\ActivityDay;
use App\Models\DataSource;
use App\Models\HeartRateDay;
use App\Models\HeartRateSample;
use App\Models\SleepSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Writes a validated upload. Every record is keyed by (source, local date) or (source, instant),
 * so re-sending the same or an updated payload replaces values instead of adding to them.
 */
class IngestionService
{
    private const ACTIVITY_FIELDS = ['steps', 'distance_m', 'active_kcal', 'active_minutes'];

    private const STAGE_FIELDS = ['deep_min', 'light_min', 'rem_min', 'awake_min'];

    /** @return array{source: DataSource, received: array<string, int>} */
    public function ingest(User $user, array $payload): array
    {
        $timezone = $payload['timezone'] ?? $user->timezone;

        return DB::transaction(function () use ($user, $payload, $timezone) {
            $source = DataSource::updateOrCreate(
                ['user_id' => $user->id, 'key' => $payload['source']['key']],
                ['name' => $payload['source']['name']],
            );
            $owner = ['user_id' => $user->id, 'data_source_id' => $source->id];

            foreach ($payload['activity'] ?? [] as $day) {
                // Only fields present in the upload are changed; explicit nulls clear a value.
                $values = array_map(
                    fn ($v) => $v === null ? null : (int) round($v),
                    array_intersect_key($day, array_flip(self::ACTIVITY_FIELDS)),
                );
                ActivityDay::updateOrCreate($owner + ['date' => $day['date']], $values);
            }

            foreach ($payload['sleep'] ?? [] as $night) {
                $stages = $night['stages'] ?? [];
                SleepSession::updateOrCreate($owner + ['date' => $night['date']], [
                    'start_at' => $this->utc($night['start_at']),
                    'end_at' => $this->utc($night['end_at']),
                    'score' => $night['score'] ?? null,
                ] + array_map(fn ($f) => $stages[$f] ?? null, array_combine(self::STAGE_FIELDS, self::STAGE_FIELDS)));
            }

            foreach ($payload['heart_rate']['resting'] ?? [] as $day) {
                HeartRateDay::updateOrCreate($owner + ['date' => $day['date']], ['resting_bpm' => $day['bpm']]);
            }

            $now = now();
            $samples = array_map(function ($s) use ($owner, $timezone, $now) {
                $at = CarbonImmutable::parse($s['at']);

                return $owner + [
                    'date' => $at->setTimezone($timezone)->toDateString(),
                    'measured_at' => $at->utc()->format('Y-m-d H:i:s'),
                    'bpm' => $s['bpm'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }, $payload['heart_rate']['samples'] ?? []);
            // The same instant twice in one upload: last value wins (some databases reject duplicate keys in one upsert).
            $samples = array_values(array_column($samples, null, 'measured_at'));
            foreach (array_chunk($samples, 500) as $chunk) {
                HeartRateSample::upsert($chunk, ['data_source_id', 'measured_at'], ['bpm', 'date', 'updated_at']);
            }

            $source->update(['last_ingested_at' => $now]);

            return [
                'source' => $source,
                'received' => [
                    'activity_days' => count($payload['activity'] ?? []),
                    'sleep_sessions' => count($payload['sleep'] ?? []),
                    'resting_heart_rate_days' => count($payload['heart_rate']['resting'] ?? []),
                    'heart_rate_samples' => count($samples),
                ],
            ];
        });
    }

    private function utc(string $instant): string
    {
        return CarbonImmutable::parse($instant)->utc()->format('Y-m-d H:i:s');
    }
}
