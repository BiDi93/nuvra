<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CoachSeeder extends Seeder
{
    public function run(): void
    {
        // Create Coach 1 (The "Main" Coach)
        $coach1 = DB::table('coaches')->insertGetId([
            'name' => 'Coach Carter',
            'email' => 'coach1@nuvra.com',
            'password' => Hash::make('password123'),
            'team_name' => 'NUVRA Varsity',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // Create Coach 2 (The "Rival" Coach)
        $coach2 = DB::table('coaches')->insertGetId([
            'name' => 'Ted Lasso',
            'email' => 'coach2@nuvra.com',
            'password' => Hash::make('password123'),
            'team_name' => 'Richmond FC',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // Assign first 5 players to Coach 1
        DB::table('players')->whereBetween('id', [1, 5])->update(['coach_id' => $coach1]);

        // Assign next 5 players to Coach 2
        DB::table('players')->whereBetween('id', [6, 10])->update(['coach_id' => $coach2]);
    }
}