<?php

namespace App\Console\Commands;

use App\Contracts\SmsSender;
use App\Models\User;
use App\Support\PasswordConfiguration;
use App\Support\PlayerContact;
use App\Support\SharedPassword;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RetireDefaultPlayerPasswords extends Command
{
    protected $signature = 'players:retire-default-passwords
        {--force : Replace shared default passwords. Without this flag the command only prints counts.}
        {--allow-undeliverable : Required when any matched player cannot receive email or SMS. Those players will need an admin activation code.}
        {--only-with-route : Retire only players who have a real recovery email. Leave everyone else on the shared password.}';

    protected $description = 'Invalidate the shared default player password. Does not email or text anyone. Dry-run unless --force is passed.';

    public function handle(SmsSender $sms): int
    {
        $shared = SharedPassword::configuredValue();

        if ($shared === null) {
            PasswordConfiguration::report();
            $this->error('NUVRA_SHARED_DEFAULT_PASSWORD is unset. The command cannot tell which accounts use the shared password, so it will not run. Nothing was changed and no messages were sent.');

            if (SharedPassword::retirementEnabled()) {
                $this->line('NUVRA_RETIRE_SHARED_PASSWORDS is true, so this setup is invalid. Set the password variable in the server .env, then run php artisan config:cache.');
            }

            return self::FAILURE;
        }

        $smsReady = $sms->enabled();
        $apply = (bool) $this->option('force');

        $scanned = 0;
        $onDefault = 0;
        $alreadyUnique = 0;
        $withEmail = 0;
        $withPhoneOnly = 0;
        $withNeither = 0;
        $matchedIds = [];
        $withRouteIds = [];

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
                &$withRouteIds,
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
                        $withRouteIds[] = $player->id;
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

        $onlyWithRoute = (bool) $this->option('only-with-route');

        if ($onlyWithRoute && ! $apply) {
            $this->line('Would retire: '.count($withRouteIds));
            $this->line('Would leave on the shared password: '.($onDefault - count($withRouteIds)));
        }

        if (! $apply) {
            $this->info('Dry run only. No passwords were changed and no messages were sent.');

            if ($onlyWithRoute) {
                $this->line('A batch with --force --only-with-route does not require NUVRA_RETIRE_SHARED_PASSWORDS. Leave that flag off until the final retirement.');
            } else {
                $this->line('Turn on NUVRA_RETIRE_SHARED_PASSWORDS only after one test account has reset, then re-run with --force.');
            }

            return self::SUCCESS;
        }

        if (! $onlyWithRoute && ! SharedPassword::retirementEnabled()) {
            $this->error('Refused. NUVRA_RETIRE_SHARED_PASSWORDS is off.');
            $this->line('Finish a reset on one test account, set NUVRA_RETIRE_SHARED_PASSWORDS=true, reload config, then re-run.');
            $this->line('No passwords were changed and no messages were sent.');

            return self::FAILURE;
        }

        if ($withNeither > 0 && ! $this->option('allow-undeliverable') && ! $onlyWithRoute) {
            $this->error('Refused to change passwords. '.$withNeither.' player(s) on the shared default have no way to receive a reset message.');
            $this->line('Issue activation codes with players:activation-code, or configure SMS, then re-run with --force --allow-undeliverable.');
            $this->line('No passwords were changed.');

            return self::FAILURE;
        }

        $updated = 0;
        $idsToUpdate = $onlyWithRoute ? $withRouteIds : $matchedIds;

        foreach (array_chunk($idsToUpdate, 100) as $ids) {
            $players = User::query()->whereIn('id', $ids)->get();

            foreach ($players as $player) {
                if ($player->role !== 'player' || ! Hash::check($shared, $player->password)) {
                    continue;
                }

                if ($onlyWithRoute && ! PlayerContact::canReceiveEmail($player)) {
                    continue;
                }

                $player->forceFill([
                    'password' => Str::random(64),
                    'password_reset_required' => true,
                    'password_is_shared' => false,
                    'password_is_shared_verified' => null,
                    'remember_token' => Str::random(60),
                ])->save();

                $player->tokens()->delete();
                $updated++;
            }
        }

        $this->info('Updated '.$updated.' player account(s). No email or SMS was sent.');

        if ($onlyWithRoute) {
            $this->line('Retired: '.$updated);
            $this->line('Left on the shared password: '.($onDefault - $updated));
            $this->line('Retired players must set a new password. Players left on the shared password can still sign in with it. Leave NUVRA_RETIRE_SHARED_PASSWORDS off until the final retirement.');
        } else {
            $this->line('Players on the shared default can no longer sign in with it. They need a verification link, an SMS code, or an admin activation code.');
        }

        return self::SUCCESS;
    }
}
