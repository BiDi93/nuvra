<?php

namespace App\Console\Commands;

use App\Contracts\SmsSender;
use App\Models\User;
use App\Support\PlayerContact;
use App\Support\WeakPassword;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class AuditPlayerContacts extends Command
{
    protected $signature = 'players:contact-audit';

    protected $description = 'Print counts of player contact channels and shared-password use. Does not print personal data or change accounts.';

    public function handle(SmsSender $sms): int
    {
        $shared = (string) config('nuvra.shared_player_password');

        $players = 0;
        $placeholderEmails = 0;
        $usableContactEmails = 0;
        $usablePhones = 0;
        $noPhone = 0;
        $invalidPhones = 0;
        $phonesWithLetters = 0;
        $malformedEmails = 0;
        $noChannel = 0;
        $onDefault = 0;
        $onWeak = 0;

        User::query()
            ->where('role', 'player')
            ->orderBy('id')
            ->chunkById(100, function ($rows) use (
                $shared,
                &$players,
                &$placeholderEmails,
                &$usableContactEmails,
                &$usablePhones,
                &$noPhone,
                &$invalidPhones,
                &$phonesWithLetters,
                &$malformedEmails,
                &$noChannel,
                &$onDefault,
                &$onWeak,
            ) {
                foreach ($rows as $player) {
                    $players++;

                    if (PlayerContact::isPlaceholderEmail($player->email)) {
                        $placeholderEmails++;
                    }

                    $loginEmail = strtolower(trim((string) $player->email));
                    if ($loginEmail !== '' && ! filter_var($loginEmail, FILTER_VALIDATE_EMAIL)) {
                        $malformedEmails++;
                    }

                    $email = PlayerContact::canReceiveEmail($player);
                    $phone = PlayerContact::canReceiveSms($player);
                    $rawPhone = trim((string) $player->phone);

                    if ($email) {
                        $usableContactEmails++;
                    }

                    if ($rawPhone === '') {
                        $noPhone++;
                    } elseif (! $phone) {
                        $invalidPhones++;
                    } else {
                        $usablePhones++;
                    }

                    if ($rawPhone !== '' && preg_match('/[A-Za-z]/', $rawPhone)) {
                        $phonesWithLetters++;
                    }

                    if (! $email && ! $phone) {
                        $noChannel++;
                    }

                    if (Hash::check($shared, $player->password)) {
                        $onDefault++;
                    }

                    if (WeakPassword::matchesStored($player)) {
                        $onWeak++;
                    }
                }
            });

        $adminsOnDefault = 0;
        $adminsOnWeak = 0;
        $admins = 0;

        User::query()->where('role', 'admin')->orderBy('id')->each(function (User $admin) use ($shared, &$admins, &$adminsOnDefault, &$adminsOnWeak) {
            $admins++;
            if (Hash::check($shared, $admin->password)) {
                $adminsOnDefault++;
            }
            if (WeakPassword::matchesStored($admin)) {
                $adminsOnWeak++;
            }
        });

        $this->line('Player accounts: '.$players);
        $this->line('Login emails that are @vellarleague.com placeholders: '.$placeholderEmails);
        $this->line('Players with a usable recovery email: '.$usableContactEmails);
        $this->line('Players with a usable phone: '.$usablePhones);
        $this->line('Players with no phone: '.$noPhone);
        $this->line('Players with a phone that is the wrong length: '.$invalidPhones);
        $this->line('Players whose phone contains letters: '.$phonesWithLetters);
        $this->line('Players with a malformed login email: '.$malformedEmails);
        $this->line('Players with neither a recovery email nor a usable phone: '.$noChannel);
        $this->line('Players still on the shared default password: '.$onDefault);
        $this->line('Players on a known weak password: '.$onWeak);
        $this->line('Admin accounts: '.$admins);
        $this->line('Admin accounts still on the shared default password: '.$adminsOnDefault);
        $this->line('Admin accounts on a known weak password: '.$adminsOnWeak);
        $this->line('SMS driver: '.($sms->enabled() ? 'enabled' : 'not configured'));

        return self::SUCCESS;
    }
}
