<?php

namespace App\Support;

use App\Models\PlayerCodeAudit;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TestPlayers
{
    /**
     * @param  list<string>  $contacts
     * @return list<User>
     */
    public function create(array $contacts, ?int $adminId, string $source): array
    {
        $password = SharedPassword::requireForWrite('creating a test player');
        $parsed = $this->parse($contacts);
        $rows = [];

        foreach ($parsed as $index => $contact) {
            $number = 900001 + $index;
            $login = 'vellar'.$number.'@vellarleague.com';
            $existing = User::where('email', $login)->orWhere('contact_email', $contact['email'])->first();

            if ($existing && ! $existing->is_test_account) {
                throw new RuntimeException('A contact matches an account that is not a test player. Nothing was created.');
            }

            $rows[] = [
                'existing' => $existing,
                'number' => $number,
                'login' => $login,
                'email' => $contact['email'],
                'phone' => $contact['phone'],
            ];
        }

        return DB::transaction(function () use ($rows, $adminId, $source, $password) {
            $created = [];

            foreach ($rows as $row) {
                $player = $row['existing'] ?? new User;
                $player->forceFill([
                    'name' => 'NUVRA TEST PLAYER '.$row['number'],
                    'email' => $row['login'],
                    'password' => $password,
                    'role' => 'player',
                    'status' => 'active',
                    'vellar_id' => 'VELLAR '.$row['number'],
                    'phone' => $row['phone'],
                    'contact_email' => $row['email'],
                    'is_test_account' => true,
                    'password_is_shared' => true,
                    'password_reset_required' => true,
                ])->save();

                PlayerCodeAudit::create([
                    'player_id' => $player->id,
                    'admin_id' => $adminId,
                    'source' => $source,
                    'detail' => 'created VELLAR '.$row['number'],
                    'issued_at' => now(),
                ]);

                $created[] = $player;
            }

            return $created;
        });
    }

    public function deleteFlagged(?int $adminId, string $source): int
    {
        $players = User::query()->where('is_test_account', true)->orderBy('id')->get();
        $deleted = 0;

        DB::transaction(function () use ($players, $adminId, $source, &$deleted) {
            foreach ($players as $player) {
                if (! $player->is_test_account) {
                    continue;
                }

                $number = preg_replace('/\D/', '', (string) $player->vellar_id);

                PlayerCodeAudit::create([
                    'player_id' => $player->id,
                    'admin_id' => $adminId,
                    'source' => $source,
                    'detail' => 'deleted VELLAR '.$number,
                    'issued_at' => now(),
                ]);

                $player->tokens()->delete();
                $player->notifications()->delete();
                $player->delete();
                $deleted++;
            }
        });

        return $deleted;
    }

    /**
     * @param  list<string>  $contacts
     * @return list<array{email: string, phone: ?string}>
     */
    public function parse(array $contacts): array
    {
        if (count($contacts) < 1) {
            throw new RuntimeException('Pass one to three contacts. An email starts a player. A phone after it is optional.');
        }

        $players = [];

        foreach ($contacts as $token) {
            $token = trim((string) $token);

            if (str_contains($token, '@')) {
                if (count($players) >= 3) {
                    throw new RuntimeException('Create at most three test players at a time.');
                }

                $email = PlayerContact::usableEmail($token);

                if (! $email) {
                    throw new RuntimeException('Each player needs an email that can receive mail.');
                }

                $players[] = ['email' => $email, 'phone' => null];

                continue;
            }

            $current = array_key_last($players);

            if ($current === null || $players[$current]['phone'] !== null) {
                throw new RuntimeException('A phone number has to follow an email.');
            }

            $phone = PlayerContact::usablePhone($token);

            if (! $phone) {
                throw new RuntimeException('A phone, when you pass one, must be 8 to 15 digits.');
            }

            $players[$current]['phone'] = $phone;
        }

        $emails = array_column($players, 'email');

        if (count($emails) !== count(array_unique($emails))) {
            throw new RuntimeException('Each test player needs a different email.');
        }

        return $players;
    }
}
