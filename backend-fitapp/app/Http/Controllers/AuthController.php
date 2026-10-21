<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /** Issue a personal access token limited to the app's read/settings ability. */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            return response()->json(['message' => 'These credentials do not match our records.'], 401);
        }

        return self::signedIn($user, $request->validated('device_name'));
    }

    /** Which sign-in options this server offers, so the app only shows working buttons. */
    public function providers(): JsonResponse
    {
        return response()->json(['data' => [
            'registration' => (bool) config('auth.registration'),
            'google' => GoogleAuthController::configured(),
        ]]);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        abort_unless(config('auth.registration'), 403, 'New accounts are closed on this server.');
        $data = $request->validated();
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'timezone' => $data['timezone'] ?? 'UTC',
        ]);

        return self::signedIn($user, $data['device_name'] ?? null, 201);
    }

    /** The user and a new token with the app ability; shared by every way of signing in. */
    public static function signedIn(User $user, ?string $deviceName, int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $user->createToken($deviceName ?? 'web', ['app'])->plainTextToken,
            ],
        ], $status);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
