# Admin activation codes

Use this when a player has no recovery email and no SMS, or a message did not arrive. The player and the admin should be on a call. The code expires in 15 minutes, and a newer code replaces the older one.

The code sets a password. It is not the password. The admin sees the code once. The app does not email or text it.

## Confirm who is asking

Before any code is issued, confirm the person against something already known. Use the phone number on file, or have their team manager vouch for them. Never issue a code to someone who only knows the Vellar ID.

## Issue a code

From the server, with the player's Vellar number and the admin's user id. `--admin-id` is required. The command refuses to run without it, and it refuses an id that is not an admin, so every audit row names an admin.

```bash
php artisan players:activation-code 123 --admin-id=1
```

Replace `123` with that player's Vellar number and `--admin-id` with the admin's user id.

The same action for an admin who is already signed in:

`POST /api/community/admin/players/{id}/activation-code`

`{id}` is the user id, not the Vellar number. That route uses the signed-in admin, so it does not take `--admin-id`.

The player enters the code on Set Password with the Vellar ID and a new password of at least 8 characters. The code works once.

## What is logged

Each issue writes one row in `player_code_audits`: the admin id, the player id, the source (`admin_api` or the command), and the time. The row does not store the code, the password, the email, or the phone.

## Contact shown to players

`NUVRA_ACTIVATION_CONTACT` is optional and stays unset. The reset message uses the neutral sentence. Do not put a contact in the repository.
