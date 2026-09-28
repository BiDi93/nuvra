<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NotSharedDefaultPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $shared = \App\Support\SharedPassword::configuredValue();

        if ($shared !== null && is_string($value) && strcasecmp(trim($value), $shared) === 0) {
            $fail('Choose a password that is not the shared default.');
        }
    }
}
