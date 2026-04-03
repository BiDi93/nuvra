<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CommunitySeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Users ──────────────────────────────────────────────────────────
        $adminId = DB::table('community_users')->insertGetId([
            'name'       => 'Nuvra Admin',
            'email'      => 'admin@nuvracommunity.com',
            'password'   => Hash::make('password123'),
            'role'       => 'admin',
            'phone'      => '+60 12-111 0000',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $player1 = DB::table('community_users')->insertGetId([
            'name'       => 'Haziq Amirul',
            'email'      => 'haziq@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'player',
            'phone'      => '+60 12-222 1111',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $player2 = DB::table('community_users')->insertGetId([
            'name'       => 'Danial Razif',
            'email'      => 'danial@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'player',
            'phone'      => '+60 12-333 2222',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $player3 = DB::table('community_users')->insertGetId([
            'name'       => 'Syafiq Nizam',
            'email'      => 'syafiq@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'player',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── 2. Games ──────────────────────────────────────────────────────────
        $game1 = DB::table('community_games')->insertGetId([
            'title'              => 'Midnight Futsal — Cheras',
            'description'        => 'Friendly pickup game. Wear sports shoes. Bring your own water.',
            'venue'              => 'Cheras Futsal Arena, Jalan Cheras, KL',
            'game_date'          => now()->addDays(2)->setTime(21, 0),
            'team_a_name'        => 'Team Hijau',
            'team_b_name'        => 'Team Merah',
            'max_slots_per_team' => 20,
            'status'             => 'open',
            'created_by'         => $adminId,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $game2 = DB::table('community_games')->insertGetId([
            'title'              => 'Weekend Turf Battle — Desa Park',
            'description'        => 'Saturday morning game. All skill levels welcome!',
            'venue'              => 'Desa Park City Turf, Kepong',
            'game_date'          => now()->addDays(5)->setTime(8, 0),
            'team_a_name'        => 'Alpha FC',
            'team_b_name'        => 'Bravo FC',
            'max_slots_per_team' => 20,
            'status'             => 'open',
            'created_by'         => $adminId,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $game3 = DB::table('community_games')->insertGetId([
            'title'              => 'Sunway Futsal Meetup',
            'description'        => 'Fast-paced 5-a-side. Come ready to run!',
            'venue'              => 'Sunway Futsal Centre, Petaling Jaya',
            'game_date'          => now()->addDays(7)->setTime(20, 0),
            'team_a_name'        => 'Team A',
            'team_b_name'        => 'Team B',
            'max_slots_per_team' => 20,
            'status'             => 'open',
            'created_by'         => $adminId,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        // ── 3. Some existing bookings to show slot usage ───────────────────────
        // Game 1: haziq & danial already joined
        DB::table('community_bookings')->insert([
            ['game_id' => $game1, 'community_user_id' => $player1, 'team_side' => 'team_a', 'status' => 'confirmed', 'created_at' => now(), 'updated_at' => now()],
            ['game_id' => $game1, 'community_user_id' => $player2, 'team_side' => 'team_b', 'status' => 'confirmed', 'created_at' => now(), 'updated_at' => now()],
            ['game_id' => $game2, 'community_user_id' => $player3, 'team_side' => 'team_a', 'status' => 'confirmed', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── 4. Announcements ──────────────────────────────────────────────────
        DB::table('community_announcements')->insert([
            [
                'title'      => '🎉 Welcome to Nuvra Community!',
                'body'       => "We are officially launching Nuvra Community — a hub for all football lovers in Malaysia who just want to play, connect, and have fun.\n\nNo club required. Just show up, pick a side, and enjoy the beautiful game. New games will be posted every week — stay tuned!",
                'created_by' => $adminId,
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
            [
                'title'      => '📋 House Rules — Please Read',
                'body'       => "A few simple rules to keep it fun for everyone:\n\n1. Book your slot before the game — walk-ins may not be accommodated.\n2. Cancel your slot if you can't make it so others can take your place.\n3. Respect all players regardless of skill level.\n4. Bring your own boots and water.\n\nSee you on the pitch! ⚽",
                'created_by' => $adminId,
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(3),
            ],
        ]);

        $this->command->info('✅ Community seeder done!');
        $this->command->table(
            ['Role', 'Name', 'Email', 'Password'],
            [
                ['👑 Admin',  'Nuvra Admin',   'admin@nuvracommunity.com', 'password123'],
                ['⚽ Player', 'Haziq Amirul',  'haziq@test.com',           'password123'],
                ['⚽ Player', 'Danial Razif',  'danial@test.com',          'password123'],
                ['⚽ Player', 'Syafiq Nizam',  'syafiq@test.com',          'password123'],
            ]
        );
    }
}
