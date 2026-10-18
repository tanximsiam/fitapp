<?php

/*
 * Zepp Thirdparty Open Platform (https://devopen.zepp.com). The integration stays inactive until
 * ZEPP_CLIENT_ID, ZEPP_CLIENT_SECRET and ZEPP_WEBHOOK_TOKEN are set. The URLs default to the values
 * published in Zepp's documentation; override them only if Zepp tells you to.
 */
return [
    'client_id' => env('ZEPP_CLIENT_ID'),
    'client_secret' => env('ZEPP_CLIENT_SECRET'),

    // Must exactly match the callback URL registered for your app in the Zepp Developer Console.
    'redirect_uri' => env('ZEPP_REDIRECT_URI', rtrim((string) env('APP_URL', 'http://localhost:8000'), '/').'/api/zepp/callback'),

    // Zepp does not sign webhooks, so the endpoint is protected by an unguessable path segment.
    // Register https://<your-api>/api/zepp/webhook/<ZEPP_WEBHOOK_TOKEN> as the event callback.
    'webhook_token' => env('ZEPP_WEBHOOK_TOKEN'),

    'authorize_url' => env('ZEPP_AUTHORIZE_URL', 'https://user.zepp.com/oauth2/index.html#/login'),
    'token_url' => env('ZEPP_TOKEN_URL', 'https://auth.zepp.com/v2/oauth2/access_token'),
    'refresh_url' => env('ZEPP_REFRESH_URL', 'https://auth.zepp.com/v2/oauth2/refresh_token'),
    'api_base' => env('ZEPP_API_BASE', 'https://api-open.zepp.com'),

    // Where the browser is sent after the OAuth callback (your FitApp website).
    'frontend_url' => env('FRONTEND_URL', explode(',', (string) env('FRONTEND_ORIGINS', 'http://localhost:5173'))[0]),

    // How many days of minute heart-rate readings the scheduled sync pulls each run.
    'heart_rate_days' => (int) env('ZEPP_HEART_RATE_DAYS', 2),
];
