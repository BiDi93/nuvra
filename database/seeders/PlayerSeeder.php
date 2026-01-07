<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PlayerSeeder extends Seeder
{
    public function run(): void
    {
        // Default Password for everyone
        $password = Hash::make('password123');

        $players = [
            ['name' => 'Ali Hassan', 'pos' => 'Forward', 'num' => 9, 'foot' => 'right', 'h' => 178],
            ['name' => 'Muthu Kumar', 'pos' => 'Midfielder', 'num' => 8, 'foot' => 'right', 'h' => 172],
            ['name' => 'Chong Wei', 'pos' => 'Winger', 'num' => 7, 'foot' => 'left', 'h' => 168],
            ['name' => 'Sarah Johnson', 'pos' => 'Defender', 'num' => 4, 'foot' => 'right', 'h' => 175],
            ['name' => 'Michael Chen', 'pos' => 'Goalkeeper', 'num' => 1, 'foot' => 'right', 'h' => 188],
            ['name' => 'David Fernandez', 'pos' => 'Striker', 'num' => 10, 'foot' => 'both', 'h' => 180],
            ['name' => 'Rajesh Singh', 'pos' => 'Defender', 'num' => 5, 'foot' => 'right', 'h' => 182],
            ['name' => 'Tom Baker', 'pos' => 'Midfielder', 'num' => 6, 'foot' => 'left', 'h' => 176],
            ['name' => 'Ahmad Zaki', 'pos' => 'Winger', 'num' => 11, 'foot' => 'right', 'h' => 170],
            ['name' => 'Steve Rogers', 'pos' => 'Defender', 'num' => 3, 'foot' => 'right', 'h' => 185],
        ];

        foreach ($players as $index => $p) {
            $email = 'player' . ($index + 1) . '@nuvra.com';
            
            // 1. Create Player
            $playerId = DB::table('players')->insertGetId([
                'name' => $p['name'],
                'email' => $email,
                'password' => $password,
                'position' => $p['pos'],
                'jersey_number' => $p['num'],
                'strong_foot' => $p['foot'],
                'height_cm' => $p['h'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Generate Attributes based on position
            // (Defenders get better defense, Strikers get better shooting)
            $isAttacker = in_array($p['pos'], ['Forward', 'Striker', 'Winger']);
            $isDefender = in_array($p['pos'], ['Defender', 'Goalkeeper']);

            DB::table('attributes')->insert([
                'player_id' => $playerId,
                'pace' => rand(70, 95),
                'shooting' => $isAttacker ? rand(80, 99) : rand(40, 70),
                'passing' => rand(60, 90),
                'dribbling' => $isAttacker ? rand(75, 95) : rand(50, 75),
                'defending' => $isDefender ? rand(80, 95) : rand(30, 60),
                'physical' => rand(65, 90),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Add some dummy match history so graphs aren't empty
            for ($i = 1; $i <= 3; $i++) {
                DB::table('performances')->insert([
                    'player_id' => $playerId,
                    'match_date' => now()->subDays($i * 7),
                    'opponent_name' => 'Dummy FC ' . $i,
                    'minutes_played' => 90,
                    'goals' => $isAttacker ? rand(0, 2) : 0,
                    'assists' => rand(0, 1),
                    'rating' => rand(60, 95) / 10, // Generates 6.0 to 9.5
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}