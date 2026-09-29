<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RegistrationConfirmation extends Mailable
{
    public function __construct(
        public string $confirmUrl,
        public string $statusUrl,
        public int $expiresInHours,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirm your NUVRA registration',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.registration-confirmation',
        );
    }
}
