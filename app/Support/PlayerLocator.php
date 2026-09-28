<?php

namespace App\Support;

use App\Models\User;

class PlayerLocator
{
    /**
     * Resolve the same account the community sign-in form would resolve.
     * Email input is an exact match. A numeric Vellar ID maps to the
     * synthetic login address vellar{number}@vellarleague.com.
     */
    public static function find(string $input): ?User
    {
        $input = trim($input);

        if ($input === '') {
            return null;
        }

        if (str_contains($input, '@')) {
            return User::where('email', $input)->first();
        }

        $number = preg_replace('/\D/', '', $input) ?? '';

        if ($number === '') {
            return null;
        }

        return User::where('email', 'vellar'.$number.'@vellarleague.com')->first();
    }

    public static function identifier(string $input): string
    {
        $input = trim($input);

        if (str_contains($input, '@')) {
            return 'email:'.strtolower($input);
        }

        $number = preg_replace('/\D/', '', $input) ?? '';

        return 'vid:'.($number === '' ? 'invalid' : $number);
    }
}
