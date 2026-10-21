<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function update(UpdateUserRequest $request): UserResource
    {
        $user = $request->user();
        $data = $request->validated();
        // Only what was sent changes: each goal, tracker and the wearable is its own column.
        $attributes = array_intersect_key($data, array_flip(['name', 'timezone', 'birth_date']));
        foreach ($data['goals'] ?? [] as $goal => $value) {
            $attributes[User::GOALS[$goal]] = $value;
        }
        foreach ($data['preferences']['trackers'] ?? [] as $tracker => $on) {
            $attributes[User::TRACKERS[$tracker]] = $on;
        }
        if (array_key_exists('wearable', $data['preferences'] ?? [])) {
            $attributes['wearable_brand'] = $data['preferences']['wearable']['brand'] ?? null;
            $attributes['wearable_model'] = $data['preferences']['wearable']['model'] ?? null;
        }
        if ($data['onboarded'] ?? false) {
            $user->onboarded_at ??= now();
        }
        $user->update($attributes);

        return new UserResource($user);
    }
}
