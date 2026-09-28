<?php

namespace App\Rules;

use App\Support\SharedPassword;
use App\Support\WeakPassword;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class StrongPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $shared = SharedPassword::configuredValue();

        if ($shared !== null && is_string($value) && strcasecmp(trim($value), $shared) === 0) {
            $fail('Choose a password that is not the shared default.');

            return;
        }

        if (! is_string($value) || strlen($value) < 12) {
            $fail('Use at least 12 characters.');

            return;
        }

        if (! preg_match('/[a-z]/', $value) || ! preg_match('/[A-Z]/', $value) || ! preg_match('/\d/', $value)) {
            $fail('Use upper and lower case letters and a number.');

            return;
        }

        if (WeakPassword::isKnown($value)) {
            $fail('Choose a password that is not a shared or known default.');
        }
    }
}
