<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
// use App\Models\User;
use App\Http\Resources\UserResource;

class AuthController extends BaseController
{
    /**
     * Handle login and issue token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return $this->sendError('Invalid credentials', [], 401);
        }

        // Ensure $user is an instance of App\Models\User with HasApiTokens
        $user = Auth::user();
        if (!$user instanceof \App\Models\User) {
            abort(500, 'Authenticated user is not valid');
}
        $token = $user->createToken('authToken')->plainTextToken;

        return $this->sendResponse([
            'user'  => new UserResource($user),
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * Handle logout (revoke current token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->sendResponse([], 'Successfully logged out');
    }
}
