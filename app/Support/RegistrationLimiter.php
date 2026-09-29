<?php

namespace App\Support;

use Illuminate\Support\Facades\RateLimiter;

class RegistrationLimiter
{
    public function blocked(string $action, string $email, ?string $ip): bool
    {
        foreach ($this->buckets($action, $email, $ip) as [$key, $max]) {
            if (RateLimiter::tooManyAttempts($key, $max)) {
                return true;
            }
        }

        return false;
    }

    public function hit(string $action, string $email, ?string $ip): void
    {
        foreach ($this->buckets($action, $email, $ip) as [$key, $max, $decay]) {
            RateLimiter::hit($key, $decay);
        }
    }

    /**
     * @return list<array{0: string, 1: int, 2: int}>
     */
    private function buckets(string $action, string $email, ?string $ip): array
    {
        $limits = config('nuvra.registration_limits.'.$action, []);
        $scopes = [
            'ip' => $ip,
            'email' => $email,
            'daily_ip' => $ip,
            'daily_email' => $email,
            'daily' => 'all',
        ];
        $buckets = [];

        foreach ($scopes as $scope => $value) {
            if (! is_string($value) || $value === '' || ! is_array($limits[$scope] ?? null)) {
                continue;
            }

            $buckets[] = [
                $action.':'.$scope.':'.hash('sha256', $value),
                max(1, (int) $limits[$scope]['max']),
                max(1, (int) $limits[$scope]['decay']),
            ];
        }

        return $buckets;
    }
}
