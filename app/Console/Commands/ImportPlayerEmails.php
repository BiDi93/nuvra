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

class ImportPlayerEmails extends Command
{
    protected $signature = 'players:import-emails
        {file : CSV or XLSX outside the repository, with a Vellar ID column and an email column}
        {--apply : Write the valid rows. Without this flag the command only reports counts.}
        {--admin-id= : Required user id of the admin running the import}';

    protected $description = 'Import verified recovery emails for players. Dry-run unless --apply is passed. Does not print email addresses.';

    public function handle(): int
    {
        $admin = $this->admin();

        if (! $admin) {
            return self::FAILURE;
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

        $plan = $this->classify($rows);
        $apply = (bool) $this->option('apply');
        $written = 0;

        if ($apply && $plan['ready'] !== []) {
            $written = $this->write($plan['ready'], $admin->id, $hash);
        }

        $this->report($plan['counts'], $plan['problems'], count($plan['ready']), $written, $apply);

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
     * @param  list<array{row: int, vellar_id: string, email: string}>  $rows
     * @return array{counts: array<string, int>, problems: list<array{row: int, reason: string}>, ready: list<array{player_id: int, email: string}>}
     */
    private function classify(array $rows): array
    {
        $counts = [
            'invalid email' => 0,
            'placeholder email' => 0,
            'unknown Vellar ID' => 0,
            'not a player' => 0,
            'duplicate in file' => 0,
            'email already held' => 0,
            'unchanged' => 0,
        ];

        $prepared = [];

        foreach ($rows as $row) {
            $vellar = trim($row['vellar_id']);
            $email = strtolower(trim($row['email']));
            $prepared[] = [
                'row' => $row['row'],
                'vellar' => $vellar,
                'email' => $email,
                'id_key' => $this->idKey($vellar),
            ];
        }

        $usable = [];
        $early = [];

        foreach ($prepared as $index => $row) {
            if (! $this->validEmail($row['email'])) {
                $early[$index] = 'invalid email';

                continue;
            }

            if ($this->placeholder($row['email'])) {
                $early[$index] = 'placeholder email';

                continue;
            }

            if ($row['id_key'] === '') {
                $early[$index] = 'unknown Vellar ID';

                continue;
            }

            $usable[$index] = $row;
        }

        $conflict = $this->conflicts($usable);
        $seenIds = [];
        $problems = [];
        $ready = [];

        foreach ($prepared as $index => $row) {
            if (isset($early[$index])) {
                $reason = $early[$index];
            } elseif (isset($conflict[$index]) || isset($seenIds[$row['id_key']])) {
                $reason = 'duplicate in file';
            } else {
                $seenIds[$row['id_key']] = true;
                $reason = $this->accountReason($row, $ready);
            }

            if ($reason === null) {
                continue;
            }

            $counts[$reason]++;
            $problems[] = ['row' => $row['row'], 'reason' => $reason];
        }

        return [
            'counts' => $counts,
            'problems' => $problems,
            'ready' => $ready,
        ];
    }

    /**
     * @param  array<int, array{row: int, vellar: string, email: string, id_key: string}>  $usable
     * @return array<int, true>
     */
    private function conflicts(array $usable): array
    {
        $byId = [];
        $byEmail = [];

        foreach ($usable as $index => $row) {
            $byId[$row['id_key']][] = $index;
            $byEmail[$row['email']][] = $index;
        }

        $conflict = [];

        foreach ($byId as $indexes) {
            $emails = [];

            foreach ($indexes as $index) {
                $emails[$usable[$index]['email']] = true;
            }

            if (count($indexes) > 1 && count($emails) > 1) {
                foreach ($indexes as $index) {
                    $conflict[$index] = true;
                }
            }
        }

        foreach ($byEmail as $indexes) {
            $ids = [];

            foreach ($indexes as $index) {
                $ids[$usable[$index]['id_key']] = true;
            }

            if (count($ids) > 1) {
                foreach ($indexes as $index) {
                    $conflict[$index] = true;
                }
            }
        }

        return $conflict;
    }

    /**
     * @param  array{row: int, vellar: string, email: string, id_key: string}  $row
     * @param  list<array{player_id: int, email: string}>  $ready
     */
    private function accountReason(array $row, array &$ready): ?string
    {
        $player = $this->findAccount($row['vellar']);

        if (! $player) {
            return 'unknown Vellar ID';
        }

        if ($player->role !== 'player') {
            return 'not a player';
        }

        $current = strtolower(trim((string) $player->contact_email));

        if ($current === $row['email']) {
            return 'unchanged';
        }

        if ($this->emailHeldBySomeoneElse($row['email'], $player->id)) {
            return 'email already held';
        }

        $ready[] = [
            'player_id' => $player->id,
            'email' => $row['email'],
        ];

        return null;
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

    private function idKey(string $vellar): string
    {
        return preg_replace('/\D/', '', $vellar) ?? '';
    }

    /**
     * @param  list<array{player_id: int, email: string}>  $ready
     */
    private function write(array $ready, int $adminId, string $hash): int
    {
        return DB::transaction(function () use ($ready, $adminId, $hash) {
            $written = 0;

            foreach ($ready as $row) {
                $player = User::query()->whereKey($row['player_id'])->lockForUpdate()->first();

                if (! $player || $player->role !== 'player') {
                    continue;
                }

                $email = $row['email'];
                $current = strtolower(trim((string) $player->contact_email));

                if ($current === $email || $this->emailHeldBySomeoneElse($email, $player->id)) {
                    continue;
                }

                $old = $player->contact_email;
                $player->forceFill(['contact_email' => $email])->save();

                PlayerEmailAudit::create([
                    'player_id' => $player->id,
                    'admin_id' => $adminId,
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
     * @param  array<string, int>  $counts
     * @param  list<array{row: int, reason: string}>  $problems
     */
    private function report(array $counts, array $problems, int $ready, int $written, bool $apply): void
    {
        foreach ($counts as $label => $count) {
            $this->line(ucfirst($label).': '.$count);
        }

        $this->line($apply ? 'Updated: '.$written : 'Would update: '.$ready);

        foreach ($problems as $problem) {
            $this->line('Row '.$problem['row'].': '.$problem['reason']);
        }

        if ($apply) {
            $this->info('Updated '.$written.' player account(s).');
        } else {
            $this->info('Dry run only. No accounts were changed.');
        }
    }
}
