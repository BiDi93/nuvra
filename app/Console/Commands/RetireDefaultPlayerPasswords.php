<?php

namespace App\Console\Commands;

use App\Contracts\SmsSender;
use App\Models\User;
use App\Support\PlayerContact;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RetireDefaultPlayerPasswords extends Command
{
    protected $signature = 'players:retire-default-passwords
        {--force : Replace shared default passwords. Without this flag the command only prints counts.}
        {--allow-undeliverable : Required when any matched player cannot receive email or SMS. Those players will need an admin activation code.}';

    protected $description = 'Invalidate the shared default player password. Does not email or text anyone. Dry-run unless --force is passed.';

    public function handle(SmsSender $sms): int
    {
        $shared = (string) config('nuvra.shared_player_password');
        $smsReady = $sms->enabled();
        $apply = (bool) $this->option('force');

        $scanned = 0;
        $onDefault = 0;
        $alreadyUnique = 0;
        $withEmail = 0;
        $withPhoneOnly = 0;
        $withNeither = 0;
        $matchedIds = [];

        User::query()
            ->where('role', 'player')
            ->orderBy('id')
            ->chunkById(100, function ($players) use (
                $shared,
                $smsReady,
                &$scanned,
                &$onDefault,
                &$alreadyUnique,
                &$withEmail,
                &$withPhoneOnly,
                &$withNeither,
                &$matchedIds,
            ) {
                foreach ($players as $player) {
                    $scanned++;

                    if (! Hash::check($shared, $player->password)) {
                        $alreadyUnique++;

                        continue;
                    }

                    $onDefault++;
                    $matchedIds[] = $player->id;

                    if (PlayerContact::canReceiveEmail($player)) {
                        $withEmail++;
                    } elseif (PlayerContact::canReceiveSms($player) && $smsReady) {
                        $withPhoneOnly++;
                    } else {
                        $withNeither++;
                    }
                }
            });

        $this->line('Player accounts scanned: '.$scanned);
        $this->line('Still on the shared default: '.$onDefault);
        $this->line('Already using a unique password: '.$alreadyUnique);
        $this->line('Default password and a usable recovery email: '.$withEmail);
        $this->line('Default password and SMS available: '.$withPhoneOnly);
        $this->line('Default password and no delivery channel: '.$withNeither);
        $this->line('SMS driver: '.($smsReady ? 'enabled' : 'not configured'));

        if (! $apply) {
            $this->info('Dry run only. No passwords were changed and no messages were sent.');
            $this->line('To apply after a delivery plan is ready: php artisan players:retire-default-passwords --force --allow-undeliverable');

            return self::SUCCESS;
        }

        if ($withNeither > 0 && ! $this->option('allow-undeliverable')) {
            $this->error('Refused to change passwords. '.$withNeither.' player(s) on the shared default have no way to receive a reset message.');
            $this->line('Issue activation codes with players:activation-code, or configure SMS, then re-run with --force --allow-undeliverable.');
            $this->line('No passwords were changed.');

            return self::FAILURE;
        }

        $updated = 0;

        foreach (array_chunk($matchedIds, 100) as $ids) {
            $players = User::query()->whereIn('id', $ids)->get();

            foreach ($players as $player) {
                if ($player->role !== 'player' || ! Hash::check($shared, $player->password)) {
                    continue;
                }

                $player->forceFill([
                    'password' => Str::random(64),
                    'password_reset_required' => true,
                    'remember_token' => Str::random(60),
                ])->save();

                $player->tokens()->delete();
                $updated++;
            }
        }

        $this->info('Updated '.$updated.' player account(s). No email or SMS was sent.');
        $this->line('Players on the shared default can no longer sign in with it. They need a verification link, an SMS code, or an admin activation code.');

        return self::SUCCESS;
    }
}
