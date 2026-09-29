<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RegistrationApproved extends Mailable
{
    public function __construct(
        public string $vellarNumber,
        public string $loginUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your NUVRA registration was approved',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.registration-approved',
        );
    }
}
