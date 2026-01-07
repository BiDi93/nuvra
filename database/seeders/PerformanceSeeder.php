<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PerformanceSeeder extends Seeder
{
    public function run(): void
    {
        // Give Player 1 (Ahmad) 3 matches
        DB::table('performances')->insert([
            [
                'player_id' => 1,
                'match_date' => '2025-12-01',
                'opponent_name' => 'Tigers FC',
                'goals' => 1,
                'assists' => 0,
                'minutes_played' => 90,
                'rating' => 7.5,
            ],
            [
                'player_id' => 1,
                'match_date' => '2025-12-08',
                'opponent_name' => 'Eagles United',
                'goals' => 2,
                'assists' => 1,
                'minutes_played' => 88,
                'rating' => 9.0, // Man of the match!
            ],
            [
                'player_id' => 1,
                'match_date' => '2025-12-15',
                'opponent_name' => 'Viper Academy',
                'goals' => 0,
                'assists' => 0,
                'minutes_played' => 45,
                'rating' => 6.0,
            ]
        ]);
    }
}