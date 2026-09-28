<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PlayerPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || strlen($value) < 8) {
            $fail('Use at least 8 characters.');

            return;
        }

        $shared = \App\Support\SharedPassword::configuredValue();

        if ($shared !== null && strcasecmp(trim($value), $shared) === 0) {
            $fail('Choose a password that is not the shared default.');
        }
    }
}
