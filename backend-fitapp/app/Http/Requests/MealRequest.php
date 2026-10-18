<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MealRequest extends FormRequest
{
    public const TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

    public function rules(): array
    {
        return [
            'eaten_at' => JournalRules::INSTANT,
            'meal_type' => ['required', 'in:'.implode(',', self::TYPES)],
            'note' => JournalRules::NOTE,
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.name' => ['required', 'string', 'max:100'],
            'items.*.quantity' => ['nullable', 'numeric', 'gt:0', 'max:100000'],
            'items.*.unit' => ['nullable', 'string', 'max:20'],
            'items.*.energy_kcal' => ['nullable', 'numeric', 'between:0,5000'],
            'items.*.protein_g' => ['nullable', 'numeric', 'between:0,1000'],
            'items.*.carbs_g' => ['nullable', 'numeric', 'between:0,1000'],
            'items.*.fat_g' => ['nullable', 'numeric', 'between:0,1000'],
            'updated_at' => JournalRules::SEEN,
        ];
    }
}
