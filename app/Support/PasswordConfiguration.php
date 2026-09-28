<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * Retirement and the forced admin change are invalid when the flag is on
 * and the password list they depend on was never set. Callers must not
 * treat that as "no match".
 */
class PasswordConfiguration
{
    private static bool $loggedRetirement = false;

    private static bool $loggedWeakList = false;

    public static function weakListIsSet(): bool
    {
        return (bool) config('nuvra.weak_passwords_set');
    }

    public static function retirementIsInvalid(): bool
    {
        return SharedPassword::retirementEnabled() && SharedPassword::configuredValue() === null;
    }

    public static function adminForceIsInvalid(): bool
    {
        return (bool) config('nuvra.force_admin_password_change') && ! self::weakListIsSet();
    }

    public static function report(): void
    {
        if (self::retirementIsInvalid() && ! self::$loggedRetirement) {
            self::$loggedRetirement = true;
            Log::error('Invalid password configuration: NUVRA_RETIRE_SHARED_PASSWORDS is true while NUVRA_SHARED_DEFAULT_PASSWORD is unset. Shared-password checks are not running.');
        }

        if (self::adminForceIsInvalid() && ! self::$loggedWeakList) {
            self::$loggedWeakList = true;
            Log::error('Invalid password configuration: NUVRA_FORCE_ADMIN_PASSWORD_CHANGE is true while NUVRA_WEAK_PASSWORDS is unset. The forced admin password check is not running.');
        }
    }
}
