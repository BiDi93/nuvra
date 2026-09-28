<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NotSharedDefaultPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $shared = (string) config('nuvra.shared_player_password');

        if (is_string($value) && strcasecmp(trim($value), $shared) === 0) {
            $fail('Choose a password that is not the shared default.');
        }
    }
}
