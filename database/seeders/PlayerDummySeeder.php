<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\FootballMatch;
use App\Models\Performance;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PlayerDummySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create a dummy Owner
        $owner = User::updateOrCreate(
            ['email' => 'owner@nuvra.com'],
            [
                'name' => 'Nuvra Organizer',
                'password' => Hash::make('password'),
                'role' => 'club_owner',
                'club_name' => 'Nuvra Elite FC',
                'established_at' => '2024-01-01',
                'location' => 'Kuala Lumpur',
                'address' => 'Nuvra Sports Center, Bukit Jalil',
            ]
        );

        $venues = ['Arena MBSJ', 'KSL Futsal', 'Sportizza', 'Uptown Bangi', 'EV Arena'];
        $titles = [
            'Friendly Malam', 'Kampung Friendly', 'Liga Sekolah Invitational', 
            'Ajak Kawan FC vs Nuvra', 'Midnight Pickup Bangi', 'Social League Tier 2',
            'Futsal Santai Weekend', 'Inter-Company Friendly', 'Pro-Am Scrimmage'
        ];
        
        // 2. Create 20 Players
        for ($i = 1; $i <= 20; $i++) {
            $player = User::updateOrCreate(
                ['email' => "player{$i}@nuvra.com"],
                [
                    'name' => "Player " . $i,
                    'password' => Hash::make('password'),
                    'role' => 'player',
                    'phone' => '012345678' . str_pad($i, 2, '0', STR_PAD_LEFT),
                    'address' => 'Street ' . $i . ', Football Valley, KL',
                    'avatar' => "https://i.pravatar.cc/150?u=player{$i}@nuvra.com"
                ]
            );

            // 3. Create 5 PAST matches for history and graph
            for ($j = 1; $j <= 5; $j++) {
                $date = Carbon::now()->subWeeks($j);
                $match = FootballMatch::create([
                    'club_owner_id' => $owner->id,
                    'title' => $titles[array_rand($titles)],
                    'venue' => $venues[array_rand($venues)],
                    'match_date' => $date->toDateString(),
                    'match_time' => '21:00:00',
                    'price' => 20,
                    'total_slots' => 22,
                    'status' => 'completed',
                    'team_a_name' => 'Nuvra Blues',
                    'team_b_name' => 'Opponent Team'
                ]);

                DB::table('match_player')->insert([
                    'match_id' => $match->id,
                    'user_id' => $player->id,
                    'status' => 'confirmed',
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                Performance::create([
                    'user_id' => $player->id,
                    'match_id' => $match->id,
                    'goals' => rand(0, 3),
                    'assists' => rand(0, 2),
                    'rating' => rand(65, 95) / 10,
                    'minutes_played' => 60,
                ]);
            }

            // 4. Create 5 UPCOMING matches for the dashboard feed
            for ($k = 1; $k <= 5; $k++) {
                $date = Carbon::now()->addDays($k * 3);
                $match = FootballMatch::create([
                    'club_owner_id' => $owner->id,
                    'title' => $titles[array_rand($titles)],
                    'venue' => $venues[array_rand($venues)],
                    'match_date' => $date->toDateString(),
                    'match_time' => '20:00:00',
                    'price' => 25,
                    'total_slots' => 22,
                    'status' => 'open',
                    'team_a_name' => 'Tigers FC',
                    'team_b_name' => 'Lions United'
                ]);

                // We don't necessarily join all players to all upcoming matches
                if (rand(0,1)) {
                    DB::table('match_player')->insert([
                        'match_id' => $match->id,
                        'user_id' => $player->id,
                        'status' => 'confirmed',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('Successfully seeded balanced dummy data with realistic titles! ⚽');
    }
}
