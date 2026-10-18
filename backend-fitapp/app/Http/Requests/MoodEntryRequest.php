<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MoodEntryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'recorded_at' => JournalRules::INSTANT,
            'mood' => ['required', 'integer', 'between:1,5'],
            'energy' => ['nullable', 'integer', 'between:1,5'],
            'stress' => ['nullable', 'integer', 'between:1,5'],
            'emotions' => ['nullable', 'array', 'max:10'],
            'emotions.*' => ['distinct', 'string', 'regex:/^[a-z][a-z -]{1,23}$/'],
            'note' => JournalRules::NOTE,
            'updated_at' => JournalRules::SEEN,
        ];
    }
}
