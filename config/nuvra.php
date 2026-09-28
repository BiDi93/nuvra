<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Shared player password
    |--------------------------------------------------------------------------
    |
    | Historical imports stored this same password for every player. It is
    | used only to recognise those hashes. Deploying this config does not
    | change any account. Retirement stays off until the owner sets
    | NUVRA_RETIRE_SHARED_PASSWORDS=true after a test reset.
    |
    */

    'shared_player_password' => 'password',

    /*
    | Passwords written by seeders. Admin accounts on any of these must
    | change them at the next login. This list is not behind the player
    | retirement flag.
    */
    'weak_passwords' => [
        'password',
        'password123',
        'Nuvra2026!',
    ],

    'retire_shared_passwords' => filter_var(env('NUVRA_RETIRE_SHARED_PASSWORDS', false), FILTER_VALIDATE_BOOLEAN),

    /*
    |--------------------------------------------------------------------------
    | Escalating backoff
    |--------------------------------------------------------------------------
    |
    | Each failure starts a short wait that doubles, then expires. The first
    | `free` hits do not start a wait; the next hit does, and the request
    | after that waits. check-status allows 40 polls so the waiting room
    | can keep asking. Keys are a hash of the ID and a hash of the IP.
    | There is no hard lockout.
    |
    */

    'backoff' => [
        'login' => ['base' => 1, 'cap' => 60, 'window' => 900, 'free' => 0],
        'password_request' => ['base' => 1, 'cap' => 60, 'window' => 900, 'free' => 0],
        'password_reset' => ['base' => 1, 'cap' => 60, 'window' => 900, 'free' => 0],
        'forgot_password' => ['base' => 1, 'cap' => 60, 'window' => 900, 'free' => 0],
        'reset_destination' => ['base' => 60, 'cap' => 900, 'window' => 900, 'free' => 0],
        'activation_code' => ['base' => 1, 'cap' => 60, 'window' => 900, 'free' => 0],
        'admin_password' => ['base' => 1, 'cap' => 60, 'window' => 900, 'free' => 0],
        'check_status' => ['base' => 1, 'cap' => 60, 'window' => 900, 'free' => 40],
    ],

    /*
    |--------------------------------------------------------------------------
    | How long a verification secret stays valid, in minutes
    |--------------------------------------------------------------------------
    */

    'verification_ttl' => [
        'email' => 15,
        'sms' => 15,
        'admin' => 15,
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
