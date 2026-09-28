<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Shared player password
    |--------------------------------------------------------------------------
    |
    | Historical imports stored this same password for every player. It is
    | used only to recognise those hashes. Deploying this config does not
    | change any account. Retirement is a manual artisan command.
    |
    */

    'shared_player_password' => 'password',

    /*
    |--------------------------------------------------------------------------
    | Attempt limits
    |--------------------------------------------------------------------------
    |
    | Counts are failures (or, for check-status, every call) inside the decay
    | window, tracked separately per identifier and per IP address.
    |
    */

    'limits' => [
        'login' => ['id' => 5, 'ip' => 30, 'decay' => 900],
        'password_request' => ['id' => 5, 'ip' => 15, 'decay' => 900],
        'password_reset' => ['id' => 5, 'ip' => 20, 'decay' => 900],
        'check_status' => ['id' => 40, 'ip' => 600, 'decay' => 900],
        'forgot_password' => ['id' => 5, 'ip' => 15, 'decay' => 900],
    ],

    /*
    |--------------------------------------------------------------------------
    | How long a verification secret stays valid, in minutes
    |--------------------------------------------------------------------------
    */

    'verification_ttl' => [
        'email' => 60,
        'sms' => 10,
        'admin' => 72 * 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS
    |--------------------------------------------------------------------------
    |
    | "none" sends nothing. "http" POSTs JSON {to, message} to SMS_HTTP_URL
    | with an optional bearer token. Nothing is sent unless both the driver
    | and a URL are set, and only after a player asks for a reset.
    |
    */

    'sms' => [
        'driver' => env('SMS_DRIVER', 'none'),
        'url' => env('SMS_HTTP_URL'),
        'token' => env('SMS_HTTP_TOKEN'),
    ],

    /*
    |--------------------------------------------------------------------------
    | UAT HTTP basic auth
    |--------------------------------------------------------------------------
    |
    | The gate is on only when both values are non-empty. Leave them empty
    | on production. After editing .env, run `php artisan config:clear`
    | (or `php artisan config:cache` if this server caches config).
    | See docs/go-live-checklist.md.
    |
    */

    'uat_basic_auth' => [
        'user' => env('UAT_BASIC_AUTH_USER'),
        'password' => env('UAT_BASIC_AUTH_PASS'),
    ],

];
