# Go-live checklist

No real player has logged in anywhere yet. Do not invite a player until all three of these are merged on the environment they will use and have been verified there:

1. Verified first-login reset (recovery-email link, SMS code, or an admin activation code). Codes last 15 minutes, are stored hashed, and a new code replaces every older one.
2. The shared default player password has been retired. That switch stays off until one test account has finished a real reset, then the owner turns it on and runs the command below.
3. Sign-in and reset use temporary escalating backoff, per ID and per IP, instead of a hard lockout.

Merging and deploying does not change passwords, send email, or send SMS. Nothing in a migration sends a message. A code goes out only when a player asks for a reset, or when an admin issues one. The owner runs the commands on the server. This list does not change nginx, DNS, or the deploy pipeline.

## 1. Environment variables

On the server `.env` for that environment, set:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public origin, used in reset links. Example: `https://uat.nuvrasports.com` |
| `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Real mailer before any email reset is offered. `log` writes the message to the log and does not deliver it. |
| `SMS_DRIVER` | `none` until a provider is approved. Then `http`. |
| `SMS_HTTP_URL`, `SMS_HTTP_TOKEN` | Required together with `SMS_DRIVER=http`. The app POSTs JSON `{"to","message"}` and sends the token as a bearer token when it is set. |
| `NUVRA_RETIRE_SHARED_PASSWORDS` | Leave `false` until step 3 below. Then `true`. |
| `UAT_BASIC_AUTH_USER`, `UAT_BASIC_AUTH_PASS` | UAT gate. Both must be non-empty or the gate stays off. Leave both empty on production. |

**What the code expects for delivery.** Mail uses Laravel's mailer (`config/mail.php`). If `MAIL_MAILER` is unset, the default is `log`, which writes the message to the log and does not deliver it. The committed `.env.example` sets `MAIL_MAILER=log` and `SMS_DRIVER=none`. PHPUnit sets `MAIL_MAILER=array`, which keeps messages in memory. SMS is sent only when `SMS_DRIVER=http` and `SMS_HTTP_URL` are both set; otherwise the SMS driver sends nothing. The UAT server's `.env` is not in this repo. Until the owner points `MAIL_MAILER` at a real provider, UAT as configured by the example does not deliver reset email, and it does not send SMS.

If this server has a cached config (`php artisan config:cache` has been run, or `bootstrap/cache/config.php` exists), editing `.env` does nothing until you apply it:

```bash
php artisan config:clear
```

Use `php artisan config:cache` instead when you want the cached file rebuilt with the new values. Run one of those after every `.env` edit on a server that caches config.

## 2. Migrations

After deploy, confirm migrations ran. They only add columns and an empty table. They do not rewrite passwords.

```bash
php artisan migrate --force
```

## 3. Manual artisan commands

Run these yourself. None of them run on deploy.

Create two or three test players with addresses the team controls. This does not email or text anyone. The accounts are named `NUVRA TEST PLAYER` and use Vellar IDs 900001, 900002, and 900003.

```bash
php artisan nuvra:create-test-players qa1@example.com 60123456789 qa2@example.com 60198765432
```

While `NUVRA_RETIRE_SHARED_PASSWORDS` is still false, sign in as Vellar `900001` with the shared default and complete one real reset end to end (the recovery email or an admin code, a new password, and the old session rejected). Only after that reset succeeds:

1. Set `NUVRA_RETIRE_SHARED_PASSWORDS=true` in the server `.env`.
2. Run `php artisan config:clear` or `php artisan config:cache`.

From then on, a player still on the shared default cannot get a session or keep an old one. They have to finish a verified reset first. The `--force` retire command refuses to run while the flag is false.

```bash
php artisan players:contact-audit
```

Prints counts only (recovery email, missing phone, invalid phone, shared-password use). It can take a few minutes.

For each player who needs access before they have a recovery email or SMS, an admin who has verified them offline issues one code. The admin sees the code, never the password. The API records which admin issued it, for which player, and when.

```bash
php artisan players:activation-code 82 --admin-id=1
```

Replace `82` with that player's Vellar number and `--admin-id` with the admin's user id. The same action is `POST /api/community/admin/players/{id}/activation-code` for an admin session. The `{id}` is the user id, not the Vellar number. The command and the API send nothing. The code expires in 15 minutes.

Dry run, which changes nothing and works while the flag is off:

```bash
php artisan players:retire-default-passwords
```

After the flag is on, and codes or tested SMS exist for the players you are about to invite:

```bash
php artisan players:retire-default-passwords --force --allow-undeliverable
```

This replaces remaining shared player passwords with a random value, sets `password_reset_required`, deletes those players' tokens, and rotates remember-me tokens. It sends nothing. It skips players who already chose their own password. It refuses to write, unless `--allow-undeliverable` is present, when any matched player has neither a recovery email nor SMS. Admins are not included. Change the admin password separately, on the server, to a unique value. Do not put that password in git.

When QA is finished, delete only the flagged test accounts:

```bash
php artisan nuvra:delete-test-players
```

## 4. Mail and SMS, including a test send

Set the mail variables, then apply config (see step 1) and send one message to an inbox you control:

```bash
php artisan tinker --execute="Illuminate\Support\Facades\Mail::raw('NUVRA mail test', function (\$m) { \$m->to('you@example.com')->subject('NUVRA mail test'); });"
```

Replace `you@example.com` with your own address. Confirm the message arrives. A `log` mailer only writes to `storage/logs`.

Leave SMS off (`SMS_DRIVER=none` or unset) until the provider is approved. After `SMS_DRIVER=http`, `SMS_HTTP_URL`, and `SMS_HTTP_TOKEN` are set and config is reloaded, send one reset to a phone you control (a test account, not a real player's number) from `/community` and confirm the provider delivered a 6-digit code. The app does not log the phone number or the message.

## 5. Verification before any invitation

On the deployed environment, with a throwaway account or a single code you issued:

- Sign-in with an unknown ID and with a wrong password returns the same message. A reset request does too, whether or not the ID or the contact exists.
- A second try too soon returns a wait that gets longer, then a try after that wait is accepted again. It does not lock the account for the whole window.
- With `NUVRA_RETIRE_SHARED_PASSWORDS=true`, the shared password `password` does not open a session, and an old session for that account is rejected.
- An activation code sets a new password once, and a second use of that code fails.
- A recovery-email link, when mail is configured, opens `/reset-password?token=...` and works once.
- A signed-in player cannot read another player's phone, address, or recovery email on `GET /api/community/members/{id}`.
- `GET /api/community/analytics` is admin-only.

## 6. UAT basic-auth gate

The middleware is `App\Http\Middleware\UatBasicAuth`. It covers the whole site only when both `UAT_BASIC_AUTH_USER` and `UAT_BASIC_AUTH_PASS` are non-empty. Otherwise it does nothing, which is the production default. Credentials are compared in constant time and are not logged.

**Exemption:** `GET /up` only. That is Laravel's health route. Probes cannot present a browser password, and gating it would fail the health check.

No payment webhook or payment callback route exists on this branch, so none is exempt. Do not add an exemption for ordinary pages.

Turn the gate **on** (UAT):

1. Set both variables in the server `.env` to values you choose. Do not commit them.
2. If config is cached, run `php artisan config:clear` or `php artisan config:cache`.
3. A browser request to the site prompts for the username and password. `GET /up` still returns 200 with no credentials.

Turn the gate **off**:

1. Clear both variables (or either one). An empty value keeps the gate off.
2. Run `php artisan config:clear` or `php artisan config:cache` again if config is cached.
3. The site loads without a browser prompt.

Leave both variables unset on production unless you have decided to gate production the same way.

## 7. Promote to `main` / production

Do this only after UAT verification above, and before any player is invited to production.

1. Merge the tested `uat` revision into `main` through the normal release path. Deploying does not retire passwords or send messages.
2. Set production `.env` mail variables. Leave `UAT_BASIC_AUTH_USER` and `UAT_BASIC_AUTH_PASS` empty unless production should sit behind the same gate.
3. Leave `SMS_DRIVER` unset or `none` until the test send in step 4 has succeeded on production.
4. Run `php artisan migrate --force` if the deploy does not migrate for you.
5. Leave `NUVRA_RETIRE_SHARED_PASSWORDS` false. Create test players, complete one real reset, then set the flag to true and reload config.
6. Run `php artisan players:contact-audit`, issue activation codes, then `php artisan players:retire-default-passwords` and, when the counts are right, the `--force` form. Delete the test players when QA is done.
7. Repeat the verification in step 5 on production.
8. Invite players only after that.

## What `main` implies for production

Checked against `main` at `bf929f8` (2026-09-28). The production database was not queried. Nothing below is a live row.

The shared password `password` is what `main` would write if its seeders or factory were used:

- `database/seeders/DatabaseSeeder.php` calls only `PlayerDummySeeder`.
- `PlayerDummySeeder` and `CommunitySeeder` store `Hash::make('password')` for the club owner and for player users.
- `database/factories/UserFactory.php` uses the same `password` default.
- `PlayerSeeder` and `CoachSeeder` store one shared hash of `password123` on the legacy `players` / coaches tables, not on `users`.
- Migration `2026_01_07_153836_add_auth_fields_to_players_table.php` defaults the legacy `players.password` column to `bcrypt('password123')` for rows inserted without a password.
- `ResetSeeder` stores one shared password (`Nuvra2026!`) on the users it creates and prints that password when it runs.

`TournamentMasterbaseSeeder` (the UAT import that wrote one shared `password` hash for the Vellar list) is not on `main`. No migration on `main` updates existing `users.password` values. So production has that shared player password if the database was seeded or copied that way, and it does not if the accounts were created some other way. The code cannot decide which.

The same weaknesses are in the `main` code, independent of what the database holds:

- Community login is `Auth::attempt` on email and password, with no rate limit and no lockout. It does not use the numeric Vellar ID.
- There is no `password_reset_required` flag and no verified first-login reset.
- `approveBooking` and `rejectBooking` do not check the organizer, so any signed-in user can approve or reject any booking. `uploadReceipt` is limited to the signed-in user's own booking, and `bookings` is limited to the organizer or an admin. Those game routes are on `main` and are not on current `uat`.
- `memberProfile` on `main` does not return phone. `getProfile` returns the signed-in user's own phone.
- `PaymentControllerBillplz` sets a callback URL of `/api/payment/callback` but no route registers that controller, so the callback is not reachable from `main`'s routes either.

On the production server, check counts only. Do not print names, emails, phone numbers, or hashes.

```sql
SELECT role, COUNT(*) AS accounts, COUNT(DISTINCT password) AS distinct_hashes
FROM users
GROUP BY role;

SELECT
  SUM(email LIKE '%@vellarleague.com') AS placeholder_login_emails,
  SUM(email NOT LIKE '%@vellarleague.com') AS other_emails,
  SUM(phone IS NULL OR TRIM(phone) = '') AS empty_phones
FROM users
WHERE role = 'player';
```

Then count how many stored hashes still match a seeder password. This prints integers only:

```bash
php artisan tinker --execute="
\$candidates = ['password', 'password123', 'Nuvra2026!'];
foreach (['player', 'admin', 'club_owner'] as \$role) {
    \$matched = array_fill_keys(\$candidates, 0);
    \$n = 0;
    App\Models\User::query()->where('role', \$role)->select('id', 'password')->orderBy('id')->chunkById(200, function (\$rows) use (\$candidates, &\$matched, &\$n) {
        foreach (\$rows as \$row) {
            \$n++;
            foreach (\$candidates as \$candidate) {
                if (Illuminate\Support\Facades\Hash::check(\$candidate, \$row->password)) {
                    \$matched[\$candidate]++;
                }
            }
        }
    });
    echo \$role.' count='.\$n.PHP_EOL;
    foreach (\$matched as \$candidate => \$hits) {
        echo \$role.' hash_matches['.\$candidate.']='.\$hits.PHP_EOL;
    }
}
"
```

A `player hash_matches[password]` count above zero means those accounts still open with the shared default. Run the retire command on production before inviting anyone. If the count is zero, the live data does not currently match that seeder password; still confirm the other two candidates and that distinct hashes are not a single shared value.
