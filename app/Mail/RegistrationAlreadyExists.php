<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RegistrationAlreadyExists extends Mailable
{
    public function __construct(
        public string $resetUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You already have a NUVRA account',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.registration-already-exists',
        );
    }
}
