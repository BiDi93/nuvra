<?php

namespace App\Support;

use App\Jobs\DeliverRegistrationMail;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SafeMail
{
    /**
     * Send on the way out of the request. New and already-used addresses
     * return before any delivery, and the job is not placed on the queue.
     */
    public static function afterResponse(int $playerId, string $address, Mailable $mail, string $label): void
    {
        dispatch(new DeliverRegistrationMail($playerId, $address, $mail, $label))->afterResponse();
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
