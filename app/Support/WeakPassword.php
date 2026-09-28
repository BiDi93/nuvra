<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class WeakPassword
{
    /**
     * @return list<string>
     */
    public static function candidates(): array
    {
        $list = config('nuvra.weak_passwords', []);

        if (! is_array($list)) {
            return [];
        }

        return array_values(array_filter($list, fn ($password) => is_string($password) && $password !== ''));
    }

    public static function isKnown(string $password): bool
    {
        foreach (self::candidates() as $candidate) {
            if (hash_equals(hash('sha256', $candidate), hash('sha256', $password))) {
                return true;
            }
        }

        return false;
    }

    public static function matchesStored(User $user): bool
    {
        foreach (self::candidates() as $candidate) {
            if (Hash::check($candidate, $user->password)) {
                return true;
            }
        }

        return false;
    }
}
