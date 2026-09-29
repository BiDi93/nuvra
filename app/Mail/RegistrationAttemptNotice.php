<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegistrationAttemptNotice extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $loginUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'NUVRA registration notice',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.registration-attempt-notice',
        );
    }
}
