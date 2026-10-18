<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    // Comma-separated list of frontend origins allowed to call the API.
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('FRONTEND_ORIGINS', 'http://localhost:8100,http://localhost:5173')))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    // Bearer tokens only; no cookies cross origins.
    'supports_credentials' => false,
];
