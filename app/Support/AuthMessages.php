<?php

namespace App\Support;

class AuthMessages
{
    public const LOGIN_FAILED = 'Incorrect Vellar ID or password.';

    public const TOO_MANY = 'Too many attempts. Please try again later.';

    public const RESET_SENT = 'If this ID can be verified, a message has been sent. If nothing arrives, ask a league administrator for an activation code.';

    public const SET_PASSWORD = 'Set a new password';

    public static function resetSent(): string
    {
        $contact = trim((string) config('nuvra.activation_contact', ''));

        if ($contact === '') {
            return self::RESET_SENT;
        }

        return self::RESET_SENT.' Contact: '.$contact;
    }

    public const RESET_FAILED = 'The reset code is invalid or has expired.';

    public const RESET_SAVED = 'Your password has been updated. You can sign in with it now.';

    public const RESET_REQUIRED = 'Set a new password before continuing.';

    public const ADMIN_PASSWORD_CHANGE = 'Choose a new password before continuing.';

    public const PASSWORD_CHECKS_UNCONFIGURED = 'Password checks are not configured.';

    public const CONTACT_EMAIL_LOCKED = 'Set your own password before changing the recovery email.';

    public const CONTACT_EMAIL_REJECTED = 'The recovery email could not be saved.';

    public const STATUS_PRIVATE = 'If this registration is still pending, an admin has not approved it yet.';

    public const FORGOT_GENERIC = 'If an account with that email can receive mail, a reset link has been sent.';

    public const REGISTER_GENERIC = 'If this address can be used, a confirmation message has been sent.';

    public const RESEND_GENERIC = 'If a registration is waiting for confirmation, a new message has been sent.';

    public const SIGNUP_UNCONFIRMED = 'Confirm your email before signing in.';
}
