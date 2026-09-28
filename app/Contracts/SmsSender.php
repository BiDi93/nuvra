<?php

namespace App\Contracts;

interface SmsSender
{
    public function enabled(): bool;

    public function send(string $phoneDigits, string $message): void;
}
