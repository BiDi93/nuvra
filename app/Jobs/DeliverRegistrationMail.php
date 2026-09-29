<?php

namespace App\Jobs;

use App\Support\SafeMail;
use Illuminate\Mail\Mailable;

/**
 * Runs from dispatch()->afterResponse(). It does not implement ShouldQueue,
 * so a database queue worker is not required and the message is not queued.
 * The delivered flag stops a later request from sending the same message
 * again if the process keeps terminating callbacks.
 */
class DeliverRegistrationMail
{
    public bool $delivered = false;

    public function __construct(
        public int $playerId,
        public string $address,
        public Mailable $mail,
        public string $label,
    ) {}

    public function handle(): void
    {
        if ($this->delivered) {
            return;
        }

        $this->delivered = true;
        SafeMail::now($this->playerId, $this->address, $this->mail, $this->label);
    }
}
