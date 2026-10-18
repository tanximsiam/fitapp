<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/** Validates the ingestion contract documented in docs/openapi.yaml (IngestPayload). */
class IngestRequest extends FormRequest
{
    /** ISO 8601 instant with an explicit offset; naive local times are ambiguous and rejected. */
    private const INSTANT = ['required', 'date', 'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/'];

    public const MEASUREMENTS = ['steps', 'distance', 'active_energy', 'active_minutes', 'workouts', 'sleep', 'sleep_stages', 'sleep_score', 'heart_rate', 'resting_heart_rate'];

    private const DAY = ['required', 'date_format:Y-m-d', 'distinct'];

    public function rules(): array
    {
        return [
            'source' => ['required', 'array'],
            'source.key' => ['required', 'string', 'regex:/^[a-z0-9][a-z0-9._-]{0,63}$/'],
            'source.name' => ['required', 'string', 'max:100'],
            'source.device' => ['nullable', 'string', 'max:100'],
            'source.measurements' => ['nullable', 'array'],
            'source.measurements.*' => ['distinct', 'in:'.implode(',', self::MEASUREMENTS)],
            'timezone' => ['nullable', 'timezone:all'],

            'activity' => ['array', 'max:400', 'required_without_all:sleep,heart_rate,workouts'],
            'activity.*.date' => self::DAY,
            'activity.*.steps' => ['nullable', 'integer', 'between:0,200000'],
            'activity.*.distance_m' => ['nullable', 'numeric', 'between:0,500000'],
            'activity.*.active_kcal' => ['nullable', 'numeric', 'between:0,20000'],
            'activity.*.active_minutes' => ['nullable', 'integer', 'between:0,1440'],

            'sleep' => ['array', 'max:400'],
            'sleep.*.date' => self::DAY,
            'sleep.*.start_at' => self::INSTANT,
            'sleep.*.end_at' => self::INSTANT,
            'sleep.*.score' => ['nullable', 'integer', 'between:0,100'],
            'sleep.*.stages' => ['nullable', 'array'],
            'sleep.*.stages.deep_min' => ['nullable', 'integer', 'between:0,1440'],
            'sleep.*.stages.light_min' => ['nullable', 'integer', 'between:0,1440'],
            'sleep.*.stages.rem_min' => ['nullable', 'integer', 'between:0,1440'],
            'sleep.*.stages.awake_min' => ['nullable', 'integer', 'between:0,1440'],

            'workouts' => ['array', 'max:400'],
            'workouts.*.date' => ['required', 'date_format:Y-m-d'],
            'workouts.*.start_at' => self::INSTANT,
            'workouts.*.end_at' => self::INSTANT,
            'workouts.*.type' => ['required', 'string', 'regex:/^[a-z][a-z_]{1,31}$/'],
            'workouts.*.active_kcal' => ['nullable', 'numeric', 'between:0,10000'],
            'workouts.*.distance_m' => ['nullable', 'numeric', 'between:0,500000'],
            'workouts.*.avg_bpm' => ['nullable', 'integer', 'between:20,250'],
            'workouts.*.max_bpm' => ['nullable', 'integer', 'between:20,250'],

            'heart_rate' => ['array'],
            'heart_rate.resting' => ['array', 'max:400'],
            'heart_rate.resting.*.date' => self::DAY,
            'heart_rate.resting.*.bpm' => ['required', 'integer', 'between:20,250'],
            'heart_rate.samples' => ['array', 'max:10000'],
            'heart_rate.samples.*.at' => self::INSTANT,
            'heart_rate.samples.*.bpm' => ['required', 'integer', 'between:20,250'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            foreach (['sleep', 'workouts'] as $kind) {
                foreach ((array) $this->input($kind, []) as $i => $item) {
                    $this->checkSpan($validator, "$kind.$i.end_at", $item);
                }
            }
        }];
    }

    /** Sleep and workouts must end after they start and last at most 24 hours. */
    private function checkSpan(Validator $validator, string $field, mixed $item): void
    {
        $item = (array) $item;
        try {
            $start = CarbonImmutable::parse($item['start_at'] ?? '');
            $end = CarbonImmutable::parse($item['end_at'] ?? '');
        } catch (\Throwable) {
            return; // already reported by the field rules
        }
        $minutes = $start->diffInMinutes($end, false);
        if ($minutes <= 0 || $minutes > 24 * 60) {
            $validator->errors()->add($field, 'The end must be after the start and at most 24 hours later.');
        }
    }
}
