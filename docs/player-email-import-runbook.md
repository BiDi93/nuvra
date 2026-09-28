# Player email import

Players sign in with a Vellar ID. `CommunityAuthController::login` takes `vellar_id`, and `PlayerLocator::find` resolves a number to the login address `vellar{number}@vellarleague.com` in `users.email`. That column is the login key. The import never overwrites it.

The import writes the recovery address on `contact_email`. The reset link and `players:contact-audit` already use that field, and they treat `@vellarleague.com` as no route. Do not add another email column.

There is no web upload.

## Collect the CSV

Team managers collect emails offline. Before a row goes in the file, confirm the person against something already known. Use the phone number on file, or have their team manager vouch for them. Never accept an address from someone who only knows the Vellar ID. This is the same identity check as `docs/admin-activation-runbook.md`.

The file is CSV. Save the spreadsheet as CSV. It needs a Vellar ID column and an email column. An optional collected-by column (the manager's name or ID) is stored on each audit row. Header names can vary in case and spacing (`Vellar ID`, `vellar_id`, `E-mail`, `Collected by`).

Managers send the file through a private channel only. Do not send it in chat or in an email thread.

On the server, put the file outside the web root, outside this repository, and restrict it:

```bash
chmod 600 /absolute/path/outside/the/web/root/players.csv
```

The command refuses a path inside the repo. `player-email-imports/`, `*.csv`, and `*.xlsx` are gitignored so a copy left in the tree is not committed. Do not commit the file.

## Import

A dry run does not need `--admin-id` and writes nothing, including no audit rows. `--admin-id` is required with `--apply` and must be an admin. Emails are trimmed and lowercased before they are compared or stored. The output is counts and row numbers. Any address in that output is masked the same way as `player_email_audits`. The output includes the SHA-256 hash of the file. The command does not send email.

```bash
php artisan players:import-emails /absolute/path/outside/the/web/root/players.csv
```

Review the problem rows. Rows where one Vellar ID has different emails are skipped. Rows where one email maps to more than one player are skipped, because that inbox could reset each of those accounts. A row that would replace a different existing recovery email is skipped unless you pass `--replace-existing`. Valid rows are written in one transaction, so a clash cannot leave the import half-written.

```bash
php artisan players:import-emails /absolute/path/outside/the/web/root/players.csv --admin-id=1 --apply
```

Replace the path and `--admin-id`. Each applied change is stored in `player_email_audits`: the player id, the admin id, the collector, a masked old address, a masked new address, the time, and the file hash. The row does not store the full address or a password.

Running the same file again changes 0 rows.

Then check the counts and retire the shared password for the players who now have a real recovery email. `--only-with-route` retires those players and leaves everyone else on the shared password. It does not refuse the run because other players have no route. It still refuses when `NUVRA_SHARED_DEFAULT_PASSWORD` is unset.

```bash
php artisan players:contact-audit
php artisan players:retire-default-passwords
php artisan players:retire-default-passwords --force --only-with-route
```

The retire command changes nothing until you pass `--force`. A `@vellarleague.com` address, including the login key, is not a delivery route.

Delete the import file after `--apply`.

```bash
rm /absolute/path/outside/the/web/root/players.csv
```

## Mail on UAT

UAT needs a real mail provider. `MAIL_MAILER=log` is not acceptable. It writes the live reset link into `storage/logs`, and storage is currently mode `777`. Set `APP_URL=https://uat.nuvrasports.com` so links point there and not at localhost. After editing `.env`, run `php artisan config:cache`. The sender domain must pass SPF and DKIM.

After a test send, someone with server access checks the mail log and the app log. The send should be recorded. The log must not contain a full address, the reset link, or the token.

## Warning

A wrong email gives that inbox control of the account. The reset link is sent there. Confirm identity before the file is applied, and delete the file afterwards.
