<?php

namespace App\Support;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class DemoData
{
    /**
     * Demo seeders wipe or invent accounts. They must not run on production.
     */
    public static function refuseInProduction(string $seeder): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException($seeder.' is demo data and cannot run when APP_ENV=production.');
        }
    }

    /**
     * A hash of a random password that is not one of the known weak passwords.
     * The plaintext is not stored or printed.
     */
    public static function passwordHash(): string
    {
        do {
            $plain = Str::password(20);
        } while (WeakPassword::isKnown($plain));

        return Hash::make($plain);
    }
}
