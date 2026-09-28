<?php

namespace App\Support;

use Illuminate\Support\Facades\RateLimiter;

class AttemptLimiter
{
    /**
     * Seconds the caller must wait. Zero means the next attempt is allowed.
     * The wait grows after each failure and then expires, so a burst slows
     * down instead of locking the account for the whole window.
     */
    public function retryAfter(string $action, string $identifier, ?string $ip): int
    {
        $wait = $this->cooldownRemaining($this->cooldownKey($action, 'id', $identifier));

        if ($ip !== null) {
            $wait = max($wait, $this->cooldownRemaining($this->cooldownKey($action, 'ip', $ip)));
        }

        return $wait;
    }

    public function blocked(string $action, string $identifier, ?string $ip): bool
    {
        return $this->retryAfter($action, $identifier, $ip) > 0;
    }

    public function hit(string $action, string $identifier, ?string $ip): void
    {
        $this->record($action, 'id', $identifier);

        if ($ip !== null) {
            $this->record($action, 'ip', $ip);
        }
    }

    public function clearIdentifier(string $action, string $identifier): void
    {
        RateLimiter::clear($this->counterKey($action, 'id', $identifier));
        RateLimiter::clear($this->cooldownKey($action, 'id', $identifier));
    }

    /**
     * Token resets are limited by IP only. The token is not part of the key.
     */
    public function retryAfterIp(string $action, string $ip): int
    {
        return $this->cooldownRemaining($this->cooldownKey($action, 'ip', $ip));
    }

    public function hitIp(string $action, string $ip): void
    {
        $this->record($action, 'ip', $ip);
    }

    private function record(string $action, string $scope, string $value): void
    {
        $window = max(1, (int) config("nuvra.backoff.$action.window", 900));
        $attempts = RateLimiter::hit($this->counterKey($action, $scope, $value), $window);
        $free = max(0, (int) config("nuvra.backoff.$action.free", 0));

        if ($attempts <= $free) {
            return;
        }

        $delay = $this->delayFor($action, $attempts - $free);
        $cooldown = $this->cooldownKey($action, $scope, $value);
        RateLimiter::clear($cooldown);
        RateLimiter::hit($cooldown, $delay);
    }

    private function delayFor(string $action, int $step): int
    {
        $base = max(1, (int) config("nuvra.backoff.$action.base", 1));
        $cap = max($base, (int) config("nuvra.backoff.$action.cap", 60));
        $shift = min(16, max(0, $step - 1));

        return (int) min($cap, $base * (2 ** $shift));
    }

    private function cooldownRemaining(string $key): int
    {
        if (RateLimiter::attempts($key) < 1) {
            return 0;
        }

        return max(0, RateLimiter::availableIn($key));
    }

    private function counterKey(string $action, string $scope, string $value): string
    {
        return $action.':'.$scope.':'.hash('sha256', $value);
    }

    private function cooldownKey(string $action, string $scope, string $value): string
    {
        return $this->counterKey($action, $scope, $value).':wait';
    }
}
