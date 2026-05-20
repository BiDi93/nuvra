<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\FootballMatch;
use App\Models\Performance;
use App\Models\MatchPlayer;
use Illuminate\Support\Facades\Hash;

class CommunitySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create a Club Owner
        $owner = User::create([
            'name' => 'Abang Baller (Owner)',
            'email' => 'owner@nuvra.com',
            'password' => Hash::make('password'),
            'role' => 'club_owner',
            'qr_code_path' => 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DUMMY_PAYMENT_URL'
        ]);

        // 2. Create some Players
        $players = [];
        for ($i = 1; $i <= 5; $i++) {
            $players[] = User::create([
                'name' => "Player Community $i",
                'email' => "player$i@nuvra.com",
                'password' => Hash::make('password'),
                'role' => 'player',
            ]);
        }

        // 3. Create a Match
        $match = FootballMatch::create([
            'club_owner_id' => $owner->id,
            'title' => 'Friday Night Fever!',
            'description' => 'Friendly match for all levels. Bring your own water!',
            'team_a_name' => 'Emerald FC',
            'team_b_name' => 'Team Komu',
            'status' => 'open',
            'opponent_name' => 'Team Komu',
            'match_date' => now()->addDays(2)->format('Y-m-d'),
            'match_time' => '21:00',
            'venue' => 'Rhino Arena, Shah Alam',
            'price' => 15.00,
            'total_slots' => 22,
            'league_type' => 'Friendly',
            'category' => 'Open',
            'event_name' => 'Friday Night Pick-up'
        ]);

        // 4. Join Players to the Match
        foreach ($players as $player) {
            MatchPlayer::create([
                'match_id' => $match->id,
                'user_id' => $player->id,
                'status' => 'confirmed'
            ]);

            // Add dummy performance for a past game logic
            Performance::create([
                'user_id' => $player->id,
                'match_id' => $match->id,
                'goals' => rand(0, 2),
                'assists' => rand(0, 1),
                'minutes_played' => 90,
                'rating' => rand(6, 9),
            ]);
        }
    }
}
