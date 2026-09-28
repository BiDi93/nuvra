<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #111; line-height: 1.5;">
    <p>A password reset was requested for your NUVRA player account.</p>
    <p>
        <a href="{{ $resetUrl }}">Set a new password</a>
    </p>
    <p>This link expires in {{ $expiresInMinutes }} minutes and works once. If you did not ask for this, you can ignore it.</p>
</body>
</html>
