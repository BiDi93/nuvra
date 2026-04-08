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

        $playerUser1 = User::updateOrCreate(
            ['email' => 'haziq@test.com'],
            [
                'name'     => 'Haziq Amirul',
                'password' => Hash::make('password123'),
                'role'     => 'community_player',
            ]
        );

        $playerUser2 = User::updateOrCreate(
            ['email' => 'danial@test.com'],
            [
                'name'     => 'Danial Razif',
                'password' => Hash::make('password123'),
                'role'     => 'community_player',
            ]
        );

        // ── 2. Link/Update Community Profiles ───────────────────────────────
        $profiles = [
            ['email' => $adminUser->email,   'user_id' => $adminUser->id,   'role' => 'admin',  'name' => $adminUser->name,   'phone' => '+60 12-111 0000'],
            ['email' => $playerUser1->email, 'user_id' => $playerUser1->id, 'role' => 'player', 'name' => $playerUser1->name, 'phone' => '+60 12-222 1111'],
            ['email' => $playerUser2->email, 'user_id' => $playerUser2->id, 'role' => 'player', 'name' => $playerUser2->name, 'phone' => '+60 12-333 2222'],
        ];

        $communityUserIds = [];

        foreach ($profiles as $profileData) {
            DB::table('community_users')->updateOrInsert(
                ['email' => $profileData['email']],
                [
                    'user_id'    => $profileData['user_id'],
                    'name'       => $profileData['name'],
                    'role'       => $profileData['role'],
                    'phone'      => $profileData['phone'],
                    'password'   => Hash::make('password123'),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            $communityUserIds[$profileData['email']] = DB::table('community_users')->where('email', $profileData['email'])->value('id');
        }

        // ── 3. Games ──────────────────────────────────────────────────────────
        DB::table('community_games')->updateOrInsert(
            ['title' => 'Midnight Futsal — Cheras'],
            [
                'description'        => 'Friendly pickup game. Wear sports shoes. Bring your own water.',
                'venue'              => 'Cheras Futsal Arena, Jalan Cheras, KL',
                'game_date'          => now()->addDays(2)->setTime(21, 0),
                'team_a_name'        => 'Team Hijau',
                'team_b_name'        => 'Team Merah',
                'max_slots_per_team' => 20,
                'status'             => 'open',
                'created_by'         => $communityUserIds['admin@nuvracommunity.com'],
                'created_at' => now(), 'updated_at' => now(),
            ]
        );
        $gameId = DB::table('community_games')->where('title', 'Midnight Futsal — Cheras')->value('id');

        // ── 4. Bookings ───────────────────────────────────────────────────────
        DB::table('community_bookings')->updateOrInsert(
            ['game_id' => $gameId, 'community_user_id' => $communityUserIds['haziq@test.com']],
            ['team_side' => 'team_a', 'status' => 'confirmed', 'created_at' => now(), 'updated_at' => now()]
        );

        $this->command->info('✅ Community seeder finished with correct IDs!');
    }
}
