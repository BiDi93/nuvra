<?php

namespace App\Console\Commands;

use App\Models\PlayerEmailAudit;
use App\Models\User;
use App\Support\EmailMask;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearUnimportedContactEmails extends Command
{
    protected $signature = 'players:clear-unimported-emails
        {--apply : Clear recovery emails that were not set by the import. Without this flag the command only prints a count.}
        {--admin-id= : Required with --apply. User id of the admin running the clear.}';

    protected $description = 'Count or clear player recovery emails that were not set by players:import-emails. Prints counts only.';

    public function handle(): int
    {
        $players = $this->unimported();
        $this->line('Recovery emails not set by the import: '.count($players));

        if (! $this->option('apply')) {
            $this->info('Dry run only. No accounts were changed.');

            return self::SUCCESS;
        }

        $admin = $this->admin();

        if (! $admin) {
            return self::FAILURE;
        }

        $cleared = DB::transaction(function () use ($players, $admin) {
            $count = 0;

            foreach ($players as $player) {
                $fresh = User::query()->whereKey($player->id)->lockForUpdate()->first();

                if (! $fresh || trim((string) $fresh->contact_email) === '') {
                    continue;
                }

                $latest = PlayerEmailAudit::query()
                    ->where('player_id', $fresh->id)
                    ->orderByDesc('id')
                    ->first();

                if ($latest && $latest->source === 'import') {
                    continue;
                }

                $old = $fresh->contact_email;
                $fresh->forceFill(['contact_email' => null])->save();

                PlayerEmailAudit::create([
                    'player_id' => $fresh->id,
                    'admin_id' => $admin->id,
                    'source' => 'clear',
                    'old_email_masked' => EmailMask::mask($old),
                    'new_email_masked' => EmailMask::mask(null),
                    'created_at' => now(),
                ]);

                $count++;
            }

            return $count;
        });

        $this->line('Cleared: '.$cleared);
        $this->info('Cleared '.$cleared.' recovery email(s). No email was sent.');

        return self::SUCCESS;
    }

    /**
     * @return list<User>
     */
    private function unimported(): array
    {
        $found = [];

        User::query()
            ->where('role', 'player')
            ->whereNotNull('contact_email')
            ->orderBy('id')
            ->each(function (User $player) use (&$found) {
                if (trim((string) $player->contact_email) === '') {
                    return;
                }

                $latest = PlayerEmailAudit::query()
                    ->where('player_id', $player->id)
                    ->orderByDesc('id')
                    ->first();

                if ($latest && $latest->source === 'import') {
                    return;
                }

                $found[] = $player;
            });

        return $found;
    }

    private function admin(): ?User
    {
        $adminId = $this->option('admin-id');

        if ($adminId === null || $adminId === '' || ! ctype_digit((string) $adminId)) {
            $this->error('--admin-id is required. Pass the user id of the admin running this clear.');

            return null;
        }

        $admin = User::query()->find((int) $adminId);

        if (! $admin || $admin->role !== 'admin') {
            $this->error('--admin-id must be an admin account.');

            return null;
        }

        return $admin;
    }
}
