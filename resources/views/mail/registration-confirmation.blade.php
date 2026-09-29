<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #111; line-height: 1.5;">
    <p>A NUVRA registration was started for this email address.</p>
    <p><a href="{{ $confirmUrl }}">Confirm this registration</a></p>
    <p>This link works once and expires in {{ $expiresInHours }} hours. If you did not start this, you can ignore it.</p>
    <p>After you confirm, an administrator still has to approve the account. Your Vellar ID is sent by email only after that approval. It is not shown on the site.</p>
    <p><a href="{{ $statusUrl }}">Check registration status</a></p>
</body>
</html>
