<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Sign in with Google (OpenID Connect authorization-code flow). Off until GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET are set; setup in docs/google-sign-in.md.
 *
 * 1. The app opens /auth/google/redirect?return=<where to come back> in the browser.
 * 2. Google sends the person to /auth/google/callback. The backend finds or creates the account and
 *    returns to the app with a one-time code, so the token itself never appears in a URL.
 * 3. The app trades the code for an app token at POST /auth/google/token.
 */
class GoogleAuthController extends Controller
{
    private const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    public static function configured(): bool
    {
        return filled(config('services.google.client_id')) && filled(config('services.google.client_secret'));
    }

    public function redirect(Request $request): RedirectResponse
    {
        abort_unless(self::configured(), 404, 'Google sign-in is not set up on this server.');
        $return = (string) $request->query('return', '');
        abort_unless($this->allowedReturn($return), 422, 'This return address is not allowed.');

        $state = Str::random(40);
        Cache::put("google:state:$state", $return, now()->addMinutes(10));

        return redirect()->away(self::AUTH_URL.'?'.http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => $this->callbackUrl(),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ]));
    }

    public function callback(Request $request): RedirectResponse
    {
        abort_unless(self::configured(), 404, 'Google sign-in is not set up on this server.');
        $return = Cache::pull('google:state:'.$request->query('state'));
        abort_unless(is_string($return), 400, 'This sign-in link has expired. Start again from the app.');

        if (! $request->filled('code')) {
            return $this->back($return, ['error' => 'Google sign-in was cancelled.']);
        }
        $claims = $this->claims((string) $request->query('code'));
        if (! $claims) {
            return $this->back($return, ['error' => 'Google sign-in failed. Try again.']);
        }
        if (! filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return $this->back($return, ['error' => 'Your Google account email is not verified.']);
        }

        // Google has verified the email, so an existing account with it is the same person.
        $user = User::where('google_id', $claims['sub'])->first() ?? User::where('email', $claims['email'])->first();
        if (! $user) {
            if (! config('auth.registration')) {
                return $this->back($return, ['error' => 'New accounts are closed on this server.']);
            }
            $user = User::create([
                'name' => $claims['name'] ?? strstr($claims['email'], '@', true),
                'email' => $claims['email'],
                // Never used: this account signs in with Google until a password is set.
                'password' => Str::random(40),
            ]);
        }
        if (! $user->google_id) {
            $user->forceFill(['google_id' => $claims['sub'], 'email_verified_at' => $user->email_verified_at ?? now()])->save();
        }

        $code = Str::random(40);
        Cache::put("google:code:$code", $user->id, now()->addMinutes(2));

        return $this->back($return, ['code' => $code]);
    }

    public function token(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);
        $id = Cache::pull('google:code:'.$data['code']);
        $user = $id ? User::find($id) : null;
        if (! $user) {
            return response()->json(['message' => 'This sign-in code has expired. Start again.'], 401);
        }

        return AuthController::signedIn($user, $data['device_name'] ?? null);
    }

    /** Validated ID token claims for an authorization code, or null. */
    private function claims(string $code): ?array
    {
        $response = Http::asForm()->post(self::TOKEN_URL, [
            'code' => $code,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => $this->callbackUrl(),
            'grant_type' => 'authorization_code',
        ]);
        $idToken = $response->json('id_token');
        if ($response->failed() || ! is_string($idToken)) {
            return null;
        }

        // Received directly from Google's token endpoint over TLS, so the signature check is not needed (OpenID Connect Core 3.1.3.7).
        $claims = json_decode(base64_decode(strtr(explode('.', $idToken)[1] ?? '', '-_', '+/')), true);
        $valid = is_array($claims)
            && in_array($claims['iss'] ?? null, ['https://accounts.google.com', 'accounts.google.com'], true)
            && ($claims['aud'] ?? null) === config('services.google.client_id')
            && ($claims['exp'] ?? 0) > time()
            && isset($claims['sub'], $claims['email']);

        return $valid ? $claims : null;
    }

    private function callbackUrl(): string
    {
        return config('services.google.redirect') ?: url('/api/auth/google/callback');
    }

    /** The app's own URL scheme or a CORS-allowed frontend origin, so a code is never sent elsewhere. */
    private function allowedReturn(string $url): bool
    {
        if (str_starts_with($url, config('services.google.app_scheme').'://')) {
            return true;
        }
        $parts = parse_url($url);
        if (! isset($parts['scheme'], $parts['host'])) {
            return false;
        }
        $origin = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');

        return in_array($origin, config('cors.allowed_origins'), true);
    }

    private function back(string $return, array $query): RedirectResponse
    {
        return redirect()->away($return.(str_contains($return, '?') ? '&' : '?').http_build_query($query));
    }
}
