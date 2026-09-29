<?php

namespace App\Support;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SafeMail
{
    /**
     * Send after the HTTP response so delivery time is not part of the
     * response. The log line names the player id only.
     */
    public static function later(int $playerId, string $address, Mailable $mail, string $label): void
    {
        $sent = false;

        app()->terminating(function () use (&$sent, $playerId, $address, $mail, $label) {
            if ($sent) {
                return;
            }

            $sent = true;
            self::deliver($playerId, $address, $mail, $label);
        });
    }

    public static function now(int $playerId, string $address, Mailable $mail, string $label): void
    {
        self::deliver($playerId, $address, $mail, $label);
    }

    private static function deliver(int $playerId, string $address, Mailable $mail, string $label): void
    {
        try {
            Mail::to($address)->send($mail);
            Log::info($label.' sent.', ['player_id' => $playerId]);
        } catch (\Throwable $e) {
            Log::error($label.' failed.', ['player_id' => $playerId]);
        }
    }
}
