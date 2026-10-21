<?php

namespace App\Services;

use App\Models\ActivityDay;
use App\Models\BodySample;
use App\Models\HeartRateDay;
use App\Models\HeartRateSample;
use App\Models\SkinTemperatureDay;
use App\Models\SleepSession;
use App\Models\User;
use App\Models\Workout;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

/**
 * Builds the read model served to the frontend. When several sources reported the same metric for
 * the same date, the most recently updated record wins. Missing measurements stay null.
 */
class FitnessQueryService
{
    /** @return list<array<string, mixed>> one entry per date in [from, to], oldest first */
    public function days(User $user, string $from, string $to): array
    {
        $sources = $user->dataSources()->pluck('key', 'id');
        $range = fn ($query) => $query->whereIn('data_source_id', $sources->keys())->whereBetween('date', [$from, $to]);

        $activity = $this->latestPerDate($range(ActivityDay::query())->get());
        $sleep = $this->latestPerDate($range(SleepSession::query())->get());
        $resting = $this->latestPerDate($range(HeartRateDay::query())->get());
        $samples = $this->latestPerDate($range(HeartRateSample::query())
            ->groupBy('date', 'data_source_id')
            ->selectRaw('date, data_source_id, min(bpm) as min_bpm, max(bpm) as max_bpm, avg(bpm) as avg_bpm, count(*) as sample_count, max(updated_at) as updated_at')
            ->get());
        // Workouts of the most recently updated source per date, so two sources never double-list a session.
        $workouts = $range(Workout::query())->orderBy('start_at')->get()->groupBy('date')
            ->map(fn (Collection $list) => $list->where('data_source_id', $list->sortBy('updated_at')->last()->data_source_id)->values());
        $body = fn (string $kind) => $this->latestPerDate($range(BodySample::query())->where('kind', $kind)
            ->groupBy('date', 'data_source_id')
            ->selectRaw('date, data_source_id, min(value) as min_value, max(value) as max_value, avg(value) as avg_value, count(*) as sample_count, max(updated_at) as updated_at')
            ->get());
        $stress = $body('stress');
        $spo2 = $body('spo2');
        $skin = $this->latestPerDate($range(SkinTemperatureDay::query())->get());
        $summary = fn ($row) => $row ? [
            'avg' => (int) round($row->avg_value),
            'min' => (int) $row->min_value,
            'max' => (int) $row->max_value,
            'sample_count' => (int) $row->sample_count,
            'source' => $sources[$row->data_source_id] ?? null,
        ] : null;

        $days = [];
        foreach (CarbonPeriod::create($from, $to) as $day) {
            $date = $day->toDateString();
            $a = $activity->get($date);
            $s = $sleep->get($date);
            $r = $resting->get($date);
            $hr = $samples->get($date);

            $days[] = [
                'date' => $date,
                'activity' => $a ? [
                    'steps' => $a->steps,
                    'distance_m' => $a->distance_m,
                    'active_kcal' => $a->active_kcal,
                    'active_minutes' => $a->active_minutes,
                    'source' => $sources[$a->data_source_id] ?? null,
                ] : null,
                'sleep' => $s ? $this->sleep($s, $user->timezone, $sources) : null,
                'heart_rate' => ($r || $hr) ? [
                    'resting_bpm' => $r?->resting_bpm,
                    'min_bpm' => $hr ? (int) $hr->min_bpm : null,
                    'max_bpm' => $hr ? (int) $hr->max_bpm : null,
                    'avg_bpm' => $hr ? (int) round($hr->avg_bpm) : null,
                    'sample_count' => $hr ? (int) $hr->sample_count : 0,
                    'source' => $sources[($hr ?? $r)->data_source_id] ?? null,
                ] : null,
                'workouts' => ($workouts->get($date) ?? collect())->map(fn (Workout $w) => [
                    'type' => $w->type,
                    'start_at' => $w->start_at->setTimezone($user->timezone)->toIso8601String(),
                    'end_at' => $w->end_at->setTimezone($user->timezone)->toIso8601String(),
                    'duration_min' => (int) $w->start_at->diffInMinutes($w->end_at),
                    'active_kcal' => $w->active_kcal,
                    'distance_m' => $w->distance_m,
                    'avg_bpm' => $w->avg_bpm,
                    'max_bpm' => $w->max_bpm,
                    'source' => $sources[$w->data_source_id] ?? null,
                ])->all(),
                'stress' => $summary($stress->get($date)),
                'spo2' => $summary($spo2->get($date)),
                'skin_temperature' => ($t = $skin->get($date)) ? ['deviation_c' => $t->deviation_c, 'source' => $sources[$t->data_source_id] ?? null] : null,
            ];
        }

        return $days;
    }

    /** @return list<array{at: string, bpm: int}> samples of the winning source for that date */
    public function heartRateSamples(User $user, string $date): array
    {
        $latest = HeartRateSample::forUser($user)->where('date', $date)
            ->orderByDesc('updated_at')->orderByDesc('id')->first();
        if (! $latest) {
            return [];
        }

        return HeartRateSample::where('data_source_id', $latest->data_source_id)->where('date', $date)
            ->orderBy('measured_at')->get()
            ->map(fn (HeartRateSample $s) => [
                'at' => $s->measured_at->setTimezone($user->timezone)->toIso8601String(),
                'bpm' => $s->bpm,
            ])->all();
    }

    /** @return list<array{at: string, value: int}> stress or SpO₂ readings of the winning source for that date */
    public function bodySamples(User $user, string $kind, string $date): array
    {
        $base = BodySample::forUser($user)->where('kind', $kind)->where('date', $date);
        $latest = (clone $base)->orderByDesc('updated_at')->orderByDesc('id')->first();

        return $latest ? $base->where('data_source_id', $latest->data_source_id)->orderBy('measured_at')->get()
            ->map(fn (BodySample $s) => ['at' => $s->measured_at->setTimezone($user->timezone)->toIso8601String(), 'value' => $s->value])
            ->all() : [];
    }

    /**
     * Per source: the latest local date with any data and which kinds of data were actually received.
     *
     * @return Collection<int, array{latest_date: string, received: list<string>}>
     */
    public function coverage(User $user): Collection
    {
        $kinds = [
            'activity' => ActivityDay::class,
            'workouts' => Workout::class,
            'sleep' => SleepSession::class,
            'resting_heart_rate' => HeartRateDay::class,
            'heart_rate' => HeartRateSample::class,
            'stress' => BodySample::class,
            'spo2' => BodySample::class,
            'skin_temperature' => SkinTemperatureDay::class,
        ];

        return collect($kinds)
            ->flatMap(fn ($model, $kind) => $model::forUser($user)
                ->when($model === BodySample::class, fn ($q) => $q->where('kind', $kind))
                ->groupBy('data_source_id')->selectRaw('data_source_id, max(date) as latest')->get()
                ->map(fn ($row) => ['source' => $row->data_source_id, 'kind' => $kind, 'latest' => $row->latest]))
            ->groupBy('source')
            ->map(fn ($rows) => ['latest_date' => $rows->max('latest'), 'received' => $rows->pluck('kind')->values()->all()]);
    }

    /** Most recent heart-rate reading from any source. This is the latest upload, not a live value. */
    public function latestHeartRate(User $user): ?array
    {
        $s = HeartRateSample::forUser($user)->orderByDesc('measured_at')->first();

        return $s ? [
            'at' => $s->measured_at->setTimezone($user->timezone)->toIso8601String(),
            'bpm' => $s->bpm,
            'source' => $user->dataSources()->whereKey($s->data_source_id)->value('key'),
        ] : null;
    }

    private function latestPerDate(Collection $rows): Collection
    {
        // keyBy keeps the last row per date, so sort ascending by recency first.
        return $rows->sortBy(fn ($row) => [(string) $row->updated_at, $row->id ?? 0])->keyBy('date');
    }

    private function sleep(SleepSession $s, string $timezone, Collection $sources): array
    {
        $stages = ['deep_min' => $s->deep_min, 'light_min' => $s->light_min, 'rem_min' => $s->rem_min, 'awake_min' => $s->awake_min];

        return [
            'start_at' => $s->start_at->setTimezone($timezone)->toIso8601String(),
            'end_at' => $s->end_at->setTimezone($timezone)->toIso8601String(),
            'duration_min' => (int) $s->start_at->diffInMinutes($s->end_at),
            'stages' => array_filter($stages, fn ($v) => $v !== null) ? $stages : null,
            'score' => $s->score,
            'source' => $sources[$s->data_source_id] ?? null,
        ];
    }

    /** Default range: the 30 days ending today in the user's timezone. */
    public static function defaultRange(User $user): array
    {
        $today = CarbonImmutable::now($user->timezone)->startOfDay();

        return [$today->subDays(29)->toDateString(), $today->toDateString()];
    }
}
