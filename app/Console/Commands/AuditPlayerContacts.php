<?php

namespace App\Console\Commands;

use App\Contracts\SmsSender;
use App\Models\User;
use App\Support\PlayerContact;
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
        $noChannel = 0;
        $onDefault = 0;

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
                &$noChannel,
                &$onDefault,
            ) {
                foreach ($rows as $player) {
                    $players++;

                    if (PlayerContact::isPlaceholderEmail($player->email)) {
                        $placeholderEmails++;
                    }

                    $email = PlayerContact::canReceiveEmail($player);
                    $phone = PlayerContact::canReceiveSms($player);

                    if ($email) {
                        $usableContactEmails++;
                    }

                    if ($phone) {
                        $usablePhones++;
                    } else {
                        $noPhone++;
                    }

                    if (! $email && ! $phone) {
                        $noChannel++;
                    }

                    if (Hash::check($shared, $player->password)) {
                        $onDefault++;
                    }
                }
            });

        $adminsOnDefault = 0;
        $admins = 0;

        User::query()->where('role', 'admin')->orderBy('id')->each(function (User $admin) use ($shared, &$admins, &$adminsOnDefault) {
            $admins++;
            if (Hash::check($shared, $admin->password)) {
                $adminsOnDefault++;
            }
        });

        $this->line('Player accounts: '.$players);
        $this->line('Login emails that are @vellarleague.com placeholders: '.$placeholderEmails);
        $this->line('Players with a usable recovery email: '.$usableContactEmails);
        $this->line('Players with a usable phone: '.$usablePhones);
        $this->line('Players with no usable phone: '.$noPhone);
        $this->line('Players with neither a recovery email nor a phone: '.$noChannel);
        $this->line('Players still on the shared default password: '.$onDefault);
        $this->line('Admin accounts: '.$admins);
        $this->line('Admin accounts still on the shared default password: '.$adminsOnDefault);
        $this->line('SMS driver: '.($sms->enabled() ? 'enabled' : 'not configured'));

        return self::SUCCESS;
    }
}
