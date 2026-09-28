<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class DeleteTestPlayers extends Command
{
    protected $signature = 'nuvra:delete-test-players';

    protected $description = 'Delete only accounts flagged as test players. Does not run on deploy and sends nothing.';

    public function handle(): int
    {
        $players = User::query()->where('is_test_account', true)->orderBy('id')->get();

        if ($players->isEmpty()) {
            $this->info('No flagged test players. Nothing was deleted.');

            return self::SUCCESS;
        }

        $deleted = 0;

        foreach ($players as $player) {
            if (! $player->is_test_account) {
                continue;
            }

            $player->tokens()->delete();
            $player->notifications()->delete();
            $player->delete();
            $deleted++;
        }

        $this->info('Deleted '.$deleted.' flagged test player(s). No other accounts were changed. Nothing was sent.');

        return self::SUCCESS;
    }
}
