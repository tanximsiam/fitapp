<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    // Sign in with Google; off until the client id and secret are set (docs/google-sign-in.md).
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        // Defaults to APP_URL/api/auth/google/callback; must match the redirect URI registered with Google.
        'redirect' => env('GOOGLE_REDIRECT_URI'),
        // Custom URL scheme the mobile app is opened with after signing in.
        'app_scheme' => env('FITAPP_APP_SCHEME', 'fitapp'),
    ],

    // The AI service (insights, entry feedback, score tips); off until the key is set.
    'groq' => [
        'key' => env('GROQ_API_KEY'),
        'model' => env('GROQ_MODEL', 'openai/gpt-oss-20b'),
        // Also answer people exploring sample data without an account (rate-limited per address).
        'demo' => (bool) env('AI_DEMO', false),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
