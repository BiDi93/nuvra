# Go-live checklist

This work lands on `uat` first. The owner tests and confirms there. Production (`main`) is a later promotion pull request that the owner approves. This change does not edit `main`.

- **Part 1** is the UAT go-live. Merge and deploy to UAT, then run the checks there.
- **Part 2** is the production promotion. Do not open that pull request until every item in Part 2 is true.

Merge https://github.com/BiDi93/nuvra/pull/22 (`cursor/security-cleanup-uat-5200`) into `uat` before this pull request. That pull request already makes analytics admin-only, hides phone and address on public profiles, tightens fixture edits, adds `GET /api/community/public-stats`, and changes the UAT deploy workflow and `.gitignore`. It does not move the masterbase workbook. This pull request removes that workbook from the tree. Fixture authorization here follows that same rule: admin, match organizer, or tournament organizer.

No real player has logged in anywhere yet. Do not invite a player on UAT until Part 1 is done there. Do not invite a player on production until Part 2 is done there.

Merging and deploying does not change passwords, send email, or send SMS. Nothing in a migration sends a message. A code goes out only when a player asks for a reset, or when an admin issues one. The owner runs the commands on the server. This list does not change nginx, DNS, or the deploy pipeline.

On UAT, three player controls still have to be verified before an invitation:

1. Verified first-login reset (recovery-email link, SMS code, or an admin activation code). Codes last 15 minutes, are stored hashed, and a new code replaces every older one.
2. The shared default player password has been retired. That switch stays off until one test account has finished a real reset, then the owner turns it on and runs the command below.
3. Sign-in and reset use temporary escalating backoff, per ID and per IP, instead of a hard lockout.

Admin sign-in uses the same backoff and the same failure message as a player. Forcing an admin off a known weak password is a separate switch, `NUVRA_FORCE_ADMIN_PASSWORD_CHANGE`, and it is off by default. Leave it off on UAT unless you choose to try it there. Turning it on and changing the admin password is required before production promotion, not before the UAT deploy.

# Part 1 — UAT go-live

## 1. Environment variables

On the server `.env` for that environment, set:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public origin, used in reset links. Example: `https://uat.nuvrasports.com` |
| `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Real mailer before any email reset is offered. `log` writes the message to the log and does not deliver it. |
| `SMS_DRIVER` | `none` until a provider is approved. Then `http`. |
| `SMS_HTTP_URL`, `SMS_HTTP_TOKEN` | Required together with `SMS_DRIVER=http`. The app POSTs JSON `{"to","message"}` and sends the token as a bearer token when it is set. |
| `NUVRA_RETIRE_SHARED_PASSWORDS` | Leave `false` until step 3 below. Then `true`. |
| `NUVRA_FORCE_ADMIN_PASSWORD_CHANGE` | Leave `false` on UAT. The current admin keeps signing in. Set `true` only when you want the forced admin password change, which is required for production promotion. |
| `UAT_BASIC_AUTH_USER`, `UAT_BASIC_AUTH_PASS` | UAT gate. Both must be non-empty or the gate stays off. Leave both empty on production. |
| `QA_TOOLS_ENABLED` | Off by default. Set `true` only while QA uses the admin test-player screen. Set it back to `false` when that testing is finished. Production ignores it. |
| `NUVRA_MASTERBASE_PATH` | Absolute path of the player workbook, outside this repository. Leave it unset on the servers. Seeders fail if it is empty, missing, or inside the repo. Deploy does not read it. |

**What the code expects for delivery.** Mail uses Laravel's mailer (`config/mail.php`). If `MAIL_MAILER` is unset, the default is `log`, which writes the message to the log and does not deliver it. The committed `.env.example` sets `MAIL_MAILER=log` and `SMS_DRIVER=none`. PHPUnit sets `MAIL_MAILER=array`, which keeps messages in memory. SMS is sent only when `SMS_DRIVER=http` and `SMS_HTTP_URL` are both set; otherwise the SMS driver sends nothing. The UAT server's `.env` is not in this repo. Until the owner points `MAIL_MAILER` at a real provider, UAT as configured by the example does not deliver reset email, and it does not send SMS.

If this server has a cached config (`php artisan config:cache` has been run, or `bootstrap/cache/config.php` exists), editing `.env` does nothing until you apply it:

```bash
php artisan config:clear
```

Use `php artisan config:cache` instead when you want the cached file rebuilt with the new values. Run one of those after every `.env` edit on a server that caches config.

## 2. Migrations

After deploy, confirm migrations ran. They only add columns and an empty table. They do not rewrite passwords.

Neither `.github/workflows/uat-deploy.yml` nor `.github/workflows/deploy.yml` runs a seeder. Both run `php artisan migrate --force` and then cache config and views. A deploy does not read `NUVRA_MASTERBASE_PATH` and cannot re-seed the live database. `MASTERBASE VELLAR ID S1.xlsx` stays in git history. That history contains Vellar IDs, names, phone numbers, birth dates, positions, team names, and match statistics. This change does not rewrite those commits. The file is no longer in the working tree. Keep any copy outside the repository.

```bash
php artisan migrate --force
```

## 3. Manual artisan commands

Run these yourself. None of them run on deploy.

Create one flagged test player for the reset test. Pass the contact on the command. Do not put a real address in the repo. An email alone is enough; that player has no phone. A phone of 8 to 15 digits may follow the email only when you are testing SMS. This does not email or text anyone. The account is named `NUVRA TEST PLAYER` and uses Vellar ID 900001. You can pass up to three contacts in one command.

```bash
php artisan nuvra:create-test-players you@example.com
```

Replace `you@example.com` with an inbox the team controls. QA runs the end-to-end reset only on this flagged player, not on an existing UAT player.

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

This replaces remaining shared player passwords with a random value, sets `password_reset_required`, deletes those players' tokens, and rotates remember-me tokens. It sends nothing. It skips players who already chose their own password. It refuses to write, unless `--allow-undeliverable` is present, when any matched player has neither a recovery email nor SMS. Admins are not included.

When QA is finished, delete only the flagged test accounts. The command selects `is_test_account` and does not delete any other user:

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

## 5. QA on UAT

QA uses a few existing UAT player accounts for login, backoff, and IDOR only. Do not run a password reset on those accounts.

`GET` and `POST /api/community/check-status` return the same message whether or not the Vellar number exists. They do not return a name or a status unless the caller sends the `status_token` from that player's own registration response. The same escalating backoff as login applies (1s, 2s, 4s, …, up to 60s, remembered for 15 minutes). There is no admin command to clear it. QA waits for `Retry-After`.

QA cannot reach the UAT server, so the same create and delete actions are on `/community/admin/qa-tools` when `QA_TOOLS_ENABLED=true`. The screen is admin-only, creates and deletes only flagged test players, and writes each use to `player_code_audits` (Vellar number and admin id, not the email or phone). The flag is off by default and is ignored when `APP_ENV=production`. Turn it on for the QA window, then set it back to false and reload config when testing is finished. The artisan commands remain for someone on the server.

- Sign-in with an unknown ID and with a wrong password returns the same message.
- A second try too soon returns HTTP 429 and `Retry-After`. The wait starts at 1 second and doubles (2s, 4s, …) up to 60 seconds. When that many seconds have passed, the next try is accepted. It does not lock the account for 15 minutes.
- The failure count is remembered for 15 minutes. Another failure inside that 15 minutes continues the doubling. After 15 minutes with no further failure for that ID and for that IP, the count is gone and the next failure starts again at 1 second. A successful sign-in clears the wait for that ID. It does not clear the wait for the IP, so the IP still follows `Retry-After`. There is no admin command to clear it. QA waits for `Retry-After` (at most 60 seconds).
- A signed-in player cannot read another player's phone, address, or recovery email on `GET /api/community/members/{id}`.
- `GET /api/community/analytics` is admin-only.

The end-to-end reset is only the one flagged email-only test player from step 3 (`you@example.com` replaced with an inbox the team controls). On that account, after `NUVRA_RETIRE_SHARED_PASSWORDS=true`:

- The shared password `password` does not open a session, and an old session for that account is rejected.
- An activation code sets a new password once, and a second use of that code fails.
- A recovery-email link, when mail is configured, opens `/reset-password?token=...` and works once.
- A reset request returns the same message whether or not the ID or the contact exists.

Then run `php artisan nuvra:delete-test-players`. That deletes only flagged test players.

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

## 7. Admin password

`NUVRA_FORCE_ADMIN_PASSWORD_CHANGE` is false unless you set it. With it false, the UAT admin keeps signing in with the current password, including the shared default. Backoff and the generic failure message stay on either way. A wrong admin password, and an email that is not an account, both return the same failure message and the same escalating wait.

On UAT, leave the flag false. Trying the forced change here is optional. To try it: set `NUVRA_FORCE_ADMIN_PASSWORD_CHANGE=true`, reload config, sign in on `/community`, and set a password of at least 12 characters with upper and lower case letters and a number. That step does not send email or SMS. Set the flag back to false if you want the old password to work again.

For production promotion this flag must be true, and every admin must have changed off `password`, `password123`, and `Nuvra2026!`. See Part 2.

## 8. How admin accounts are created

**On `uat` (this branch).** `DatabaseSeeder` calls `TournamentMasterbaseSeeder`, which `firstOrCreate`s `admin@vellarleague.com` with role `admin` and `Hash::make('password')`. `firstOrCreate` does not reset the password if that email already exists. `CommunitySeeder` and `PlayerDummySeeder` can also create an admin (`owner@nuvra.com`) with the same shared password, but `DatabaseSeeder` does not call them. No migration inserts an admin. Public registration creates players only, with status `pending`.

**On `main` (inspected, not changed).** `DatabaseSeeder` calls only `PlayerDummySeeder`, which `updateOrCreate`s `owner@nuvra.com` with role `club_owner` and `Hash::make('password')`. `CommunitySeeder` does the same for `owner@nuvra.com` as `club_owner` if someone runs it by hand. `ResetSeeder` is not called by `DatabaseSeeder`; if someone runs it, it creates `admin@nuvra.com` as `community_admin` and as `admin` and stores the shared password `Nuvra2026!`, and it prints that password. `TournamentMasterbaseSeeder` is not on `main`. No migration on `main` inserts an admin or rewrites `users.password`.

The UAT snapshot read earlier has one admin, `admin@vellarleague.com`, and that hash matches `password`.

## 9. Admin second factor

A TOTP second factor is not in this change. Laravel Sanctum is the only auth package here, and a correct TOTP setup also needs an encrypted secret, an enrollment confirmation, clock skew, replay protection, and a recovery path so the only admin is not locked out. That is not small enough to add behind a flag in this pull request. It remains a production launch prerequisite, after the admin password change in Part 2.

# Part 2 — Production promotion

Open a separate pull request from the tested `uat` revision into `main`. The owner approves that pull request. Do not promote from this change, and do not invite a production player until every item below is done on production after that deploy.

Deploying does not retire passwords or send messages.

## Required before the promotion is treated as live

1. **Verified reset is on, and one flagged email-only test account has proved it.** On production, create that player with `php artisan nuvra:create-test-players you@example.com` (replace `you@example.com` with an inbox the team controls; do not pass a phone). Leave `NUVRA_RETIRE_SHARED_PASSWORDS` false until that account finishes a real reset. Then set the flag to `true`, reload config, and confirm the shared password `password` no longer opens a session for that test account. Delete it with `php artisan nuvra:delete-test-players`, which removes only flagged test players.
2. **No shared or default password remains on a player or an admin.** Run the count-only check below. Both weak-password counts must be 0. The player retire command does not change admin passwords.
3. **Admin forced password change is on, and admin passwords have been changed.** Set `NUVRA_FORCE_ADMIN_PASSWORD_CHANGE=true`, reload config, and have each admin sign in and set a new password. This does not send email or SMS. The audit then reports `Admin accounts on a known weak password: 0`. On UAT this step is optional. On production it is required.
4. **Production secrets have been rotated** so none of them are values that appear in git history. See the scan below. Do this before the promotion deploy if the current production values are the leaked ones, and again if a deploy would copy an old secret back.
5. **UAT gate status is a recorded decision.** On production, leave `UAT_BASIC_AUTH_USER` and `UAT_BASIC_AUTH_PASS` empty unless the owner has decided production should sit behind the same gate. Write down which choice was made. On UAT, record whether the gate stays on after testing. `QA_TOOLS_ENABLED` must be false before promotion. Production forces the QA screen off even if the variable is left true.

Also set production mail variables before offering email reset. Leave `SMS_DRIVER` unset or `none` until one test send has succeeded on production. Run `php artisan migrate --force` if the deploy does not migrate for you. Repeat the Part 1 verification on production. Invite players only after that.

## Count-only password check

On the production server. This prints integers only. It does not print names, emails, phone numbers, or hashes.

```bash
php artisan players:contact-audit
```

Promotion stays blocked while either of these lines is above zero:

- `Players on a known weak password`
- `Admin accounts on a known weak password`

The known weak passwords are the ones the seeders write: `password`, `password123`, and `Nuvra2026!`.

## Secrets the history scan found

Scanned git history on 2026-09-28. Values are not copied here.

| Secret | What history shows | What to rotate |
| --- | --- | --- |
| SSH deploy key and passphrase | `ssh_deploy.exp`, `deploy_vm.exp`, `final_deploy.exp`, `force_deploy_vm.exp`, `manual_deploy.exp`, and `fix_github_ssh.exp` spawn SSH and send a passphrase. `deploy.sh` names the GitHub deploy key path on the server. No private-key block (`BEGIN OPENSSH PRIVATE KEY` / `BEGIN RSA PRIVATE KEY`) was found. | Replace the GitHub deploy key, the SSH login passphrase those scripts send, and the Actions secret `SSH_PRIVATE_KEY` if it is that same key. Remove the scripts from the working tree (a separate change). History still contains the passphrase, so rotation is required even after the files are gone. |
| `APP_KEY` | Every committed `.env.example` has an empty `APP_KEY`. No `APP_KEY=base64:` value was found. | Rotate the production `APP_KEY` if it was ever copied into a shell, a log, or a file this scan did not see. Rotation signs everyone out. |
| Database | `.env.example` has an empty `DB_PASSWORD`. No database password value was found in the tree. | Rotate the production database user password. The leaked SSH login could read the server `.env`. |
| Mail | `MAIL_PASSWORD` in `.env.example` is empty. No SMTP password was found. | Rotate the production mail password if one is set on the server. |
| SMS | No SMS token value was found. | Rotate `SMS_HTTP_TOKEN` if one was ever placed on the server. |
| Payment | Billplz keys in `config/services.php` are `env()` references only. No key value was found in `TECHNICAL_DOCUMENT.md` or the config. | Rotate `BILLPLZ_API_KEY` and `BILLPLZ_X_SIGNATURE` if they were set on the server. |
| Google | `GOOGLE_CLIENT_SECRET` is an `env()` reference only. | Rotate it if it was set on the server. |

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
