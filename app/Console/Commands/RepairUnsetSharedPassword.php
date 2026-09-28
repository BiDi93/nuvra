<?php

namespace App\Console\Commands;

use App\Models\ContactEmailChange;
use App\Models\User;
use App\Support\SharedPassword;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class RepairUnsetSharedPassword extends Command
{
    protected $signature = 'players:repair-unset-shared-password
        {--force : Apply the reset. Without this flag the command only prints counts.}
        {--before= : Required UTC time, Y-m-d H:i:s. Recovery-email changes recorded after this time are kept. The command refuses to run if this is omitted.}';

    protected $description = 'Reset stale shared-password flags and clear player-set recovery emails saved while NUVRA_SHARED_DEFAULT_PASSWORD was unset. --before is a required UTC time. Prints counts only unless --force is passed.';

    public function handle(): int
    {
        $shared = SharedPassword::configuredValue();

        if ($shared === null) {
            $this->error('NUVRA_SHARED_DEFAULT_PASSWORD is unset. Set it in the server .env, run php artisan config:cache, then run this command again. Nothing was changed.');

            return self::FAILURE;
        }

        $before = $this->windowEnd();

        if ($before === false) {
            return self::FAILURE;
        }

        $onDefault = 0;
        $resetIds = [];

        User::query()
            ->where('role', 'player')
            ->orderBy('id')
            ->chunkById(100, function ($players) use ($shared, &$onDefault, &$resetIds) {
                foreach ($players as $player) {
                    if (! $this->stillOnSharedPassword($player, $shared)) {
                        continue;
                    }

                    $onDefault++;

                    if ($player->sharedPasswordState() !== null || SharedPassword::checkIsVerified($player)) {
                        $resetIds[] = $player->id;
                    }
                }
            });

        $this->line('Players still on the shared default password: '.$onDefault);

        if ($onDefault === 0) {
            $this->error('That count is 0. The value is wrong, or it is not loaded. Stop and fix it before continuing. Nothing was changed.');

            return self::FAILURE;
        }

        $clearIds = $this->emailsToClear($before);

        $this->line('Shared-password flags to reset: '.count($resetIds));
        $this->line('Recovery emails to clear: '.count($clearIds));

        $this->line('Recovery-email changes after '.$before->utc()->format('Y-m-d H:i:s').' UTC are kept.');

        if (! $this->option('force')) {
            $this->info('Counts only. No accounts were changed. Re-run with --force to apply. This is only needed if an earlier head of #23 before 69690da was deployed to UAT, or the post-deploy contact-audit showed 0 or not checked.');

            return self::SUCCESS;
        }

        $reset = 0;

        if ($resetIds !== []) {
            User::query()
                ->whereIn('id', $resetIds)
                ->orderBy('id')
                ->chunkById(100, function ($players) use (&$reset) {
                    foreach ($players as $player) {
                        $player->forceFill([
                            'password_is_shared' => null,
                            'password_is_shared_verified' => null,
                        ])->save();
                        $reset++;
                    }
                });
        }

        $cleared = 0;

        if ($clearIds !== []) {
            User::query()
                ->whereIn('id', $clearIds)
                ->orderBy('id')
                ->chunkById(100, function ($players) use (&$cleared) {
                    foreach ($players as $player) {
                        $player->forceFill([
                            'contact_email' => null,
                            'contact_email_source' => null,
                        ])->save();
                        $cleared++;
                    }
                });
        }

        $this->info('Reset '.$reset.' shared-password flag(s).');
        $this->info('Cleared '.$cleared.' recovery email(s). No addresses were printed.');
        $this->line('Run php artisan players:contact-audit and confirm the shared-password count is not 0.');

        return self::SUCCESS;
    }

    /**
     * Required UTC cutoff. False means the option was missing or not a date.
     */
    private function windowEnd(): Carbon|false
    {
        $raw = $this->option('before');

        if (! is_string($raw) || trim($raw) === '') {
            $this->error('--before is required. Pass a UTC time as Y-m-d H:i:s. Nothing was changed.');

            return false;
        }

        try {
            return Carbon::parse(trim($raw), 'UTC')->utc();
        } catch (\Throwable) {
            $this->error('--before must be a UTC time as Y-m-d H:i:s. Nothing was changed.');

            return false;
        }
    }

    private function stillOnSharedPassword(User $player, string $shared): bool
    {
        $hash = $player->password;

        if (! is_string($hash) || ! Hash::isHashed($hash)) {
            return false;
        }

        return Hash::check($shared, $hash);
    }

    /**
     * @return list<int>
     */
    private function emailsToClear(Carbon $before): array
    {
        $playerIds = ContactEmailChange::query()
            ->select('player_id')
            ->distinct()
            ->where('created_at', '<=', $before->utc()->format('Y-m-d H:i:s'))
            ->pluck('player_id')
            ->all();

        if ($playerIds === []) {
            return [];
        }

        return User::query()
            ->where('role', 'player')
            ->whereIn('id', $playerIds)
            ->where('contact_email_source', 'player')
            ->whereNotNull('contact_email')
            ->where('contact_email', '!=', '')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
