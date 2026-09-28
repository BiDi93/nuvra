# Player email import

Players sign in with a Vellar ID. `CommunityAuthController::login` takes `vellar_id`, and `PlayerLocator::find` resolves a number to the login address `vellar{number}@vellarleague.com` in `users.email`. That column is the login key. The import never overwrites it.

The import writes the recovery address on `contact_email`. The reset link and `players:contact-audit` already use that field, and they treat `@vellarleague.com` as no route. Do not add another email column.

There is no web upload. Each address the import writes is marked `contact_email_source = admin`, the same mark an admin process uses. `players:clear-untrusted-contact-emails` keeps those rows.

## Before the first import

Clear recovery emails that have no source. Those were set before this deploy. The command prints counts only. `--force` clears only the unsourced rows. It keeps `source=admin` and `source=player`.

```bash
php artisan players:clear-untrusted-contact-emails
php artisan players:clear-untrusted-contact-emails --force
```

## Collect the CSV

Team managers collect emails offline. The manager takes the email from the player face to face and puts their own name in Collected by. If an email arrives by message instead, it must come from the player's phone number, and the admin checks that number against the one on file before adding the row. The admin removes any row with an empty Collected by before running `--apply`. Never accept an address from someone who only knows the Vellar ID.

The file is CSV. Save the spreadsheet as CSV. It needs a Vellar ID column and an email column. An optional collected-by column (the manager's name or ID) is stored on each audit row. Header names can vary in case and spacing (`Vellar ID`, `vellar_id`, `E-mail`, `Collected by`).

Managers send the file through a private channel only. Do not send it in chat or in an email thread.

On the server, put the file outside the web root, outside this repository, and restrict it:

```bash
chmod 600 /absolute/path/outside/the/web/root/players.csv
```

The command accepts mode `600` or `400`. Any other mode is refused unless you pass `--allow-readable`, which warns and continues. The command also refuses a path inside the repo. `player-email-imports/`, `*.csv`, and `*.xlsx` are gitignored so a copy left in the tree is not committed. Do not commit the file.

## Import

A dry run does not need `--admin-id` and writes nothing, including no audit rows. `--admin-id` is required with `--apply` and must be an admin. Emails are trimmed and lowercased before they are compared or stored. The output is counts and row numbers. Any address in that output is masked the same way as `player_email_audits`. The output includes the SHA-256 hash of the file. The command does not send email.

```bash
php artisan players:import-emails /absolute/path/outside/the/web/root/players.csv
```

Review the problem rows. The dry run reports `Rows with no Collected by`, with the row numbers. Remove those rows before `--apply`. A row repeated inside the file is reported as `duplicate row in file`. Rows where one Vellar ID has different emails are skipped. Rows where one email maps to more than one player are skipped, because that inbox could reset each of those accounts. A row that would replace a different existing recovery email is skipped unless you pass `--replace-existing`. A row whose email already matches the current recovery email is unchanged and is not written again. Valid rows are written in one transaction, so a clash cannot leave the import half-written. If the transaction rolls back, the command prints the row number and a fixed reason. It does not print the database error. After `--apply`, each written row is marked `applied`.

```bash
php artisan players:import-emails /absolute/path/outside/the/web/root/players.csv --admin-id=1 --apply
```

Replace the path and `--admin-id`. Each applied change is stored in `player_email_audits`: the player id, the admin id, the collector, a masked old address, a masked new address, the time, and the file hash. The row does not store the full address or a password. The player's `contact_email_source` is set to `admin`, so a later `players:clear-untrusted-contact-emails --force` does not remove it.

Running the same file again changes 0 rows.

Before each `--only-with-route` batch, managers tell that batch: your old password will stop working, use Forgot password. If a deadline is set, include it.

Then check the counts and retire the shared password for the players who now have a real recovery email. `--only-with-route` retires those players and leaves everyone else on the shared password. It does not refuse the run because other players have no route. It still refuses when `NUVRA_SHARED_DEFAULT_PASSWORD` is unset. Keep `NUVRA_RETIRE_SHARED_PASSWORDS` off during these batches. This mode does not require that flag. Retired players get a new random password and `password_reset_required`, so they must set a new password even while the flag is off. Players left on the shared password can still sign in with it. Turn the flag on only for the final retirement, when nobody who matters is still on the shared password.

```bash
php artisan players:contact-audit
php artisan players:retire-default-passwords
php artisan players:retire-default-passwords --force --only-with-route
```

The retire command changes nothing until you pass `--force`. A `@vellarleague.com` address, including the login key, is not a delivery route.

After the admin confirms the apply, managers delete their own copies of the file and the messages they sent through the private channel. Delete the server copy as well.

```bash
rm /absolute/path/outside/the/web/root/players.csv
```

## Mail on UAT

UAT needs a real mail provider. `MAIL_MAILER=log` is not acceptable. It writes the live reset link into `storage/logs`, and storage is currently mode `777`. Set `APP_URL=https://uat.nuvrasports.com` so links point there and not at localhost. After editing `.env`, run `php artisan config:cache`. The sender domain must pass SPF and DKIM.

After a test send, someone with server access checks the mail log and the app log. The send should be recorded. The log must not contain a full address, the reset link, or the token.

## Warning

A wrong email gives that inbox control of the account. The reset link is sent there. Confirm identity before the file is applied, and delete the file afterwards.
