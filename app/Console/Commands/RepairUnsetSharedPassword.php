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
        {--before= : Keep recovery-email changes recorded after this time. Omit it to treat every recorded change as part of the unset window.}';

    protected $description = 'Reset stale shared-password flags and clear recovery emails saved while NUVRA_SHARED_DEFAULT_PASSWORD was unset. Prints counts only unless --force is passed.';

    public function handle(): int
    {
        $shared = SharedPassword::configuredValue();

        if ($shared === null) {
            $this->error('NUVRA_SHARED_DEFAULT_PASSWORD is unset. Set it in the server .env, run php artisan config:cache, then run this command again. Nothing was changed.');

            return self::FAILURE;
        }

        $before = $this->windowEnd();

        if ($before === false) {
            $this->error('The --before time is not a valid date. Nothing was changed.');

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

        if ($before === null) {
            $this->line('Every recorded recovery-email change is in the unset window.');
        } else {
            $this->line('Recovery-email changes after '.$before->format('Y-m-d H:i:s').' are kept.');
        }

        if (! $this->option('force')) {
            $this->info('Counts only. No accounts were changed. Re-run with --force to apply. Setting NUVRA_SHARED_DEFAULT_PASSWORD before deploy makes this command unnecessary.');

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
     * @return Carbon|null|false Null means the whole table. False means the option was invalid.
     */
    private function windowEnd(): Carbon|null|false
    {
        $raw = $this->option('before');

        if (! is_string($raw) || trim($raw) === '') {
            return null;
        }

        try {
            return Carbon::parse($raw);
        } catch (\Throwable) {
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
    private function emailsToClear(?Carbon $before): array
    {
        $audit = ContactEmailChange::query()->select('player_id')->distinct();

        if ($before !== null) {
            $audit->where('created_at', '<=', $before->format('Y-m-d H:i:s'));
        }

        $playerIds = $audit->pluck('player_id')->all();

        if ($playerIds === []) {
            return [];
        }

        return User::query()
            ->where('role', 'player')
            ->whereIn('id', $playerIds)
            ->whereNotNull('contact_email')
            ->where('contact_email', '!=', '')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
