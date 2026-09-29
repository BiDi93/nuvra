<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class RegistrationLimiter
{
    public function ipBlocked(string $action, ?string $ip): bool
    {
        $bucket = $this->bucket('nuvra.registration_limits.'.$action.'.ip', $ip);

        return $bucket !== null && RateLimiter::tooManyAttempts($bucket[0], $bucket[1]);
    }

    public function hitIp(string $action, ?string $ip): void
    {
        $bucket = $this->bucket('nuvra.registration_limits.'.$action.'.ip', $ip);

        if ($bucket !== null) {
            RateLimiter::hit($bucket[0], $bucket[2]);
        }
    }

    /**
     * True when this address, or the whole site, has already had its
     * confirm mails for the day. Callers still return the neutral reply.
     */
    public function confirmMailBlocked(string $email): bool
    {
        $blocked = false;

        foreach ($this->mailBuckets($email) as [$configKey, $key, $max]) {
            if (! RateLimiter::tooManyAttempts($key, $max)) {
                continue;
            }

            $blocked = true;

            if (str_ends_with($configKey, '.daily')) {
                Log::warning('Registration confirm mail cap reached.');
            }
        }

        return $blocked;
    }

    public function hitConfirmMail(string $email): void
    {
        foreach ($this->mailBuckets($email) as [, $key, , $decay]) {
            RateLimiter::hit($key, $decay);
        }
    }

    /**
     * @return array{0: string, 1: int, 2: int}|null
     */
    private function bucket(string $configKey, ?string $value): ?array
    {
        $limit = config($configKey);

        if (! is_string($value) || $value === '' || ! is_array($limit)) {
            return null;
        }

        return [
            $configKey.':'.hash('sha256', $value),
            max(1, (int) ($limit['max'] ?? 1)),
            max(1, (int) ($limit['decay'] ?? 3600)),
        ];
    }

    /**
     * The cap key ignores letter case and a +tag on the local part.
     * The address stored on the player is left unchanged.
     */
    private function addressCapKey(string $email): string
    {
        $email = strtolower(trim($email));
        $at = strrpos($email, '@');

        if ($at === false) {
            return $email;
        }

        $local = substr($email, 0, $at);
        $plus = strpos($local, '+');

        if ($plus !== false) {
            $local = substr($local, 0, $plus);
        }

        return $local.'@'.substr($email, $at + 1);
    }

    /**
     * @return list<array{0: string, 1: string, 2: int, 3: int}>
     */
    private function mailBuckets(string $email): array
    {
        $buckets = [];

        foreach ([
            'nuvra.registration_limits.confirm_mail.per_email' => $this->addressCapKey($email),
            'nuvra.registration_limits.confirm_mail.daily' => 'all',
        ] as $configKey => $value) {
            $bucket = $this->bucket($configKey, $value);

            if ($bucket !== null) {
                $buckets[] = [$configKey, $bucket[0], $bucket[1], $bucket[2]];
            }
        }

        return $buckets;
    }
}
