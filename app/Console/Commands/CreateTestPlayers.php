<?php

namespace App\Console\Commands;

use App\Support\TestPlayers;
use Illuminate\Console\Command;
use RuntimeException;

class CreateTestPlayers extends Command
{
    protected $signature = 'nuvra:create-test-players
        {contacts* : One to three contacts. An email starts a player. A phone after that email is optional. Example: you@example.com}';

    protected $description = 'Create one to three flagged test players from the contacts you pass. Does not run on deploy and sends nothing.';

    public function handle(TestPlayers $players): int
    {
        try {
            $created = $players->create($this->argument('contacts'), null, 'qa_cli');
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $numbers = array_map(
            fn ($player) => preg_replace('/\D/', '', (string) $player->vellar_id),
            $created
        );

        $this->info('Created '.count($created).' flagged test player(s). No email or SMS was sent.');
        $this->line('Vellar IDs: '.implode(', ', $numbers));
        $this->line('While NUVRA_RETIRE_SHARED_PASSWORDS is false they can sign in with the shared default, then complete a verified reset.');
        $this->line('Remove them later with: php artisan nuvra:delete-test-players');

        return self::SUCCESS;
    }
}
