<?php

namespace App\Console\Commands;

use App\Contracts\SmsSender;
use App\Models\User;
use App\Services\PlayerVerificationService;
use App\Support\PlayerLocator;
use Illuminate\Console\Command;

class IssuePlayerActivationCode extends Command
{
    protected $signature = 'players:activation-code {vellar_id : Numeric Vellar ID, for example 82}';

    protected $description = 'Print a one-time activation code for one player. Does not send email or SMS.';

    public function handle(PlayerVerificationService $verification): int
    {
        $player = PlayerLocator::find((string) $this->argument('vellar_id'));

        if (! $player || $player->role !== 'player') {
            $this->error('No player account matches that ID.');

            return self::FAILURE;
        }

        $issued = $verification->issueAdminCode($player);

        $this->line('Activation code: '.$issued['code']);
        $this->line('Expires: '.$issued['expires_at']->toDateTimeString());
        $this->line('Give this code to the player in person. It works once with their Vellar ID on the set-password form.');
        $this->line('This command did not send email or SMS.');

        return self::SUCCESS;
    }
}
