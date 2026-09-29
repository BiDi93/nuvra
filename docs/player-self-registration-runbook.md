# Player self-registration

New players enter their own email. Until they click the confirmation link, that address is stored only in `pending_contact_email`. It is not written to `contact_email`, and `contact_email_source` stays empty, so it is not a trusted recovery address. On confirm, the address moves to `contact_email` with `contact_email_source = registration`. `users.email` stays the Vellar login key `vellar{number}@vellarleague.com`.

The Vellar ID is reserved when the account is created, under a database lock, and is emailed only after an administrator approves a confirmed sign-up. It is not returned by the register, confirm, or check-status APIs, not shown on the sign-up screen or the waiting room, and not stored in browser storage.

There is one public register route: `POST /api/community/register`. `POST /api/register` redirects there. Every sign-up attempt gets the same on-screen reply. A second attempt does not create another account and does not copy the new form onto the existing one.

While that sign-up is still pending, unconfirmed, and inside the 7 days, the second attempt issues a new confirmation link for the existing row and the previous link stops working. The stored name, position, and the rest of the row stay as they were. That new link counts toward the per-address and site-wide confirm caps. Over either cap, the reply stays the same and the existing link is left alone.

When the address already belongs to an approved player, the only message is a short notice to use Forgot password. It has no name and no Vellar ID. It uses the same after-response send as the confirmation, and the same caps. When the same address is used again and the existing row is an expired unconfirmed sign-up, that row is deleted and the new one is created in the same transaction. The new sign-up sends a confirmation and counts toward the caps. The on-screen reply stays the same. A resend for an expired address removes that row and sends nothing, so the address can be used for a new sign-up. The per-address cap key is the lowercased address with any `+tag` removed from the local part. The stored address is not changed. When the site-wide daily cap is hit, the application logs a warning that contains no address.

## Limits

These are `config/nuvra.php` values under `registration_limits`.

| Limit | Default | Over the limit |
| --- | --- | --- |
| Register attempts per IP | 10 per hour | HTTP 429. Nothing is created and no mail is sent. |
| Resend attempts per IP | 10 per hour | HTTP 429. No mail is sent. |
| Confirm mails per address | 3 per day. The key is lowercased and a `+tag` on the local part is ignored. | The same neutral success reply. No mail is sent. |
| Confirm mails for the whole site | 200 per day | The same neutral success reply. No mail is sent. |

The per-address and site-wide caps count every registration message to an inbox: the first confirmation, a fresh link for a still-pending sign-up, a resend, and the Forgot password notice for an approved player. They stay on the success reply so a caller cannot tell those cases apart, and so the cap cannot be used to mail strangers.

Do not check these limits on UAT until the Cloudflare real-IP handling from the account-security work is verified. Until then every visitor can look like one address.

## Confirmation and expiry

Confirmation links last 24 hours, work once, and only a hash is stored. The raw token is in the mail link fragment (`/email/confirm#t=...`) and nowhere else, so it is not written to access logs or referrer headers. The page reads that fragment and posts it. Unconfirmed players cannot be approved, cannot sign in, and cannot reset a password. An unconfirmed sign-up older than 7 days is treated as expired whenever it is read: confirm, approve, resend, check-status, and the admin list. That does not depend on cron.

`players:expire-unconfirmed-signups` is extra cleanup. It runs only if `schedule:run` is added to cron. Expiry is enforced when a sign-up is read either way. `--delete` removes the old unconfirmed rows. Confirmed and already-active accounts are left alone. A dry run prints the count and deletes nothing.

`players:clear-untrusted-contact-emails` keeps `source=registration`, the same way it keeps `source=player` and `source=admin`. `players:repair-unset-shared-password` clears only `source=player`, so a confirmed registration address is left in place.

Rejection is only for a pending registration. It sends a short notice with no reason and no text the player typed, and only to a confirmed address (`contact_email` with `source=registration`). An unconfirmed address is never mailed. If there is no confirmed address, the pending row is still deleted and no email is sent. Active players are not rejected. An administrator removes an active player with the delete action. That sends no email and writes an audit row with action `delete`. The row names the admin, masks the address, and has no foreign key, so it stays after the account is gone. Approval writes an audit row and emails the Vellar ID only when the address is confirmed. If that email fails, or there is no confirmed address to send it to, the approve response says the email was not sent and does not include the ID. Audit rows name the admin and the time. The address is masked.

No captcha is used. Confirm, rejection, and approval mail are not queued. Confirm mail is sent with `afterResponse()`. Rejection and the Vellar ID mail are sent in the request, inside try/catch. `QUEUE_CONNECTION=database` does not need a worker for these messages.

## UAT checklist

The mail provider has to be working before any of the sign-ups below.

- [ ] Use a real mail provider. `MAIL_MAILER=log` is not acceptable. The log driver writes the confirmation link into the application log.
- [ ] Set `APP_URL=https://uat.nuvrasports.com` so every link in a message uses that host.
- [ ] After editing `.env`, run `php artisan config:cache`.
- [ ] The sender domain must pass SPF and DKIM.
- [ ] The cleanup command runs only if `schedule:run` is added to cron. Expiry is enforced when a sign-up is read either way. The scheduled command is `players:expire-unconfirmed-signups --delete` once a day:

```bash
php artisan players:expire-unconfirmed-signups
php artisan players:expire-unconfirmed-signups --delete
```

- [ ] After a test send, someone with server access checks the application log. The send is recorded with a player id. The log must not contain an email address, the confirmation link, the status link, or the token.
- [ ] UAT uses two real inboxes the owner controls. There is no special test-account code path. Names start with `TEST`. Do these in order.
  1. Sign-up A, on the first inbox. Do not click the first confirmation link.
  2. Submit sign-up A again with the same email and a different name. The on-screen reply matches the first one. The admin list still has one sign-up, with A's original name. A's inbox has a new confirmation link.
  3. The first link is rejected. The new link confirms. The admin list still shows A's original details.
  4. Approve A. The Vellar ID email arrives.
  5. Submit one more sign-up with A's email. The on-screen reply matches the first one. The only new message is the notice to use Forgot password. It has no name and no Vellar ID.
  6. Remove approved A with the admin delete action (Remove player on the members list, or `DELETE /api/community/admin/players/{id}`). Expect no "not approved" mail. An audit row reads `delete`. Player counts are back to the baseline.
  7. Sign-up B, on the second inbox. Confirm the link, then reject it. The neutral rejection email arrives, with no reason and no name.
- [ ] After cleanup, run `php artisan players:contact-audit` and the source counts from `docs/go-live-checklist.md`. Player counts should be back to the pre-test numbers. `set_by_registration` should not include the deleted test accounts. The audit command prints counts only.
- [ ] Do not use UAT to test races, the 24-hour link, the 7-day read-time expiry, or rate limits. Those are covered by `php artisan test`. Rate-limit checks on UAT wait until Cloudflare real-IP handling is verified.

## What not to put in UAT data

Do not commit real inboxes, phone numbers, or passwords. The two UAT inboxes stay in the owner's mail, not in this repository.
