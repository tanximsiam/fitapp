<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class FitnessRangeRequest extends FormRequest
{
    public const MAX_DAYS = 366;

    public function rules(): array
    {
        return [
            'from' => ['required_with:to', 'date_format:Y-m-d'],
            'to' => ['required_with:from', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty() || ! $this->filled('from')) {
                return;
            }
            $days = CarbonImmutable::parse($this->input('from'))->diffInDays(CarbonImmutable::parse($this->input('to'))) + 1;
            if ($days > self::MAX_DAYS) {
                $validator->errors()->add('to', 'The range may span at most '.self::MAX_DAYS.' days.');
            }
        }];
    }
}
