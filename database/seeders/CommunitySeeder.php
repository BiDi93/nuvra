<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\FootballMatch;
use App\Models\Performance;
use App\Models\MatchPlayer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class CommunitySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Clear legacy data tables first
        DB::statement('DELETE FROM match_player');
        DB::statement('DELETE FROM performances');
        DB::statement('DELETE FROM matches');
        DB::statement('DELETE FROM users');

        // 2. Create a Club Owner (Organizer)
        $owner = User::create([
            'name' => 'Organizer Nuvra (Club Owner)',
            'email' => 'owner@nuvra.com',
            'password' => Hash::make('password'),
            'role' => 'club_owner',
            'qr_code_path' => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NuvraPayment'
        ]);

        // 3. Create Independent Community Players
        $playerIds = [];
        for ($i = 1; $i <= 10; $i++) {
            $player = User::create([
                'name' => "Player Community $i",
                'email' => "player$i@nuvra.com",
                'password' => Hash::make('password'),
                'role' => 'player',
            ]);
            $playerIds[] = $player->id;
        }

        // 4. Create a Community Match
        $match = FootballMatch::create([
            'club_owner_id' => $owner->id,
            'title' => 'Perlawanan Persahabatan Terbuka',
            'description' => 'Jom main bola malam Jumaat. Sesuai untuk semua level.',
            'venue' => 'Rhino Arena, Shah Alam',
            'match_date' => now()->addDays(2)->format('Y-m-d'),
            'match_time' => '21:00',
            'team_a_name' => 'Team Emerald',
            'team_b_name' => 'Team Komu',
            'price' => 15.00,
            'total_slots' => 22,
            'status' => 'open'
        ]);

        // 5. Join Players to the Match (Decoupled)
        foreach ($playerIds as $index => $userId) {
            MatchPlayer::create([
                'match_id' => $match->id,
                'user_id' => $userId,
                'status' => 'confirmed'
            ]);

            // Optional: Record some past stats for gamification view
            if ($index < 3) {
                Performance::create([
                    'user_id' => $userId,
                    'match_id' => $match->id,
                    'goals' => rand(1, 3),
                    'assists' => rand(0, 2),
                    'minutes_played' => 90,
                    'rating' => 8.5
                ]);
            }
        }

        echo "✅ Community model seeded successfully (Decoupled from Coach/Player models)\n";
    }
}
