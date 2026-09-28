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
        {contacts* : One to three contacts. An email starts a player. A phone after that email is optional. Example: you@example.com}';

    protected $description = 'Create one to three flagged test players from the contacts you pass. Does not run on deploy and sends nothing.';

    public function handle(): int
    {
        $contacts = $this->argument('contacts');
        $parsed = $this->parseContacts(is_array($contacts) ? $contacts : []);

        if ($parsed === null) {
            return self::FAILURE;
        }

        $rows = [];

        foreach ($parsed as $index => $contact) {
            $number = 900001 + $index;
            $login = 'vellar'.$number.'@vellarleague.com';
            $existing = User::where('email', $login)->orWhere('contact_email', $contact['email'])->first();

            if ($existing && ! $existing->is_test_account) {
                $this->error('Contact '.($index + 1).' collides with an account that is not a test player. Nothing was created.');

                return self::FAILURE;
            }

            $rows[] = [
                'existing' => $existing,
                'number' => $number,
                'login' => $login,
                'email' => $contact['email'],
                'phone' => $contact['phone'],
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

    /**
     * @param  list<string>  $contacts
     * @return list<array{email: string, phone: ?string}>|null
     */
    private function parseContacts(array $contacts): ?array
    {
        if (count($contacts) < 1) {
            $this->error('Pass one to three contacts. An email starts a player. A phone after it is optional. Example: nuvra:create-test-players you@example.com');

            return null;
        }

        $players = [];

        foreach ($contacts as $token) {
            $token = trim((string) $token);

            if (str_contains($token, '@')) {
                if (count($players) >= 3) {
                    $this->error('Create at most three test players at a time.');

                    return null;
                }

                $email = PlayerContact::usableEmail($token);

                if (! $email) {
                    $this->error('Each player needs an email that can receive mail. A @vellarleague.com address is a login key, not a recovery email.');

                    return null;
                }

                $players[] = ['email' => $email, 'phone' => null];

                continue;
            }

            $current = array_key_last($players);

            if ($current === null || $players[$current]['phone'] !== null) {
                $this->error('A phone number has to follow an email. Example: nuvra:create-test-players you@example.com');

                return null;
            }

            $phone = PlayerContact::usablePhone($token);

            if (! $phone) {
                $this->error('A phone, when you pass one, must be 8 to 15 digits. Leave it off for an email-only player.');

                return null;
            }

            $players[$current]['phone'] = $phone;
        }

        $emails = array_column($players, 'email');

        if (count($emails) !== count(array_unique($emails))) {
            $this->error('Each test player needs a different email. Nothing was created.');

            return null;
        }

        return $players;
    }
}
