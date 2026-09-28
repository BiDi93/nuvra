# Go-live checklist

This work lands on `uat` first. The owner tests and confirms there. Production (`main`) is a later promotion pull request that the owner approves. This change does not edit `main`.

- **Part 1** is the UAT go-live. Merge and deploy to UAT, then run the checks there.
- **Part 2** is the production promotion. Do not open that pull request until every item in Part 2 is true.

Merge https://github.com/BiDi93/nuvra/pull/22 (`cursor/security-cleanup-uat-5200`) into `uat` before this pull request. That pull request makes analytics admin-only, hides phone and address on public profiles, tightens fixture edits, adds `GET /api/community/public-stats`, and changes the UAT deploy workflow and `.gitignore`. It does not move the masterbase workbook. This pull request removes that workbook from the tree.

Both pull requests edit `.gitignore`. Merge #22 first. Keep #22's `*.exp`, `._*`, `.!*`, `/nuvra_db`, and `*.sqlite` lines, and keep this pull request's `*.xlsx`, `*.csv`, `nuvra_db-*`, and `.env.*` lines (`!.env.example` stays so the example file remains tracked).

Fixture edits go through `FootballMatchPolicy` and `TournamentPolicy`. A current admin may edit. A former organizer who was demoted to player still has `organizer_id` on old rows and is refused. `GET /api/community/public-stats` is not on this branch. After #22 is merged, add `throttle:60,1` and about 5 minutes of caching on that route. This pull request does not add the route and does not edit `.github/workflows`.

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
| `NUVRA_SHARED_DEFAULT_PASSWORD` | Required before `NUVRA_RETIRE_SHARED_PASSWORDS=true` and before the Part 2 counts. Set it in the server `.env`, then run `php artisan config:cache`. If the flag is on while this is unset, the setup is invalid. Seeders that must store it refuse to run until it is set. Do not commit a value. This deploy does not change the live admin password. |
| `NUVRA_WEAK_PASSWORDS` | Required before `NUVRA_RETIRE_SHARED_PASSWORDS=true` and before the Part 2 counts. Set it in the server `.env`, then run `php artisan config:cache`. If the flag is on while this is unset, the setup is invalid. The forced admin password change also treats a missing list as invalid. Do not commit values. |
| `NUVRA_TRUSTED_PROXIES` | Leave unset. The default is Cloudflare's published ranges. `*` is ignored. If UAT reaches Cloudflare through a Tunnel or a local proxy, requests arrive from `127.0.0.1`. In that case set `NUVRA_TRUSTED_PROXIES=127.0.0.1`. That is only safe when the origin is closed to everything else. |

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

Before the first email import, and after this deploy, list and clear any recovery emails that were not set by an admin process. The profile form used to accept `contact_email` from a signed-in player. That path is closed. Show counts only. Do not print addresses.

```bash
php artisan players:clear-untrusted-contact-emails
php artisan players:clear-untrusted-contact-emails --force
```

The same counts, without printing addresses:

```sql
SELECT
  SUM(contact_email IS NOT NULL AND TRIM(contact_email) != '') AS with_recovery_email,
  SUM(contact_email IS NOT NULL AND TRIM(contact_email) != '' AND contact_email_source = 'admin') AS set_by_admin,
  SUM(contact_email IS NOT NULL AND TRIM(contact_email) != '' AND (contact_email_source IS NULL OR contact_email_source != 'admin')) AS not_set_by_admin
FROM users;
```

`--force` clears only the last of those three. An admin import, which is a separate change, must set `contact_email_source` to `admin` or this command will clear it. Flagged test players created by `nuvra:create-test-players` are already marked that way.

Set both password variables in the UAT `.env` before you turn the retirement flag on. Then rebuild the cached config. Do not commit the values. `nuvra:create-test-players` also refuses to write until `NUVRA_SHARED_DEFAULT_PASSWORD` is set.

```bash
php artisan config:cache
```

If `NUVRA_RETIRE_SHARED_PASSWORDS=true` while `NUVRA_SHARED_DEFAULT_PASSWORD` is unset, the setup is invalid. The retire command exits with an error and changes nothing. Sign-in does not treat that as "no shared password". The same applies to `NUVRA_FORCE_ADMIN_PASSWORD_CHANGE` when `NUVRA_WEAK_PASSWORDS` is unset.

Create one flagged test player for the reset test. Pass the contact on the command. Do not put a real address in the repo. An email alone is enough; that player has no phone. A phone of 8 to 15 digits may follow the email only when you are testing SMS. This does not email or text anyone. The account is named `NUVRA TEST PLAYER` and uses Vellar ID 900001. You can pass up to three contacts in one command.

```bash
php artisan nuvra:create-test-players you@example.com
```

Replace `you@example.com` with an inbox the team controls. QA runs the end-to-end reset only on this flagged player, not on an existing UAT player.

While `NUVRA_RETIRE_SHARED_PASSWORDS` is still false, enter Vellar `900001` and the shared default on the sign-in form. That opens Set Password and does not create a session. Complete one real reset from there (the recovery email or an admin code, a new password, then a sign-in with that new password). Only after that reset succeeds:

1. Set `NUVRA_RETIRE_SHARED_PASSWORDS=true` in the server `.env`.
2. Run `php artisan config:clear` or `php artisan config:cache`.

From then on, a player still on the shared default cannot get a session or keep an old one. They have to finish a verified reset first. The `--force` retire command refuses to run while the flag is false.

```bash
php artisan players:contact-audit
```

Prints counts only (recovery email, missing phone, invalid phone, shared-password use). It can take a few minutes.

For each player who needs access before they have a recovery email or SMS, an admin who has verified them offline issues one code. The admin sees the code, never the password. The API records which admin issued it, for which player, and when.

```bash
php artisan players:activation-code 123 --admin-id=1
```

Replace `123` with that player's Vellar number. `--admin-id` is required. Confirm the person against the phone number on file, or have their team manager vouch for them, before you issue a code. Never issue one to someone who only knows the Vellar ID. See `docs/admin-activation-runbook.md`. The same action is `POST /api/community/admin/players/{id}/activation-code` for an admin session. The `{id}` is the user id, not the Vellar number. The command and the API send nothing. The code expires in 15 minutes.

Dry run, which changes nothing. It requires `NUVRA_SHARED_DEFAULT_PASSWORD`. If that variable is unset, the command exits with an error whether or not you pass `--force`.

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

- The shared default does not open a session, and an old session for that account is rejected.
- An activation code sets a new password once, and a second use of that code fails.
- A recovery-email link, when mail is configured, opens `/reset-password?token=...` and works once.
- A reset request returns the same message whether or not the ID or the contact exists.

Then run `php artisan nuvra:delete-test-players`. That deletes only flagged test players.

## 6. UAT basic-auth gate

The middleware is `App\Http\Middleware\UatBasicAuth`. It covers requests that reach Laravel only when both `UAT_BASIC_AUTH_USER` and `UAT_BASIC_AUTH_PASS` are non-empty. Otherwise it does nothing, which is the production default. Credentials are compared in constant time and are not logged.

The signed-in app sends the Sanctum token in `Authorization: Bearer`. The gate does not read that header. The first successful basic-auth check sets a signed, HttpOnly, Secure, SameSite=Lax cookie named `nuvra_uat_gate`. It lasts 8 hours (`UAT_BASIC_AUTH_MINUTES`, default 480). Later API calls are accepted with that cookie or with basic-auth credentials.

Files nginx serves directly, including `/build` and `/storage`, never reach Laravel, so they bypass the gate. Do not put private files there.

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

For production promotion this flag must be true, and every admin must have changed off whatever is listed in `NUVRA_WEAK_PASSWORDS`. See Part 2. This deploy does not change the live admin password.

## 8. How admin accounts are created

**On `uat` (this branch).** `DatabaseSeeder` calls `TournamentMasterbaseSeeder`, which creates an admin only when the external workbook is present and `NUVRA_SHARED_DEFAULT_PASSWORD` is set. It uses `firstOrCreate`, so an existing admin password is not reset. If that variable is missing, the seeder throws before it writes. `CommunitySeeder` and `PlayerDummySeeder` are demo seeders. They refuse to run when `APP_ENV=production`, they do not create an admin, and they store a random password. `DatabaseSeeder` does not call them. No migration inserts an admin. Public registration creates players only, with status `pending`. This change does not alter the live UAT admin password.

**On `main` (inspected, not changed).** `DatabaseSeeder` calls only `PlayerDummySeeder`. `ResetSeeder` is not called by `DatabaseSeeder`. `TournamentMasterbaseSeeder` is not on `main`. No migration on `main` inserts an admin or rewrites `users.password`.

## 9. Admin second factor

An admin TOTP or second factor is not required by the owner (decision 2026-09-29). It is not in this change, and it does not block production promotion. The admin password must be long and unique, because it is now the only thing protecting player data.

# Part 2 — Production promotion

Open a separate pull request from the tested `uat` revision into `main`. The owner approves that pull request. Do not promote from this change, and do not invite a production player until every item below is done on production after that deploy.

Deploying does not retire passwords or send messages.

## Operator checks from the security review

Do these in order. This pull request does not rewrite git history and does not edit the deploy workflows.

1. Before the first deploy after #22, take a durable `sqlite3 .backup` of the live database and keep that copy outside the app directory.
2. Production `.github/workflows/deploy.yml` must have #22's fail-fast preserve step before promotion. That step is on #22, not in this pull request. Do not promote until it is on the revision that deploys.
3. Verify the production document root points at `public/`.
4. Retire the local `.exp` and `deploy.sh` scripts. They are not in this tree. They remain on `main` and in git history until a later cleanup.
5. Check that no seeded dummy admin exists on UAT or production. `CommunitySeeder` and `PlayerDummySeeder` no longer create one. Confirm with a count of `role = 'admin'`, not by printing emails.
6. Enable GitHub secret scanning and push protection on the repository.
7. Make the repository private, rotate the SSH key, and rewrite history only after the preserve steps above have landed. Do not rewrite history before that backup exists.

`PaymentControllerBillplz` is not on this branch or on `uat`. It exists only on `main`, and no route on `main` registers it. Delete it in the promotion pull request. It is an IDOR if it is ever routed.

`GET /api/community/public-stats` is added by #22 and is not in this tree. When that route is on the branch, give it `throttle:60,1` and cache the response for about 5 minutes.

## Required before the promotion is treated as live

1. **Verified reset is on, and one flagged email-only test account has proved it.** On production, create that player with `php artisan nuvra:create-test-players you@example.com` (replace `you@example.com` with an inbox the team controls; do not pass a phone). Set `NUVRA_SHARED_DEFAULT_PASSWORD` on the server before that command. Leave `NUVRA_RETIRE_SHARED_PASSWORDS` false until that account finishes a real reset. Then set the flag to `true`, reload config, and confirm the shared default no longer opens a session for that test account. Delete it with `php artisan nuvra:delete-test-players`, which removes only flagged test players.
2. **No shared or default password remains on a player or an admin.** Run the count-only check below. Both counts only count if `NUVRA_SHARED_DEFAULT_PASSWORD` and `NUVRA_WEAK_PASSWORDS` were set when they ran. Both weak-password counts must be 0. The player retire command does not change admin passwords.
3. **Admin forced password change is on, and admin passwords have been changed.** Set `NUVRA_FORCE_ADMIN_PASSWORD_CHANGE=true`, reload config, and have each admin sign in and set a new password. This does not send email or SMS. The audit then reports `Admin accounts on a known weak password: 0`. On UAT this step is optional. On production it is required.
4. **Production secrets have been rotated** so none of them are values that appear in git history. See the scan below. Do this before the promotion deploy if the current production values are the leaked ones, and again if a deploy would copy an old secret back.
5. **UAT gate status is a recorded decision.** On production, leave `UAT_BASIC_AUTH_USER` and `UAT_BASIC_AUTH_PASS` empty unless the owner has decided production should sit behind the same gate. Write down which choice was made. On UAT, record whether the gate stays on after testing. `QA_TOOLS_ENABLED` must be false before promotion. Production forces the QA screen off even if the variable is left true.
6. **`storage` and `bootstrap/cache` are not mode `777`.** Replace the deploy's `chmod -R 777` on those directories with a mode the web user can write and other users cannot.
7. If a deploy fails after `artisan down`, the site stays in maintenance mode. A person checks the database and the release, then runs `php artisan up` by hand. The deploy only runs `artisan up` after every step has succeeded. A pre-flight failure happens before `artisan down`, so the site stays up. Workflow follow-up. This pull request does not edit the workflows.
8. **Trusted proxies are Cloudflare's ranges only, and the origin accepts Cloudflare only.** `NUVRA_TRUSTED_PROXIES` stays empty unless you are replacing the published list. `*` is ignored. Lock the origin firewall so only Cloudflare can reach it. Optional nginx `real_ip`, using `CF-Connecting-IP` and `set_real_ip_from` for those same ranges, is for logs. The app still refuses a spoofed forwarding header from any other address. If UAT reaches Cloudflare through a Tunnel or a local proxy, requests arrive from `127.0.0.1`. In that case `NUVRA_TRUSTED_PROXIES=127.0.0.1` is needed, and it is only safe when the origin is closed to everything else.
9. **`APP_ENV` on production is exactly `production`.** That forces the QA tools off even if `QA_TOOLS_ENABLED` is left true.

Also set production mail variables before offering email reset. Leave `SMS_DRIVER` unset or `none` until one test send has succeeded on production. Run `php artisan migrate --force` if the deploy does not migrate for you. Repeat the Part 1 verification on production. Invite players only after that.

## Count-only password check

On the production server. This prints integers only. It does not print names, emails, phone numbers, or hashes.

```bash
php artisan players:contact-audit
```

Both the shared-default counts and the known-weak counts only count if `NUVRA_SHARED_DEFAULT_PASSWORD` and `NUVRA_WEAK_PASSWORDS` were set when the command ran. If either variable was unset, that line says `not checked` and the command exits non-zero. That run does not count.

Promotion stays blocked while either of these lines is above zero, or while any of them says `not checked`:

- `Players still on the shared default password`
- `Admin accounts still on the shared default password`
- `Players on a known weak password`
- `Admin accounts on a known weak password`

Set both variables in the server `.env`, then run `php artisan config:cache`, before you treat a zero as real. Do not commit the values.

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

`main` seeders and its user factory still contain one shared default. That revision is not changed here. The value is not copied into this document. It remains in git history until the planned history rewrite.

- `database/seeders/DatabaseSeeder.php` calls only `PlayerDummySeeder`.
- `PlayerDummySeeder` and `CommunitySeeder` store one shared hash for the club owner and for player users.
- `database/factories/UserFactory.php` uses that same default.
- `PlayerSeeder` and `CoachSeeder` store one shared hash on the legacy `players` and coaches tables, not on `users`.
- Migration `2026_01_07_153836_add_auth_fields_to_players_table.php` on `main` still defaults the legacy `players.password` column. On this branch that default is gone.
- `ResetSeeder` stores one shared password on the users it creates and prints it when it runs.

`TournamentMasterbaseSeeder` is not on `main`. No migration on `main` updates existing `users.password` values. So production has that shared player password if the database was seeded or copied that way, and it does not if the accounts were created some other way. The code cannot decide which. This change does not alter the live UAT admin password.

The same weaknesses are in the `main` code, independent of what the database holds:

- Community login is `Auth::attempt` on email and password, with no rate limit and no lockout. It does not use the numeric Vellar ID.
- There is no `password_reset_required` flag and no verified first-login reset.
- `approveBooking` and `rejectBooking` do not check the organizer, so any signed-in user can approve or reject any booking. `uploadReceipt` is limited to the signed-in user's own booking, and `bookings` is limited to the organizer or an admin. Those game routes are on `main` and are not on current `uat`.
- `memberProfile` on `main` does not return phone. `getProfile` returns the signed-in user's own phone.
- `PaymentControllerBillplz` is only on `main`. No route registers it, so the callback is not reachable. Delete that controller in the promotion pull request. It is an IDOR if it is ever routed.

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

Then count how many stored hashes still match the shared default or the weak list. Set `NUVRA_SHARED_DEFAULT_PASSWORD` and `NUVRA_WEAK_PASSWORDS` in the server environment first. Do not commit those values. This prints integers only:

```bash
php artisan players:contact-audit
```

A player count above zero on the shared-default line means those accounts still open with it. Run the retire command on production before inviting anyone. If either password variable is unset, the matching line says `not checked` and the command exits non-zero. No account is changed.
