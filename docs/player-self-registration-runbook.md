# Player self-registration

New players enter their own email. Until they click the confirmation link, that address is stored only in `pending_contact_email`. It is not written to `contact_email`, and `contact_email_source` stays empty, so it is not a trusted recovery address. On confirm, the address moves to `contact_email` with `contact_email_source = registration`. `users.email` stays the Vellar login key `vellar{number}@vellarleague.com`.

The Vellar ID is reserved when the account is created, under a database lock, and is emailed only after an administrator approves a confirmed sign-up. It is not returned by the register, confirm, or check-status APIs, not shown on the sign-up screen or the waiting room, and not stored in browser storage.

There is one public register route: `POST /api/community/register`. `POST /api/register` redirects there. A duplicate inbox gets the same reply and does not create a second account. No mail is sent for that attempt.

## Limits

These are `config/nuvra.php` values under `registration_limits`.

| Limit | Default | Over the limit |
| --- | --- | --- |
| Register attempts per IP | 10 per hour | HTTP 429. Nothing is created and no mail is sent. |
| Resend attempts per IP | 10 per hour | HTTP 429. No mail is sent. |
| Confirm mails per address | 3 per day | The same neutral success reply. No mail is sent. |
| Confirm mails for the whole site | 200 per day | The same neutral success reply. No mail is sent. |

The per-address and site-wide caps count confirm mails only (the first message and each resend). They stay on the success reply so a caller cannot tell a new address from one that was skipped, and so the cap cannot be used to mail strangers.

Do not check these limits on UAT until the Cloudflare real-IP handling from the account-security work is verified. Until then every visitor can look like one address.

## Confirmation and expiry

Confirmation links last 24 hours, work once, and only a hash is stored. The raw token is in the mail link and nowhere else. Unconfirmed players cannot be approved, cannot sign in, and cannot reset a password. An unconfirmed sign-up older than 7 days is treated as expired whenever it is read: confirm, approve, resend, check-status, and the admin list. That does not depend on cron.

`players:expire-unconfirmed-signups` is an extra cleanup. There is no evidence `schedule:run` runs on the server, so do not rely on it for the expiry rule. `--delete` removes the old unconfirmed rows. Confirmed and already-active accounts are left alone. A dry run prints the count and deletes nothing.

`players:clear-untrusted-contact-emails` keeps `source=registration`, the same way it keeps `source=player` and `source=admin`. `players:repair-unset-shared-password` clears only `source=player`, so a confirmed registration address is left in place.

Rejection sends a short notice with no reason and no text the player typed, writes an audit row, then deletes the account. Approval writes an audit row and emails the Vellar ID only when the address is confirmed. Audit rows name the admin and the time. The address is masked.

No captcha is used. Confirm, rejection, and approval mail are not queued. Confirm mail is sent with `afterResponse()`. Rejection and the Vellar ID mail are sent in the request, inside try/catch. `QUEUE_CONNECTION=database` does not need a worker for these messages.

## UAT checklist

The mail provider has to be working before any of the sign-ups below.

- [ ] Use a real mail provider. `MAIL_MAILER=log` is not acceptable. The log driver writes the confirmation link into the application log.
- [ ] Set `APP_URL=https://uat.nuvrasports.com` so every link in a message uses that host.
- [ ] After editing `.env`, run `php artisan config:cache`.
- [ ] The sender domain must pass SPF and DKIM.
- [ ] The expiry command is optional cleanup, not the expiry rule. If a scheduler is added later, the app runs `players:expire-unconfirmed-signups --delete` once a day:

```bash
php artisan players:expire-unconfirmed-signups
php artisan players:expire-unconfirmed-signups --delete
```

- [ ] After a test send, someone with server access checks the application log. The send is recorded with a player id. The log must not contain an email address, the confirmation link, the status link, or the token.
- [ ] UAT uses two real inboxes the owner controls. There is no special test-account code path. Names start with `TEST`.
  1. Sign-up A, on the first inbox. Confirm the link, approve it, and check that the Vellar ID email arrives. Then delete that account through the admin reject action.
  2. Sign-up B, on the second inbox. Confirm the link, then reject it. Check that the neutral rejection email arrives and that it has no reason and no name.
  3. While sign-up A is still pending (before it is confirmed), submit one more sign-up with A's email. The reply must match A's first reply exactly, and no second account is created. A duplicate cannot be rejected, because there is nothing to reject.
- [ ] After cleanup, run `php artisan players:contact-audit` and the source counts from `docs/go-live-checklist.md`. Player counts should be back to the pre-test numbers. `set_by_registration` should not include the deleted test accounts. The audit command prints counts only.
- [ ] Do not use UAT to test races, the 24-hour link, the 7-day read-time expiry, or rate limits. Those are covered by `php artisan test`. Rate-limit checks on UAT wait until Cloudflare real-IP handling is verified.

## What not to put in UAT data

Do not commit real inboxes, phone numbers, or passwords. The two UAT inboxes stay in the owner's mail, not in this repository.
