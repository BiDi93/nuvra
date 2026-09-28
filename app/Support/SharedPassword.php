<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class SharedPassword
{
    public static function retirementEnabled(): bool
    {
        return (bool) config('nuvra.retire_shared_passwords');
    }

    /**
     * Null when NUVRA_SHARED_DEFAULT_PASSWORD is unset. Callers that only
     * compare must treat that as "check off" and must not throw.
     */
    public static function configuredValue(): ?string
    {
        $value = config('nuvra.shared_player_password');

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    /**
     * Password to store. Throws before any write when the env var is missing.
     */
    public static function requireForWrite(string $action): string
    {
        $value = self::configuredValue();

        if ($value === null) {
            throw new RuntimeException('Set NUVRA_SHARED_DEFAULT_PASSWORD before '.$action.'. Nothing was written.');
        }

        return $value;
    }

    public static function same(string $password): bool
    {
        $shared = self::configuredValue();

        if ($shared === null) {
            return false;
        }

        return hash_equals(hash('sha256', $shared), hash('sha256', $password));
    }

    /**
     * Null until this account has been checked. The result is stored so later
     * requests do not repeat the password hash.
     */
    public static function usesSharedPassword(User $user): bool
    {
        $shared = self::configuredValue();

        if ($shared === null) {
            return false;
        }

        $state = $user->sharedPasswordState();

        if ($state !== null) {
            return $state;
        }

        $matches = Hash::check($shared, $user->password);
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
