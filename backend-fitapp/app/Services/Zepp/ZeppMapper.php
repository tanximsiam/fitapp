<?php

namespace App\Services\Zepp;

use Carbon\CarbonImmutable;

/**
 * Maps Zepp Open Platform payloads (as documented at devopen.zepp.com) to FitApp's ingestion
 * contract. Field names follow Zepp's docs; anything Zepp does not send stays absent, not zero.
 */
class ZeppMapper
{
    /** Zepp activity types → FitApp workout types. Unknown types are kept in snake case. */
    private const ACTIVITY_TYPES = [
        'OUTDOOR_RUN' => 'running', 'INDOOR_RUN' => 'running', 'TREADMILL' => 'running', 'TRAIL_RUN' => 'running',
        'OUTDOOR_CYCLING' => 'cycling', 'INDOOR_CYCLING' => 'cycling',
        'WALKING' => 'walking', 'OUTDOOR_WALK' => 'walking', 'INDOOR_WALK' => 'walking', 'HIKING' => 'hiking',
        'POOL_SWIMMING' => 'swimming', 'OPEN_WATER_SWIMMING' => 'swimming',
        'STRENGTH_TRAINING' => 'strength',
    ];

    /** FIT `sport` enum values used when the ping carries no activity type. */
    private const FIT_SPORTS = [1 => 'running', 2 => 'cycling', 5 => 'swimming', 11 => 'walking', 17 => 'hiking', 10 => 'training'];

    public function dailies(array $dailies): array
    {
        $activity = [];
        $resting = [];
        foreach ($dailies as $d) {
            if (empty($d['calendarDate'])) {
                continue;
            }
            $row = ['date' => $d['calendarDate']];
            foreach (['steps' => 'steps', 'distanceInMeters' => 'distance_m', 'activeKilocalories' => 'active_kcal'] as $from => $to) {
                if (array_key_exists($from, $d) && $d[$from] !== null) {
                    $row[$to] = $d[$from];
                }
            }
            if (count($row) > 1) {
                $activity[] = $row;
            }
            if (! empty($d['restingHeartRateInBeatsPerMinute'])) {
                $resting[] = ['date' => $d['calendarDate'], 'bpm' => (int) $d['restingHeartRateInBeatsPerMinute']];
            }
        }

        return array_filter(['activity' => $activity, 'heart_rate' => $resting ? ['resting' => $resting] : []]);
    }

    public function sleeps(array $sleeps): array
    {
        $out = [];
        foreach ($sleeps as $s) {
            if (! isset($s['startTimeInSeconds'], $s['durationInSeconds'])) {
                continue;
            }
            $offset = (int) ($s['startTimeOffsetInSeconds'] ?? 0);
            $awake = (int) ($s['awakeDurationInSeconds'] ?? 0);
            // durationInSeconds is time asleep; awake time is added to get the time in bed.
            $start = $this->local((int) $s['startTimeInSeconds'], $offset);
            $end = $this->local((int) $s['startTimeInSeconds'] + (int) $s['durationInSeconds'] + $awake, $offset);
            $minutes = fn (?string $key) => isset($s[$key]) ? (int) round($s[$key] / 60) : null;
            $out[] = [
                'date' => $end->toDateString(), // FitApp keys a night by the local date it ended
                'start_at' => $start->toIso8601String(),
                'end_at' => $end->toIso8601String(),
                'score' => isset($s['overallSleepScore']['value']) ? (int) $s['overallSleepScore']['value'] : null,
                'stages' => [
                    'deep_min' => $minutes('deepSleepDurationInSeconds'),
                    'light_min' => $minutes('lightSleepDurationInSeconds'),
                    'rem_min' => $minutes('remSleepInSeconds'),
                    'awake_min' => $minutes('awakeDurationInSeconds'),
                ],
            ];
        }

        return $out ? ['sleep' => $out] : [];
    }

    /**
     * Pulse Ox events: `timeOffsetPulseOxValues` maps seconds after `startTimeInSeconds` to SpO₂ %.
     * Spot readings have a single "0" entry.
     */
    public function pulseOx(array $records): array
    {
        $samples = [];
        foreach ($records as $r) {
            if (! isset($r['startTimeInSeconds']) || ! is_array($r['timeOffsetPulseOxValues'] ?? null)) {
                continue;
            }
            $offset = (int) ($r['startTimeOffsetInSeconds'] ?? 0);
            foreach ($r['timeOffsetPulseOxValues'] as $seconds => $percent) {
                if (is_numeric($percent) && $percent >= 70 && $percent <= 100) {
                    $samples[] = ['at' => $this->local((int) $r['startTimeInSeconds'] + (int) $seconds, $offset)->toIso8601String(), 'percent' => (int) $percent];
                }
            }
        }

        return $samples ? ['spo2' => ['samples' => $samples]] : [];
    }

    /** Skin temperature events: `avgDeviationCelsius` is the deviation from the wearer's baseline. */
    public function skinTemperature(array $records): array
    {
        $nights = [];
        foreach ($records as $r) {
            if (! empty($r['calendarDate']) && is_numeric($r['avgDeviationCelsius'] ?? null) && abs($r['avgDeviationCelsius']) <= 5) {
                $nights[] = ['date' => $r['calendarDate'], 'deviation_c' => round((float) $r['avgDeviationCelsius'], 2)];
            }
        }

        return $nights ? ['skin_temperature' => $nights] : [];
    }

    /** Readings from GET /users/-/heartrates. */
    public function heartRates(array $items, string $timezone): array
    {
        $samples = [];
        foreach ($items as $i) {
            $bpm = (int) ($i['heartRateData'] ?? 0);
            if (! isset($i['timestamp']) || $bpm < 20 || $bpm > 250) {
                continue;
            }
            $samples[] = ['at' => CarbonImmutable::createFromTimestamp((int) $i['timestamp'], $timezone)->toIso8601String(), 'bpm' => $bpm];
        }

        return $samples ? ['heart_rate' => ['samples' => $samples]] : [];
    }

    /** One workout from an activity ping and the session summary of its FIT file. */
    public function workout(array $ping, array $session, string $timezone): ?array
    {
        $startTs = $session['start'] ?? ($ping['startTimeInSeconds'] ?? null);
        if (! $startTs || empty($session['elapsed_s'])) {
            return null;
        }
        $start = CarbonImmutable::createFromTimestamp((int) $startTs, $timezone);
        $end = $start->addSeconds((int) round($session['elapsed_s']));

        return ['workouts' => [[
            'date' => $start->toDateString(),
            'type' => $this->activityType($ping['activityType'] ?? null, $session['sport'] ?? null),
            'start_at' => $start->toIso8601String(),
            'end_at' => $end->toIso8601String(),
            'active_kcal' => $session['kcal'],
            'distance_m' => $session['distance_m'],
            'avg_bpm' => $session['avg_bpm'],
            'max_bpm' => $session['max_bpm'],
        ]]];
    }

    public function activityType(?string $zeppType, ?int $fitSport): string
    {
        if ($zeppType && isset(self::ACTIVITY_TYPES[$zeppType])) {
            return self::ACTIVITY_TYPES[$zeppType];
        }
        if ($zeppType) {
            $snake = trim(preg_replace('/[^a-z_]+/', '_', strtolower($zeppType)), '_');
            if (preg_match('/^[a-z][a-z_]{1,31}$/', $snake)) {
                return $snake;
            }
        }

        return self::FIT_SPORTS[$fitSport] ?? 'workout';
    }

    private function local(int $unix, int $offsetSeconds): CarbonImmutable
    {
        return CarbonImmutable::createFromTimestamp($unix, $this->offsetName($offsetSeconds));
    }

    private function offsetName(int $seconds): string
    {
        $sign = $seconds < 0 ? '-' : '+';
        $abs = abs($seconds);

        return sprintf('%s%02d:%02d', $sign, intdiv($abs, 3600), intdiv($abs % 3600, 60));
    }
}
