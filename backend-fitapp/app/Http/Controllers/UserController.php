<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
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
        if (isset($data['goals'])) {
            $data['goals'] = array_merge($user->effectiveGoals(), $data['goals']);
        }
        $user->update($data);

        return new UserResource($user);
    }
}
