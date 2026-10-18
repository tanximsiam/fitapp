<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HydrationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'recorded_at' => JournalRules::INSTANT,
            'volume_ml' => ['required', 'integer', 'between:10,5000'],
            'updated_at' => JournalRules::SEEN,
        ];
    }
}
