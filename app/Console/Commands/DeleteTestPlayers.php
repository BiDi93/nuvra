<?php

namespace App\Console\Commands;

use App\Support\TestPlayers;
use Illuminate\Console\Command;

class DeleteTestPlayers extends Command
{
    protected $signature = 'nuvra:delete-test-players';

    protected $description = 'Delete only accounts flagged as test players. Does not run on deploy and sends nothing.';

    public function handle(TestPlayers $players): int
    {
        $deleted = $players->deleteFlagged(null, 'qa_cli');

        if ($deleted === 0) {
            $this->info('No flagged test players. Nothing was deleted.');

            return self::SUCCESS;
        }

        $this->info('Deleted '.$deleted.' flagged test player(s). No other accounts were changed. Nothing was sent.');

        return self::SUCCESS;
    }
}
