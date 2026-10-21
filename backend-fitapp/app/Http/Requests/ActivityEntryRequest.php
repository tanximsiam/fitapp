<?php

namespace App\Http\Requests;

use App\Models\ActivityEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActivityEntryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'started_at' => JournalRules::INSTANT,
            'activity_type' => ['required', Rule::in(ActivityEntry::TYPES)],
            'duration_min' => ['required', 'integer', 'between:1,1440'],
            'energy_kcal' => ['nullable', 'integer', 'between:0,5000'],
            'energy_source' => ['nullable', 'required_with:energy_kcal', Rule::in(ActivityEntry::ENERGY_SOURCES)],
            'updated_at' => JournalRules::SEEN,
        ];
    }
}
