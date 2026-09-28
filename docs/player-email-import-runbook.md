# Player email import

Players sign in with a Vellar ID. The account's login address is the synthetic key `vellar{number}@vellarleague.com`. It is not an inbox. Changing it would break sign-in.

The import writes the recovery address on `contact_email`. The reset link and `players:contact-audit` already use that field. A signed-in player cannot set it. Someone who knows the shared password must not be able to attach their own inbox.

There is no web upload. An admin runs `php artisan players:import-emails` on the server.

## Collect addresses

Team managers collect emails offline. Before a row goes in the file, confirm the person against something already known. Use the phone number on file, or have their team manager vouch for them. Never accept an address from someone who only knows the Vellar ID. This is the same identity check as `docs/admin-activation-runbook.md`.

The file is CSV or XLSX. It needs a Vellar ID column and an email column. Header names can vary in case and spacing (`Vellar ID`, `vellar_id`, `E-mail`, `Recovery email`).

Keep the file outside the repository. The command refuses a path inside the repo. `player-email-imports/`, `*.csv`, and `*.xlsx` are gitignored so a copy left in the tree is not committed. Do not commit the file.

## Import

`--admin-id` is required and must be an admin user id. Without `--apply` the command only prints counts. It does not print email addresses. Problem rows are reported by spreadsheet row number and a reason. Fix those rows and run it again. Valid rows are not written until `--apply`, and then they are written in one transaction.

```bash
php artisan players:import-emails /absolute/path/outside/the/repo/players.csv --admin-id=1
```

Review the problem rows. Then apply:

```bash
php artisan players:import-emails /absolute/path/outside/the/repo/players.csv --admin-id=1 --apply
```

Replace the path and `--admin-id`. Each applied change is stored in `player_email_audits`: the player id, the admin id, a masked old address, a masked new address, the time, and a SHA-256 hash of the file. The row does not store the full address or a password.

Then check the counts and retire the shared password for the players who now have a real recovery email:

```bash
php artisan players:contact-audit
php artisan players:retire-default-passwords
```

The retire command changes nothing until you pass `--force`, and it still refuses to run when `NUVRA_SHARED_DEFAULT_PASSWORD` is unset. It retires players who are still on the shared password and now have a real recovery email. A `@vellarleague.com` address, including the login key, is not a delivery route. If any player still on the shared password has no route, the command refuses and changes nothing. Import those addresses first, or leave those players until you can confirm an inbox, then run it again. Do not pass `--allow-undeliverable` to retire players who have no inbox.

Delete the import file after `--apply`. It contains real addresses.

## Warning

A wrong email gives that inbox control of the account. The reset link is sent there. Confirm identity before the file is applied, and delete the file afterwards.
