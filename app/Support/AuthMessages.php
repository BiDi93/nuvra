<?php

namespace App\Support;

class AuthMessages
{
    public const LOGIN_FAILED = 'Incorrect Vellar ID or password.';

    public const TOO_MANY = 'Too many attempts. Please try again later.';

    public const RESET_SENT = 'If this ID can be verified, a message has been sent. If nothing arrives, ask a league administrator for an activation code.';

    public const RESET_FAILED = 'The reset code is invalid or has expired.';

    public const RESET_SAVED = 'Your password has been updated. You can sign in with it now.';

    public const RESET_REQUIRED = 'Set a new password before continuing.';

    public const FORGOT_GENERIC = 'If an account with that email can receive mail, a reset link has been sent.';
}
