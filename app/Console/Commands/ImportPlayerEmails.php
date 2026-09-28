<?php

namespace App\Console\Commands;

use App\Models\PlayerEmailAudit;
use App\Models\User;
use App\Support\EmailMask;
use App\Support\PlayerContact;
use App\Support\PlayerEmailSheet;
use App\Support\PlayerLocator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class ImportPlayerEmails extends Command
{
    protected $signature = 'players:import-emails
        {file : CSV outside the repository. Columns: Vellar ID, email, and an optional collected-by column.}
        {--apply : Write the valid rows. Without this flag the command only reports counts.}
        {--admin-id= : Required with --apply. User id of the admin running the import.}
        {--replace-existing : Replace a recovery email that is already set to a different address.}';

    protected $description = 'Import verified recovery emails for players. Dry-run unless --apply is passed. Does not send email.';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $admin = null;

        if ($apply) {
            $admin = $this->admin();

            if (! $admin) {
                return self::FAILURE;
            }
        }

        $path = $this->importPath((string) $this->argument('file'));

        if ($path === null) {
            return self::FAILURE;
        }

        $hash = hash_file('sha256', $path);

        if ($hash === false) {
            $this->error('The import file could not be read. Nothing was changed.');

            return self::FAILURE;
        }

        try {
            $rows = PlayerEmailSheet::read($path);
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $plan = $this->classify($rows, (bool) $this->option('replace-existing'));
        $written = 0;

        if ($apply && $plan['ready'] !== []) {
            try {
                $written = $this->write($plan['ready'], $admin->id, $hash);
            } catch (Throwable $exception) {
                $this->error('The import was rolled back. No accounts were changed.');

                return self::FAILURE;
            }
        }

        $this->report($plan, $hash, $written, $apply);

        return self::SUCCESS;
    }

    private function admin(): ?User
    {
        $adminId = $this->option('admin-id');

        if ($adminId === null || $adminId === '' || ! ctype_digit((string) $adminId)) {
            $this->error('--admin-id is required. Pass the user id of the admin running this import.');

            return null;
        }

        $admin = User::query()->find((int) $adminId);

        if (! $admin || $admin->role !== 'admin') {
            $this->error('--admin-id must be an admin account.');

            return null;
        }

        return $admin;
    }

    private function importPath(string $argument): ?string
    {
        if ($argument === '' || ! is_file($argument)) {
            $this->error('The import file was not found. Nothing was changed.');

            return null;
        }

        $real = realpath($argument);
        $root = realpath(base_path());

        if ($real === false || $root === false || $real === $root || str_starts_with($real, $root.DIRECTORY_SEPARATOR)) {
            $this->error('The import file must live outside the repository. Nothing was changed.');

            return null;
        }

        return $real;
    }

    /**
     * @param  list<array{row: int, vellar_id: string, email: string, collected_by: string}>  $rows
     * @return array{
     *     counts: array<string, int>,
     *     lines: list<array{row: int, reason: string, mask: string}>,
     *     ready: list<array{player_id: int, email: string, collected_by: ?string, current: string}>,
     *     with_route: int,
     *     without_route: int
     * }
     */
    private function classify(array $rows, bool $replaceExisting): array
    {
        $counts = [
            'read' => count($rows),
            'unchanged' => 0,
            'invalid' => 0,
            'missing' => 0,
            'different' => 0,
            'shared' => 0,
            'replace' => 0,
        ];
        $lines = [];
        $open = [];

        foreach ($rows as $index => $row) {
            $email = strtolower(trim($row['email']));
            $idKey = preg_replace('/\D/', '', $row['vellar_id']) ?? '';
            $mask = EmailMask::mask($email);
            $record = [
                'row' => $row['row'],
                'email' => $email,
                'id_key' => $idKey,
                'mask' => $mask,
                'collected_by' => $this->collectedBy($row['collected_by']),
            ];

            if (! $this->validEmail($email) || $this->placeholder($email)) {
                $counts['invalid']++;
                $lines[] = ['row' => $row['row'], 'reason' => 'invalid email or placeholder', 'mask' => $mask];

                continue;
            }

            $player = $this->findAccount($row['vellar_id']);

            if (! $player || $player->role !== 'player') {
                $counts['missing']++;
                $lines[] = ['row' => $row['row'], 'reason' => 'Vellar ID not found or not a player', 'mask' => $mask];

                continue;
            }

            $record['player_id'] = $player->id;
            $record['current'] = strtolower(trim((string) $player->contact_email));
            $open[$index] = $record;
        }

        $seen = [];

        foreach ($open as $index => $row) {
            $key = $row['id_key'].'|'.$row['email'];

            if (isset($seen[$key])) {
                $counts['unchanged']++;
                $lines[] = ['row' => $row['row'], 'reason' => 'unchanged', 'mask' => $row['mask']];
                unset($open[$index]);

                continue;
            }

            $seen[$key] = true;
        }

        $emailsById = [];

        foreach ($open as $row) {
            $emailsById[$row['id_key']][$row['email']] = true;
        }

        foreach ($open as $index => $row) {
            if (count($emailsById[$row['id_key']]) > 1) {
                $counts['different']++;
                $lines[] = ['row' => $row['row'], 'reason' => 'same ID with different emails', 'mask' => $row['mask']];
                unset($open[$index]);
            }
        }

        $idsByEmail = [];

        foreach ($open as $row) {
            $idsByEmail[$row['email']][$row['id_key']] = true;
        }

        foreach ($open as $index => $row) {
            if (count($idsByEmail[$row['email']]) > 1) {
                $counts['shared']++;
                $lines[] = ['row' => $row['row'], 'reason' => 'email maps to more than one player', 'mask' => $row['mask']];
                unset($open[$index]);
            }
        }

        $ready = [];

        foreach ($open as $row) {
            if ($this->emailHeldBySomeoneElse($row['email'], $row['player_id'])) {
                $counts['shared']++;
                $lines[] = ['row' => $row['row'], 'reason' => 'email maps to more than one player', 'mask' => $row['mask']];

                continue;
            }

            if ($row['current'] === $row['email']) {
                $counts['unchanged']++;
                $lines[] = ['row' => $row['row'], 'reason' => 'unchanged', 'mask' => $row['mask']];

                continue;
            }

            if ($row['current'] !== '' && ! $replaceExisting) {
                $counts['replace']++;
                $lines[] = ['row' => $row['row'], 'reason' => 'would replace an existing recovery email', 'mask' => $row['mask']];

                continue;
            }

            $ready[] = [
                'player_id' => $row['player_id'],
                'email' => $row['email'],
                'collected_by' => $row['collected_by'],
                'current' => $row['current'],
                'row' => $row['row'],
                'mask' => $row['mask'],
            ];
            $lines[] = ['row' => $row['row'], 'reason' => 'would apply', 'mask' => $row['mask']];
        }

        usort($lines, fn (array $left, array $right) => $left['row'] <=> $right['row']);

        [$withRoute, $withoutRoute] = $this->routeProjection($ready);

        return [
            'counts' => $counts,
            'lines' => $lines,
            'ready' => $ready,
            'with_route' => $withRoute,
            'without_route' => $withoutRoute,
        ];
    }

    /**
     * @param  list<array{player_id: int, email: string}>  $ready
     * @return array{0: int, 1: int}
     */
    private function routeProjection(array $ready): array
    {
        $projected = [];

        User::query()
            ->where('role', 'player')
            ->orderBy('id')
            ->each(function (User $player) use (&$projected) {
                $projected[$player->id] = strtolower(trim((string) $player->contact_email));
            });

        foreach ($ready as $row) {
            $projected[$row['player_id']] = $row['email'];
        }

        $withRoute = 0;
        $withoutRoute = 0;

        foreach ($projected as $email) {
            if (PlayerContact::usableEmail($email) !== null) {
                $withRoute++;
            } else {
                $withoutRoute++;
            }
        }

        return [$withRoute, $withoutRoute];
    }

    private function findAccount(string $vellarId): ?User
    {
        $vellarId = trim($vellarId);

        if ($vellarId === '' || str_contains($vellarId, '@')) {
            return null;
        }

        return PlayerLocator::find($vellarId);
    }

    private function emailHeldBySomeoneElse(string $email, int $playerId): bool
    {
        return User::query()
            ->where('id', '!=', $playerId)
            ->where(function ($query) use ($email) {
                $query->whereRaw('lower(contact_email) = ?', [$email])
                    ->orWhereRaw('lower(email) = ?', [$email]);
            })
            ->exists();
    }

    private function validEmail(string $email): bool
    {
        if ($email === '' || strlen($email) > 255) {
            return false;
        }

        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    private function placeholder(string $email): bool
    {
        if (PlayerContact::isPlaceholderEmail($email)) {
            return true;
        }

        $domain = strtolower(substr(strrchr($email, '@') ?: '', 1));

        if (in_array($domain, ['nuvra.com', 'example.invalid', 'localhost'], true)) {
            return true;
        }

        $local = strtolower(strstr($email, '@', true) ?: '');

        return in_array($local, ['noreply', 'no-reply', 'noemail', 'placeholder', 'none', 'null'], true);
    }

    private function collectedBy(string $value): ?string
    {
        $value = trim($value);

        if ($value === '') {
            return null;
        }

        return mb_substr($value, 0, 120);
    }

    /**
     * @param  list<array{player_id: int, email: string, collected_by: ?string, current: string, row: int, mask: string}>  $ready
     */
    private function write(array $ready, int $adminId, string $hash): int
    {
        $replaceExisting = (bool) $this->option('replace-existing');

        return DB::transaction(function () use ($ready, $adminId, $hash, $replaceExisting) {
            $written = 0;
            $assigned = [];

            foreach ($ready as $row) {
                $player = User::query()->whereKey($row['player_id'])->lockForUpdate()->first();

                if (! $player || $player->role !== 'player') {
                    throw new RuntimeException('The import was rolled back.');
                }

                $email = strtolower(trim($row['email']));
                $current = strtolower(trim((string) $player->contact_email));

                if ($current === $email) {
                    continue;
                }

                if ($current !== '' && ! $replaceExisting) {
                    throw new RuntimeException('The import was rolled back.');
                }

                if ($this->emailHeldBySomeoneElse($email, $player->id) || isset($assigned[$email])) {
                    throw new RuntimeException('The import was rolled back.');
                }

                $old = $player->contact_email;
                $player->forceFill(['contact_email' => $email])->save();
                $assigned[$email] = $player->id;

                PlayerEmailAudit::create([
                    'player_id' => $player->id,
                    'admin_id' => $adminId,
                    'collected_by' => $row['collected_by'],
                    'old_email_masked' => EmailMask::mask($old),
                    'new_email_masked' => EmailMask::mask($email),
                    'source_sha256' => $hash,
                    'created_at' => now(),
                ]);

                $written++;
            }

            return $written;
        });
    }

    /**
     * @param  array{
     *     counts: array<string, int>,
     *     lines: list<array{row: int, reason: string, mask: string}>,
     *     ready: list<array{player_id: int, email: string, collected_by: ?string, current: string, row: int, mask: string}>,
     *     with_route: int,
     *     without_route: int
     * }  $plan
     */
    private function report(array $plan, string $hash, int $written, bool $apply): void
    {
        $counts = $plan['counts'];

        $this->line('File SHA-256: '.$hash);
        $this->line('Rows read: '.$counts['read']);
        $this->line('Rows to apply: '.count($plan['ready']));
        $this->line('Rows unchanged: '.$counts['unchanged']);
        $this->line('Invalid email or placeholder: '.$counts['invalid']);
        $this->line('Vellar ID not found or not a player: '.$counts['missing']);
        $this->line('Same ID with different emails: '.$counts['different']);
        $this->line('Email maps to more than one player: '.$counts['shared']);
        $this->line('Would replace an existing recovery email: '.$counts['replace']);
        $this->line('Players with a route afterwards: '.$plan['with_route']);
        $this->line('Players with no route afterwards: '.$plan['without_route']);

        if ($apply) {
            $this->line('Rows applied: '.$written);
        }

        foreach ($plan['lines'] as $line) {
            $this->line('Row '.$line['row'].': '.$line['reason'].' '.$line['mask']);
        }

        if ($apply) {
            $this->info('Updated '.$written.' player account(s). No email was sent.');
        } else {
            $this->info('Dry run only. No accounts were changed.');
        }
    }
}
