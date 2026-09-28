<?php

namespace App\Console\Commands;

use App\Contracts\SmsSender;
use App\Models\User;
use App\Services\PlayerVerificationService;
use App\Support\PlayerLocator;
use Illuminate\Console\Command;

class IssuePlayerActivationCode extends Command
{
    protected $signature = 'players:activation-code
        {vellar_id : Numeric Vellar ID, for example 123}
        {--admin-id= : Required user id of the admin who confirmed the player}';

    protected $description = 'Print a one-time activation code for one player. Does not send email or SMS.';

    public function handle(PlayerVerificationService $verification): int
    {
        $player = PlayerLocator::find((string) $this->argument('vellar_id'));

        if (! $player || $player->role !== 'player') {
            $this->error('No player account matches that ID.');

            return self::FAILURE;
        }

        $adminId = $this->option('admin-id');

        if ($adminId === null || $adminId === '' || ! ctype_digit((string) $adminId)) {
            $this->error('--admin-id is required. Pass the user id of the admin who confirmed this player.');

            return self::FAILURE;
        }

        $admin = User::query()->find((int) $adminId);

        if (! $admin || $admin->role !== 'admin') {
            $this->error('--admin-id must be an admin account.');

            return self::FAILURE;
        }

        $issued = $verification->issueAdminCode($player, $admin->id, 'console');

        if (! $issued) {
            $this->error('A code was just issued for this player. Wait and try again.');
            $this->line('No new code was created, and nothing was sent.');

            return self::FAILURE;
        }

        $this->line('Activation code: '.$issued['code']);
        $this->line('Expires: '.$issued['expires_at']->toDateTimeString());
        $this->line('Give this code to the player in person. It works once with their Vellar ID on the set-password form.');
        $this->line('This command did not send email or SMS.');

        return self::SUCCESS;
    }
}
