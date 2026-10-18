<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'timezone' => ['sometimes', 'timezone:all'],
            'goals' => ['sometimes', 'array:steps,active_kcal,distance_m,sleep_min'],
            'goals.steps' => ['integer', 'between:100,100000'],
            'goals.active_kcal' => ['integer', 'between:10,10000'],
            'goals.distance_m' => ['integer', 'between:100,200000'],
            'goals.sleep_min' => ['integer', 'between:60,960'],
        ];
    }
}
