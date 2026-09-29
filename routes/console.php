<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Runs only when cron calls schedule:run. Reading a sign-up enforces expiry either way.
Schedule::command('players:expire-unconfirmed-signups --delete')->daily();
