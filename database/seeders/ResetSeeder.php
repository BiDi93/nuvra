<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * ResetSeeder
 * -----------
 * Wipes community data and re-creates fresh coach + player accounts
 * with properly linked `users` records (required for Sanctum login).
 *
 * Run: php artisan db:seed --class=ResetSeeder
 */
class ResetSeeder extends Seeder
{
    const PASSWORD = 'Nuvra2026!';

    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        // ── 1. Wipe community data ─────────────────────────────────────────
        DB::table('community_bookings')->truncate();
        DB::table('community_announcements')->truncate();
        DB::table('community_games')->truncate();
        DB::table('community_users')->truncate();
        DB::table('users')
            ->whereIn('role', ['community_player', 'community_admin'])
            ->delete();

        $this->command->info('✅ Community data cleared.');

        // ── 2. Wipe existing coach & player users ─────────────────────────
        DB::table('performances')->truncate();
        DB::table('attributes')->truncate();
        DB::table('players')->truncate();
        DB::table('coaches')->truncate();
        DB::table('users')
            ->whereIn('role', ['coach', 'player'])
            ->delete();

        $this->command->info('✅ Old coach & player records cleared.');

        // ── 3. Create Coach ───────────────────────────────────────────────
        $coachUserId = DB::table('users')->insertGetId([
            'name'       => 'Coach Nuvra',
            'email'      => 'coach@nuvra.com',
            'password'   => Hash::make(self::PASSWORD),
            'role'       => 'coach',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $coachId = DB::table('coaches')->insertGetId([
            'user_id'    => $coachUserId,
            'name'       => 'Coach Nuvra',
            'email'      => 'coach@nuvra.com',
            'password'   => Hash::make(self::PASSWORD), // kept for legacy
            'team_name'  => 'NUVRA FC',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info("✅ Coach created  →  coach@nuvra.com  /  " . self::PASSWORD);

        // ── 4. Create Players ─────────────────────────────────────────────
        $players = [
            ['name' => 'Ali Hassan',       'position' => 'Forward',    'jersey' => 9,  'foot' => 'right', 'height' => 178],
            ['name' => 'Muthu Kumar',      'position' => 'Midfielder', 'jersey' => 8,  'foot' => 'right', 'height' => 172],
            ['name' => 'Chong Wei',        'position' => 'Winger',     'jersey' => 7,  'foot' => 'left',  'height' => 168],
            ['name' => 'Sarah Johnson',    'position' => 'Defender',   'jersey' => 4,  'foot' => 'right', 'height' => 175],
            ['name' => 'Michael Chen',     'position' => 'Goalkeeper', 'jersey' => 1,  'foot' => 'right', 'height' => 188],
            ['name' => 'David Fernandez',  'position' => 'Striker',    'jersey' => 10, 'foot' => 'both',  'height' => 180],
            ['name' => 'Rajesh Singh',     'position' => 'Defender',   'jersey' => 5,  'foot' => 'right', 'height' => 182],
            ['name' => 'Tom Baker',        'position' => 'Midfielder', 'jersey' => 6,  'foot' => 'left',  'height' => 176],
            ['name' => 'Ahmad Zaki',       'position' => 'Winger',     'jersey' => 11, 'foot' => 'right', 'height' => 170],
            ['name' => 'Steve Rogers',     'position' => 'Defender',   'jersey' => 3,  'foot' => 'right', 'height' => 185],
        ];

        foreach ($players as $i => $p) {
            $email = 'player' . ($i + 1) . '@nuvra.com';

            // a. Create users record (required for auth)
            $userId = DB::table('users')->insertGetId([
                'name'       => $p['name'],
                'email'      => $email,
                'password'   => Hash::make(self::PASSWORD),
                'role'       => 'player',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // b. Create players record linked to user
            $isAttacker = in_array($p['position'], ['Forward', 'Striker', 'Winger']);
            $isDefender = in_array($p['position'], ['Defender', 'Goalkeeper']);

            $playerId = DB::table('players')->insertGetId([
                'user_id'       => $userId,
                'coach_id'      => $coachId,
                'name'          => $p['name'],
                'email'         => $email,
                'password'      => Hash::make(self::PASSWORD),
                'position'      => $p['position'],
                'jersey_number' => $p['jersey'],
                'strong_foot'   => $p['foot'],
                'height_cm'     => $p['height'],
                'status'        => 'active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            // c. Attributes
            DB::table('attributes')->insert([
                'player_id'  => $playerId,
                'pace'       => rand(70, 95),
                'shooting'   => $isAttacker ? rand(80, 99) : rand(40, 70),
                'passing'    => rand(60, 90),
                'dribbling'  => $isAttacker ? rand(75, 95) : rand(50, 75),
                'defending'  => $isDefender ? rand(80, 95) : rand(30, 60),
                'physical'   => rand(65, 90),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // d. Sample match history
            for ($m = 1; $m <= 3; $m++) {
                DB::table('performances')->insert([
                    'player_id'      => $playerId,
                    'match_date'     => now()->subDays($m * 7),
                    'opponent_name'  => 'Dummy FC ' . $m,
                    'minutes_played' => 90,
                    'goals'          => $isAttacker ? rand(0, 2) : 0,
                    'assists'        => rand(0, 1),
                    'rating'         => round(rand(60, 95) / 10, 1),
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }
        }

        // ── 5. Create Community Admin ─────────────────────────────────────
        $adminUserId = DB::table('users')->insertGetId([
            'name'       => 'Nuvra Admin',
            'email'      => 'admin@nuvra.com',
            'password'   => Hash::make(self::PASSWORD),
            'role'       => 'community_admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('community_users')->insert([
            'user_id'    => $adminUserId,
            'name'       => 'Nuvra Admin',
            'email'      => 'admin@nuvra.com',
            'password'   => Hash::make(self::PASSWORD),
            'role'       => 'admin',
            'phone'      => '+60 12-000 0001',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info("✅ Community admin created  →  admin@nuvra.com  /  " . self::PASSWORD);

        // ── 6. Create Community Player ────────────────────────────────────
        $communityPlayerUserId = DB::table('users')->insertGetId([
            'name'       => 'Nuvra User',
            'email'      => 'user@nuvra.com',
            'password'   => Hash::make(self::PASSWORD),
            'role'       => 'community_player',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('community_users')->insert([
            'user_id'    => $communityPlayerUserId,
            'name'       => 'Nuvra User',
            'email'      => 'user@nuvra.com',
            'password'   => Hash::make(self::PASSWORD),
            'role'       => 'player',
            'phone'      => '+60 12-000 0002',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info("✅ Community user created   →  user@nuvra.com  /  " . self::PASSWORD);

        Schema::enableForeignKeyConstraints();

        $this->command->info('');
        $this->command->info('══════════════════════════════════════════');
        $this->command->info('  FRESH CREDENTIALS');
        $this->command->info('══════════════════════════════════════════');
        $this->command->info('  COACH (Club Portal)');
        $this->command->info('  Email    : coach@nuvra.com');
        $this->command->info('  Password : ' . self::PASSWORD);
        $this->command->info('──────────────────────────────────────────');
        $this->command->info('  PLAYERS  (Club Portal)');
        $this->command->info('  Email    : player{1-10}@nuvra.com');
        $this->command->info('  Password : ' . self::PASSWORD);
        $this->command->info('──────────────────────────────────────────');
        $this->command->info('  COMMUNITY ADMIN');
        $this->command->info('  Email    : admin@nuvra.com');
        $this->command->info('  Password : ' . self::PASSWORD);
        $this->command->info('──────────────────────────────────────────');
        $this->command->info('  COMMUNITY USER');
        $this->command->info('  Email    : user@nuvra.com');
        $this->command->info('  Password : ' . self::PASSWORD);
        $this->command->info('══════════════════════════════════════════');
    }
}
