<?php

namespace App\Http\Requests;

use App\Models\CycleDay;
use Illuminate\Foundation\Http\FormRequest;

class CycleDayRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'flow' => ['nullable', 'required_without_all:symptoms,note', 'in:'.implode(',', CycleDay::FLOWS)],
            'symptoms' => ['nullable', 'array', 'max:10'],
            'symptoms.*' => ['distinct', 'in:'.implode(',', CycleDay::SYMPTOMS)],
            'note' => JournalRules::NOTE,
            'updated_at' => JournalRules::SEEN,
        ];
    }
}
