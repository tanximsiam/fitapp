<?php

namespace App\Http\Controllers;

use App\Models\DataSource;
use App\Models\ZeppConnection;
use App\Services\Zepp\ZeppClient;
use App\Services\Zepp\ZeppSync;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/** Connecting a FitApp account to Zepp via OAuth 2.0 and managing that connection. */
class ZeppController extends Controller
{
    public const REQUIRED_ENV = ['ZEPP_CLIENT_ID', 'ZEPP_CLIENT_SECRET', 'ZEPP_WEBHOOK_TOKEN', 'ZEPP_REDIRECT_URI'];

    public function __construct(private ZeppClient $client) {}

    public function status(Request $request): JsonResponse
    {
        $connection = ZeppConnection::where('user_id', $request->user()->id)->first();
        $configured = ZeppClient::configured();

        return response()->json(['data' => [
            'configured' => $configured,
            'required_env' => self::REQUIRED_ENV,
            'redirect_uri' => config('zepp.redirect_uri'),
            // The real token is in the server's .env; it is never sent to the browser.
            'webhook_url' => url('/api/zepp/webhook').'/{ZEPP_WEBHOOK_TOKEN}',
            'connection' => $connection ? [
                'status' => $connection->status,
                'zepp_user_id' => Str::mask($connection->zepp_user_id, '*', 2, -2),
                'connected_at' => $connection->connected_at?->toIso8601ZuluString(),
                'last_event_at' => $connection->last_event_at?->toIso8601ZuluString(),
                'last_sync_at' => $connection->last_sync_at?->toIso8601ZuluString(),
                'last_error' => $connection->last_error,
            ] : null,
        ]]);
    }

    /** Returns the Zepp authorisation URL; the browser navigates there. */
    public function authorize(Request $request): JsonResponse
    {
        if (! ZeppClient::configured()) {
            return response()->json(['message' => 'Zepp is not configured on this server. Set '.implode(', ', self::REQUIRED_ENV).' in the backend .env.'], 409);
        }
        $state = Str::random(40);
        Cache::put("zepp_oauth:$state", $request->user()->id, now()->addMinutes(10));

        return response()->json(['data' => ['url' => $this->client->authorizeUrl($state)]]);
    }

    /** OAuth redirect target registered in the Zepp Developer Console. */
    public function callback(Request $request): RedirectResponse
    {
        $userId = $request->filled('state') ? Cache::pull('zepp_oauth:'.$request->query('state')) : null;
        if (! ZeppClient::configured() || ! $userId) {
            return $this->toFrontend('error', 'invalid-state');
        }
        if ($request->filled('error') || ! $request->filled('code')) {
            return $this->toFrontend('error', $request->query('error') === 'access_denied' ? 'denied' : 'no-code');
        }

        try {
            $tokens = $this->client->exchangeCode($request->query('code'));
            $profile = $this->client->profile($tokens['access_token']);
            $zeppUserId = (string) ($tokens['user_id'] ?? $profile['userId'] ?? '');
            if ($zeppUserId === '') {
                return $this->toFrontend('error', 'no-user');
            }
            if (ZeppConnection::where('zepp_user_id', $zeppUserId)->where('user_id', '!=', $userId)->exists()) {
                return $this->toFrontend('error', 'already-linked');
            }
            ZeppConnection::updateOrCreate(['user_id' => $userId], [
                'zepp_user_id' => $zeppUserId,
                'access_token' => $tokens['access_token'],
                'refresh_token' => $tokens['refresh_token'],
                'expires_at' => $this->client->expiry($tokens['expires_in']),
                'status' => 'connected',
                'connected_at' => now(),
                'last_error' => null,
            ]);
            DataSource::updateOrCreate(['user_id' => $userId, 'key' => ZeppSync::SOURCE_KEY], ['name' => 'Zepp', 'measurements' => ZeppSync::MEASUREMENTS]);
        } catch (Throwable $e) {
            Log::warning('Zepp OAuth callback failed', ['user' => $userId, 'error' => $e->getMessage()]);

            return $this->toFrontend('error', 'exchange-failed');
        }

        return $this->toFrontend('connected');
    }

    public function disconnect(Request $request): JsonResponse
    {
        $connection = ZeppConnection::where('user_id', $request->user()->id)->firstOrFail();
        try {
            if ($connection->isActive()) {
                $this->client->revoke($connection);
            }
        } catch (Throwable $e) {
            // Local tokens are removed regardless; the user can also revoke access in the Zepp app.
            Log::info('Zepp revoke failed', ['connection' => $connection->id, 'error' => $e->getMessage()]);
        }
        $connection->update(['status' => 'revoked', 'access_token' => null, 'refresh_token' => null]);

        return response()->json(['message' => 'Disconnected from Zepp. Data already received is kept.']);
    }

    /** Asks Zepp to re-deliver up to 30 days of sleep and activity history via the webhooks. */
    public function backfill(Request $request): JsonResponse
    {
        $days = (int) $request->validate(['days' => ['required', 'integer', 'between:1,30']])['days'];
        $connection = ZeppConnection::with('user')->where('user_id', $request->user()->id)->firstOrFail();
        abort_unless($connection->isActive(), 409, 'Zepp is not connected.');

        $end = now()->getTimestamp();
        $start = $end - $days * 86400 + 1;
        $requests = [];
        foreach (['sleeps', 'activities'] as $type) {
            try {
                $requests[$type] = $this->client->backfill($connection, $type, $start, $end)['requestId'] ?? null;
            } catch (Throwable $e) {
                return response()->json(['message' => "Zepp rejected the $type backfill request (HTTP ".($e->response?->status() ?? 'error').').'], 502);
            }
        }

        return response()->json(['data' => ['requests' => $requests, 'days' => $days]], 202);
    }

    private function toFrontend(string $result, ?string $reason = null): RedirectResponse
    {
        $query = http_build_query(array_filter(['zepp' => $result, 'reason' => $reason]));

        return redirect()->away(rtrim(config('zepp.frontend_url'), '/').'/device?'.$query);
    }
}
