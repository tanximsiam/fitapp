<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'timezone' => ['sometimes', 'timezone:all'],
            'birth_date' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after:1900-01-01', 'before:today'],
            'onboarded' => ['sometimes', 'accepted'],
            'goals' => ['sometimes', 'array:steps,active_kcal,distance_m,sleep_min,water_ml'],
            'goals.steps' => ['integer', 'between:100,100000'],
            'goals.active_kcal' => ['integer', 'between:10,10000'],
            'goals.distance_m' => ['integer', 'between:100,200000'],
            'goals.sleep_min' => ['integer', 'between:60,960'],
            'goals.water_ml' => ['integer', 'between:250,8000'],
            'preferences' => ['sometimes', 'array:trackers,wearable'],
            'preferences.trackers' => ['array:mood,food,hydration,cycle'],
            'preferences.trackers.*' => ['boolean'],
            'preferences.wearable' => ['nullable', 'array:brand,model'],
            'preferences.wearable.brand' => ['required_with:preferences.wearable', Rule::in(User::WEARABLE_BRANDS)],
            'preferences.wearable.model' => ['nullable', 'string', 'max:100'],
        ];
    }
}
