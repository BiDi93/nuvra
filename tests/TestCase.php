<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function sharedPassword(): string
    {
        $value = config('nuvra.shared_player_password');

        if (! is_string($value) || $value === '') {
            $this->fail('Tests require NUVRA_SHARED_DEFAULT_PASSWORD.');
        }

        return $value;
    }

    protected function weakPassword(): string
    {
        return 'synthetic-weak-1';
    }
}
