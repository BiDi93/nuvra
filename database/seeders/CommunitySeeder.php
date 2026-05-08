<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\CommunityUser;

class CommunitySeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Create/Update Unified Users ──────────────────────────────────
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@nuvracommunity.com'],
            [
                'name'     => 'Nuvra Admin',
                'password' => Hash::make('password123'),
                'role'     => 'community_admin',
            ]
        );

        $playersData = [
            ['name' => 'Haziq Amirul', 'email' => 'haziq@test.com'],
            ['name' => 'Danial Razif', 'email' => 'danial@test.com'],
            ['name' => 'Muaz Zain',    'email' => 'muaz@test.com'],
            ['name' => 'Amirul Afif',  'email' => 'amirul@test.com'],
            ['name' => 'Zulhelmi',     'email' => 'zul@test.com'],
            ['name' => 'Syafiq',       'email' => 'syafiq@test.com'],
        ];

        $playerUsers = [];
        foreach ($playersData as $p) {
            $playerUsers[] = User::updateOrCreate(
                ['email' => $p['email']],
                [
                    'name'     => $p['name'],
                    'password' => Hash::make('password123'),
                    'role'     => 'community_player',
                ]
            );
        }

        // ── 2. Link/Update Community Profiles ───────────────────────────────
        $adminProfile = [
            'email'   => $adminUser->email,
            'user_id' => $adminUser->id,
            'role'    => 'admin',
            'name'    => $adminUser->name,
            'phone'   => '+60 12-111 0000'
        ];

        $communityUserIds = [];

        // Seed Admin Profile
        DB::table('community_users')->updateOrInsert(
            ['email' => $adminProfile['email']],
            array_merge($adminProfile, [
                'password'   => Hash::make('password123'),
                'updated_at' => now(),
                'created_at' => now(),
            ])
        );
        $communityUserIds[$adminProfile['email']] = DB::table('community_users')->where('email', $adminProfile['email'])->value('id');

        // Seed Player Profiles
        foreach ($playerUsers as $u) {
            DB::table('community_users')->updateOrInsert(
                ['email' => $u->email],
                [
                    'user_id'    => $u->id,
                    'name'       => $u->name,
                    'email'      => $u->email,
                    'role'       => 'player',
                    'phone'      => '+60 1' . rand(2,9) . '-' . rand(100,999) . ' ' . rand(1000,9999),
                    'password'   => Hash::make('password123'),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            $communityUserIds[$u->email] = DB::table('community_users')->where('email', $u->email)->value('id');
        }

        // ── 3. Games ──────────────────────────────────────────────────────────
        $games = [
            [
                'title'              => 'Midnight Futsal — Cheras',
                'description'        => 'Friendly pickup game. Wear sports shoes. Bring your own water.',
                'venue'              => 'Cheras Futsal Arena, Jalan Cheras, KL',
                'game_date'          => now()->addDays(2)->setTime(21, 0),
                'team_a_name'        => 'Team Hijau',
                'team_b_name'        => 'Team Merah',
                'max_slots_per_team' => 10,
                'price_per_player'   => 0.00,
                'status'             => 'open',
            ],
            [
                'title'              => 'Vellar League Weekly Pickup',
                'description'        => 'High intensity 7-a-side football. Pitch fee included.',
                'venue'              => 'EV Arena Shah Alam',
                'game_date'          => now()->addDays(5)->setTime(20, 0),
                'team_a_name'        => 'Blues',
                'team_b_name'        => 'Reds',
                'max_slots_per_team' => 7,
                'price_per_player'   => 15.00,
                'status'             => 'open',
            ],
            [
                'title'              => 'Weekend Social Football',
                'description'        => 'Beginners welcome! 11-a-side grass pitch.',
                'venue'              => 'Rhino Arena, Cyberjaya',
                'game_date'          => now()->addDays(1)->setTime(17, 30),
                'team_a_name'        => 'Tigers',
                'team_b_name'        => 'Lions',
                'max_slots_per_team' => 11,
                'price_per_player'   => 20.00,
                'status'             => 'full',
            ],
        ];

        foreach ($games as $g) {
            DB::table('community_games')->updateOrInsert(
                ['title' => $g['title']],
                array_merge($g, [
                    'created_by' => $communityUserIds['admin@nuvracommunity.com'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        $game1Id = DB::table('community_games')->where('title', 'Midnight Futsal — Cheras')->value('id');
        $game2Id = DB::table('community_games')->where('title', 'Vellar League Weekly Pickup')->value('id');
        $game3Id = DB::table('community_games')->where('title', 'Weekend Social Football')->value('id');

        // ── 4. Bookings ───────────────────────────────────────────────────────
        
        // Game 1 (Free)
        DB::table('community_bookings')->updateOrInsert(
            ['game_id' => $game1Id, 'community_user_id' => $communityUserIds['haziq@test.com']],
            ['team_side' => 'team_a', 'status' => 'confirmed', 'created_at' => now(), 'updated_at' => now()]
        );
        DB::table('community_bookings')->updateOrInsert(
            ['game_id' => $game1Id, 'community_user_id' => $communityUserIds['danial@test.com']],
            ['team_side' => 'team_b', 'status' => 'confirmed', 'created_at' => now(), 'updated_at' => now()]
        );

        // Game 2 (Paid)
        DB::table('community_bookings')->updateOrInsert(
            ['game_id' => $game2Id, 'community_user_id' => $communityUserIds['muaz@test.com']],
            [
                'team_side'    => 'team_a', 
                'status'       => 'payment_submitted', 
                'receipt_path' => 'receipts/dummy_receipt.jpg',
                'created_at'   => now(), 
                'updated_at'   => now()
            ]
        );
        DB::table('community_bookings')->updateOrInsert(
            ['game_id' => $game2Id, 'community_user_id' => $communityUserIds['amirul@test.com']],
            [
                'team_side'    => 'team_a', 
                'status'       => 'confirmed', 
                'receipt_path' => 'receipts/dummy_receipt_confirmed.jpg',
                'created_at'   => now(), 
                'updated_at'   => now()
            ]
        );

        // ── 5. Announcements ──────────────────────────────────────────────────
        DB::table('community_announcements')->updateOrInsert(
            ['title' => 'Welcome to Nuvra Community!'],
            [
                'body'       => 'We are excited to launch our new pickup game portal. Stay tuned for more games!',
                'created_by' => $communityUserIds['admin@nuvracommunity.com'],
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        DB::table('community_announcements')->updateOrInsert(
            ['title' => 'Pitch Maintenance Notice'],
            [
                'body'       => 'Please be informed that Cheras Futsal Arena will be under maintenance from May 1st to May 5th.',
                'created_by' => $communityUserIds['admin@nuvracommunity.com'],
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $this->command->info('✅ Community seeder finished with rich dummy data!');
    }
}
