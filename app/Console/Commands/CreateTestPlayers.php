<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\PlayerContact;
use App\Support\SharedPassword;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreateTestPlayers extends Command
{
    protected $signature = 'nuvra:create-test-players
        {contacts* : Two or three email and phone pairs, for example qa1@example.com 60111111111 qa2@example.com 60122222222}';

    protected $description = 'Create two or three flagged test players. Does not run on deploy and sends nothing.';

    public function handle(): int
    {
        $contacts = $this->argument('contacts');

        if (! is_array($contacts) || count($contacts) < 4 || count($contacts) > 6 || count($contacts) % 2 !== 0) {
            $this->error('Pass two or three pairs: nuvra:create-test-players qa1@example.com 60111111111 qa2@example.com 60122222222');

            return self::FAILURE;
        }

        $pairs = array_chunk($contacts, 2);
        $rows = [];

        foreach ($pairs as $index => [$email, $phone]) {
            $usableEmail = PlayerContact::usableEmail($email);
            $usablePhone = PlayerContact::usablePhone($phone);

            if (! $usableEmail || ! $usablePhone) {
                $this->error('Pair '.($index + 1).' needs a real email and a phone of 8 to 15 digits.');

                return self::FAILURE;
            }

            $number = 900001 + $index;
            $login = 'vellar'.$number.'@vellarleague.com';
            $existing = User::where('email', $login)->orWhere('contact_email', $usableEmail)->first();

            if ($existing && ! $existing->is_test_account) {
                $this->error('Pair '.($index + 1).' collides with an account that is not a test player. Nothing was created.');

                return self::FAILURE;
            }

            $rows[] = [
                'existing' => $existing,
                'number' => $number,
                'login' => $login,
                'email' => $usableEmail,
                'phone' => $usablePhone,
            ];
        }

        DB::transaction(function () use ($rows) {
            foreach ($rows as $row) {
                $player = $row['existing'] ?? new User;
                $player->forceFill([
                    'name' => 'NUVRA TEST PLAYER '.$row['number'],
                    'email' => $row['login'],
                    'password' => SharedPassword::value(),
                    'role' => 'player',
                    'status' => 'active',
                    'vellar_id' => 'VELLAR '.$row['number'],
                    'phone' => $row['phone'],
                    'contact_email' => $row['email'],
                    'is_test_account' => true,
                    'password_is_shared' => true,
                    'password_reset_required' => false,
                ])->save();
            }
        });

        $this->info('Created '.count($rows).' flagged test player(s). No email or SMS was sent.');
        $this->line('Vellar IDs: '.implode(', ', array_column($rows, 'number')));
        $this->line('While NUVRA_RETIRE_SHARED_PASSWORDS is false they can sign in with the shared default, then complete a verified reset.');
        $this->line('Remove them later with: php artisan nuvra:delete-test-players');

        return self::SUCCESS;
    }
}
