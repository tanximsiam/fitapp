<?php

namespace App\Services\Zepp;

use App\Models\ZeppConnection;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * HTTP calls to the Zepp Thirdparty Open Platform, following its published documentation
 * (OAuth 2.0 authorization code flow, Bearer tokens, api-open.zepp.com). Not yet exercised against
 * the live service; every URL is configurable in config/zepp.php.
 */
class ZeppClient
{
    public static function configured(): bool
    {
        return filled(config('zepp.client_id')) && filled(config('zepp.client_secret')) && filled(config('zepp.webhook_token'));
    }

    /** Zepp's authorize page keeps its parameters in the URL fragment (after "#/login"). */
    public function authorizeUrl(string $state): string
    {
        $query = http_build_query([
            'client_id' => config('zepp.client_id'),
            'response_type' => 'code',
            'state' => $state,
        ]);

        // `token=["access","refresh"]` asks for a refresh token as well.
        return config('zepp.authorize_url').'?'.$query.'&token=%5B%22access%22,%22refresh%22%5D';
    }

    /** @return array{access_token: string, refresh_token: ?string, expires_in: ?int, user_id: ?string} */
    public function exchangeCode(string $code): array
    {
        return $this->tokenRequest(config('zepp.token_url'), [
            'grant_type' => 'authorization_code',
            'redirect_uri' => config('zepp.redirect_uri'),
            'code' => $code,
        ]);
    }

    /** Returns a valid access token, refreshing it shortly before it expires. */
    public function accessToken(ZeppConnection $connection): string
    {
        if (! $connection->isActive()) {
            throw new RuntimeException('Zepp is not connected for this user.');
        }
        if ($connection->expires_at && $connection->expires_at->subMinute()->isPast() && $connection->refresh_token) {
            // Zepp expects the refresh token both as the Bearer credential and as a form field.
            $tokens = $this->tokenRequest(config('zepp.refresh_url'), [
                'grant_type' => 'refresh_token',
                'refresh_token' => $connection->refresh_token,
            ], $connection->refresh_token);
            $connection->update([
                'access_token' => $tokens['access_token'],
                // The service currently returns the same refresh token; store whatever comes back.
                'refresh_token' => $tokens['refresh_token'] ?? $connection->refresh_token,
                'expires_at' => $this->expiry($tokens['expires_in']),
            ]);
        }

        return $connection->access_token;
    }

    public function profile(string $accessToken): array
    {
        return $this->api($accessToken)->get('/users/-/profile')->throw()->json();
    }

    /** Minute heart-rate readings (Zepp marks this pull API as transitional until a webhook exists). */
    public function heartRates(ZeppConnection $connection, string $startDate, string $endDate, string $timezone): array
    {
        return $this->api($this->accessToken($connection))
            ->get('/users/-/heartrates', ['startDate' => $startDate, 'endDate' => $endDate, 'timezone' => $timezone, 'type' => 'ALL'])
            ->throw()->json('items') ?? [];
    }

    /** Asks Zepp to re-deliver history through the webhooks. At most 30 days per request. */
    public function backfill(ZeppConnection $connection, string $type, int $startSeconds, int $endSeconds): array
    {
        return $this->api($this->accessToken($connection))
            ->get("/wellness-api/rest/backfill/$type", ['summaryStartTimeInSeconds' => $startSeconds, 'summaryEndTimeInSeconds' => $endSeconds])
            ->throw()->json() ?? [];
    }

    /** Downloads an activity FIT file from the one-time callbackURL given in the activity ping. */
    public function downloadFit(ZeppConnection $connection, string $callbackUrl): string
    {
        return Http::withToken($this->accessToken($connection))
            ->accept('application/octet-stream')
            ->timeout(60)
            ->get($callbackUrl)
            ->throw()
            ->body();
    }

    public function revoke(ZeppConnection $connection): void
    {
        $this->api($this->accessToken($connection))->post('/users/-/thirdparty/unauthorize')->throw();
    }

    private function api(string $accessToken): PendingRequest
    {
        return Http::baseUrl(rtrim(config('zepp.api_base'), '/'))->withToken($accessToken)->acceptJson()->timeout(30);
    }

    private function tokenRequest(string $url, array $params, ?string $bearer = null): array
    {
        $request = Http::asForm()->acceptJson()->timeout(30);
        if ($bearer) {
            $request = $request->withToken($bearer);
        }
        try {
            $json = $request->post($url, $params + [
                'client_id' => config('zepp.client_id'),
                'client_secret' => config('zepp.client_secret'),
            ])->throw()->json();
        } catch (RequestException $e) {
            // Never include the response body: it may echo credentials.
            throw new RuntimeException("Zepp token request failed (HTTP {$e->response->status()}).");
        }
        if (empty($json['access_token'])) {
            throw new RuntimeException('Zepp token response did not include an access token.');
        }

        return [
            'access_token' => $json['access_token'],
            'refresh_token' => $json['refresh_token'] ?? null,
            'expires_in' => isset($json['expires_in']) ? (int) $json['expires_in'] : null,
            'user_id' => isset($json['user_id']) ? (string) $json['user_id'] : null,
        ];
    }

    /** `expires_in` is treated as seconds (the documented example is 3600). */
    public function expiry(?int $expiresIn): ?\Illuminate\Support\Carbon
    {
        return $expiresIn ? now()->addSeconds($expiresIn) : null;
    }
}
