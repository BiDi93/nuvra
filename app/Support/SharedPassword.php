<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SharedPassword
{
    public static function retirementEnabled(): bool
    {
        return (bool) config('nuvra.retire_shared_passwords');
    }

    public static function value(): string
    {
        return (string) config('nuvra.shared_player_password');
    }

    public static function same(string $password): bool
    {
        return hash_equals(hash('sha256', self::value()), hash('sha256', $password));
    }

    /**
     * Null until this account has been checked. The result is stored so later
     * requests do not repeat the password hash.
     */
    public static function usesSharedPassword(User $user): bool
    {
        $state = $user->sharedPasswordState();

        if ($state !== null) {
            return $state;
        }

        $matches = Hash::check(self::value(), $user->password);
        $user->forceFill(['password_is_shared' => $matches])->save();

        return $matches;
    }

    public static function requireReset(User $user): void
    {
        $user->forceFill([
            'password_reset_required' => true,
            'password_is_shared' => true,
            'remember_token' => Str::random(60),
        ])->save();

        $user->tokens()->delete();
    }
}
