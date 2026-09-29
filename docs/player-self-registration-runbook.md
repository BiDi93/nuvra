# Player self-registration

New players enter their own email. It is stored on `contact_email` with `contact_email_source = player`. `users.email` stays the Vellar login key `vellar{number}@vellarleague.com`. The Vellar ID is reserved when the account is created, under a database lock, and is emailed only after an administrator approves a confirmed sign-up. It is not returned by the register API, not shown on the sign-up screen or the waiting room, and not stored in browser storage.

There is one public register route: `POST /api/community/register`. `POST /api/register` redirects there. A duplicate inbox gets the same reply and does not create a second account. That address can receive a short notice that someone tried to register. Register and resend are rate limited per IP, per email, and by a daily cap. Over the limit, the reply is the same generic message.

Confirmation links last 24 hours, work once, and only a hash is stored. Unconfirmed players cannot be approved, cannot sign in, and cannot reset a password. Unconfirmed sign-ups older than 7 days are deleted by `players:expire-unconfirmed-signups`. Rejection sends a short notice with no reason and no text the player typed, writes an audit row, then deletes the account. Approval writes an audit row as well. Audit rows name the admin and the time. The address is masked, if it is stored at all.

No captcha is used.

## UAT checklist

- [ ] Use a real mail provider. `MAIL_MAILER=log` is not acceptable. The log driver writes the confirmation link into the application log.
- [ ] Set `APP_URL=https://uat.nuvrasports.com` so every link in a message uses that host.
- [ ] After editing `.env`, run `php artisan config:cache`.
- [ ] The sender domain must pass SPF and DKIM.
- [ ] Schedule the expiry command. The app runs `players:expire-unconfirmed-signups --delete` once a day. The server needs a cron entry that calls the scheduler every minute:

```bash
* * * * * cd /path/to/nuvra && php artisan schedule:run >> /dev/null 2>&1
```

A manual check prints the count and deletes nothing:

```bash
php artisan players:expire-unconfirmed-signups
```

`--delete` is what actually removes the old unconfirmed rows. Confirmed and already-active accounts are left alone.

- [ ] After a test send, someone with server access checks the application log. The send is recorded with a player id. The log must not contain an email address, the confirmation link, the status link, or the token.
- [ ] UAT uses two real sign-ups on inboxes the owner controls. There is no special test-account code path.
  - One normal sign-up. The player's name starts with `TEST`, for example `TEST Alex`.
  - One sign-up that uses the same email again. The name also starts with `TEST`. The second attempt must not create another account.
  - Confirm the first email, then approve it in the admin screen. The Vellar ID should arrive only in that approval message.
  - Clean both up afterwards by rejecting them in the admin screen. Rejection deletes the account.
- [ ] Do not use UAT to test races or the 7-day expiry. Those are covered by `php artisan test`.

## What not to put in UAT data

Do not commit real inboxes, phone numbers, or passwords. The two UAT inboxes stay in the owner's mail, not in this repository.
