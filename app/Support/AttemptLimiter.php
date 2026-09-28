<?php

namespace App\Support;

use Illuminate\Support\Facades\RateLimiter;

class AttemptLimiter
{
    public function blocked(string $action, string $identifier, string $ip): bool
    {
        $limits = $this->limits($action);

        return RateLimiter::tooManyAttempts($this->idKey($action, $identifier), $limits['id'])
            || RateLimiter::tooManyAttempts($this->ipKey($action, $ip), $limits['ip']);
    }

    public function hit(string $action, string $identifier, string $ip): void
    {
        $decay = $this->limits($action)['decay'];

        RateLimiter::hit($this->idKey($action, $identifier), $decay);
        RateLimiter::hit($this->ipKey($action, $ip), $decay);
    }

    public function clearIdentifier(string $action, string $identifier): void
    {
        RateLimiter::clear($this->idKey($action, $identifier));
    }

    /**
     * @return array{id: int, ip: int, decay: int}
     */
    private function limits(string $action): array
    {
        $limits = config("nuvra.limits.$action");

        return [
            'id' => (int) ($limits['id'] ?? 5),
            'ip' => (int) ($limits['ip'] ?? 30),
            'decay' => (int) ($limits['decay'] ?? 900),
        ];
    }

    private function idKey(string $action, string $identifier): string
    {
        return $action.':id:'.hash('sha256', $identifier);
    }

    private function ipKey(string $action, string $ip): string
    {
        return $action.':ip:'.hash('sha256', $ip);
    }
}
