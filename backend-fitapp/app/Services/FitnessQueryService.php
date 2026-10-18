<?php

namespace App\Services;

use App\Models\ActivityDay;
use App\Models\HeartRateDay;
use App\Models\HeartRateSample;
use App\Models\SleepSession;
use App\Models\User;
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
        $range = fn ($query) => $query->where('user_id', $user->id)->whereBetween('date', [$from, $to]);

        $activity = $this->latestPerDate($range(ActivityDay::query())->get());
        $sleep = $this->latestPerDate($range(SleepSession::query())->get());
        $resting = $this->latestPerDate($range(HeartRateDay::query())->get());
        $samples = $this->latestPerDate($range(HeartRateSample::query())
            ->groupBy('date', 'data_source_id')
            ->selectRaw('date, data_source_id, min(bpm) as min_bpm, max(bpm) as max_bpm, avg(bpm) as avg_bpm, count(*) as sample_count, max(updated_at) as updated_at')
            ->get());

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
            ];
        }

        return $days;
    }

    /** @return list<array{at: string, bpm: int}> samples of the winning source for that date */
    public function heartRateSamples(User $user, string $date): array
    {
        $latest = HeartRateSample::where('user_id', $user->id)->where('date', $date)
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

    /** Latest local date each source has delivered any data for. */
    public function latestDates(User $user): Collection
    {
        return collect([ActivityDay::class, SleepSession::class, HeartRateDay::class, HeartRateSample::class])
            ->flatMap(fn ($model) => $model::where('user_id', $user->id)
                ->groupBy('data_source_id')->selectRaw('data_source_id, max(date) as latest')->get())
            ->groupBy('data_source_id')
            ->map(fn ($rows) => $rows->max('latest'));
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
