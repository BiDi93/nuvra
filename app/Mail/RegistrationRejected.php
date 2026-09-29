<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RegistrationRejected extends Mailable
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'NUVRA registration update',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.registration-rejected',
        );
    }
}
