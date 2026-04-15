<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * ResetSeeder
 * -----------
 * Wipes all existing data and seeds:
 *   - 5 coaches  (coach1@nuvra.com … coach5@nuvra.com)
 *   - 10 players per coach  (player{1-10}_{coachNum}@gmail.com)
 *   - Full dummy data: attributes + 8 match performances per player
 *   - 1 community admin  (admin@nuvra.com)
 *   - 1 community user   (user@nuvra.com)
 *
 * Run: php artisan db:seed --class=ResetSeeder
 */
class ResetSeeder extends Seeder
{
    const PASSWORD = 'Nuvra2026!';

    // ── Coach definitions ──────────────────────────────────────────────────
    private array $coaches = [
        ['name' => 'Coach Ahmad',   'team' => 'NUVRA FC',         'email' => 'coach1@nuvra.com'],
        ['name' => 'Coach Rajan',   'team' => 'Perak United',     'email' => 'coach2@nuvra.com'],
        ['name' => 'Coach Lim',     'team' => 'Selangor Elite',   'email' => 'coach3@nuvra.com'],
        ['name' => 'Coach Farid',   'team' => 'KL Warriors',      'email' => 'coach4@nuvra.com'],
        ['name' => 'Coach Kumar',   'team' => 'Johor Panthers',   'email' => 'coach5@nuvra.com'],
    ];

    // ── Player name pool (50 names, 10 per coach) ──────────────────────────
    private array $playerPool = [
        // Coach 1
        ['name' => 'Hazim Razali',     'position' => 'Forward',    'jersey' => 9,  'foot' => 'right', 'height' => 178, 'dob' => '2002-03-15'],
        ['name' => 'Syafiq Amir',      'position' => 'Midfielder', 'jersey' => 8,  'foot' => 'right', 'height' => 172, 'dob' => '2001-07-22'],
        ['name' => 'Danial Haris',     'position' => 'Winger',     'jersey' => 7,  'foot' => 'left',  'height' => 169, 'dob' => '2003-01-10'],
        ['name' => 'Arif Hakimi',      'position' => 'Defender',   'jersey' => 4,  'foot' => 'right', 'height' => 181, 'dob' => '2000-11-05'],
        ['name' => 'Zulkifli Noh',     'position' => 'Goalkeeper', 'jersey' => 1,  'foot' => 'right', 'height' => 190, 'dob' => '1999-06-18'],
        ['name' => 'Irfan Shazwan',    'position' => 'Striker',    'jersey' => 10, 'foot' => 'both',  'height' => 176, 'dob' => '2002-09-30'],
        ['name' => 'Luqman Hakim',     'position' => 'Defender',   'jersey' => 5,  'foot' => 'right', 'height' => 183, 'dob' => '2001-04-14'],
        ['name' => 'Adam Farhan',      'position' => 'Midfielder', 'jersey' => 6,  'foot' => 'left',  'height' => 174, 'dob' => '2003-08-27'],
        ['name' => 'Nabil Izzat',      'position' => 'Winger',     'jersey' => 11, 'foot' => 'right', 'height' => 170, 'dob' => '2000-02-03'],
        ['name' => 'Hafiz Zainal',     'position' => 'Defender',   'jersey' => 3,  'foot' => 'right', 'height' => 179, 'dob' => '2002-12-19'],

        // Coach 2
        ['name' => 'Vijay Krishnan',   'position' => 'Forward',    'jersey' => 9,  'foot' => 'right', 'height' => 175, 'dob' => '2001-05-08'],
        ['name' => 'Suresh Pillai',    'position' => 'Midfielder', 'jersey' => 8,  'foot' => 'right', 'height' => 170, 'dob' => '2002-10-21'],
        ['name' => 'Ravi Shankar',     'position' => 'Winger',     'jersey' => 7,  'foot' => 'left',  'height' => 168, 'dob' => '2000-03-14'],
        ['name' => 'Mohan Das',        'position' => 'Defender',   'jersey' => 4,  'foot' => 'right', 'height' => 180, 'dob' => '1999-08-25'],
        ['name' => 'Arun Kumar',       'position' => 'Goalkeeper', 'jersey' => 1,  'foot' => 'right', 'height' => 187, 'dob' => '2001-01-17'],
        ['name' => 'Ganesh Babu',      'position' => 'Striker',    'jersey' => 10, 'foot' => 'right', 'height' => 173, 'dob' => '2003-06-09'],
        ['name' => 'Pradeep Nair',     'position' => 'Defender',   'jersey' => 5,  'foot' => 'left',  'height' => 182, 'dob' => '2000-11-30'],
        ['name' => 'Bala Murugan',     'position' => 'Midfielder', 'jersey' => 6,  'foot' => 'right', 'height' => 171, 'dob' => '2002-04-02'],
        ['name' => 'Karthik Raj',      'position' => 'Winger',     'jersey' => 11, 'foot' => 'right', 'height' => 167, 'dob' => '2001-09-16'],
        ['name' => 'Selvam Arasu',     'position' => 'Defender',   'jersey' => 3,  'foot' => 'right', 'height' => 177, 'dob' => '2003-02-28'],

        // Coach 3
        ['name' => 'Wei Jian Loh',     'position' => 'Forward',    'jersey' => 9,  'foot' => 'right', 'height' => 174, 'dob' => '2002-07-12'],
        ['name' => 'Chun Hao Tan',     'position' => 'Midfielder', 'jersey' => 8,  'foot' => 'right', 'height' => 171, 'dob' => '2000-12-05'],
        ['name' => 'Zhi Xian Wong',    'position' => 'Winger',     'jersey' => 7,  'foot' => 'left',  'height' => 168, 'dob' => '2003-03-22'],
        ['name' => 'Jun Kai Chong',    'position' => 'Defender',   'jersey' => 4,  'foot' => 'right', 'height' => 179, 'dob' => '2001-06-14'],
        ['name' => 'Yong Sheng Ng',    'position' => 'Goalkeeper', 'jersey' => 1,  'foot' => 'right', 'height' => 188, 'dob' => '1999-09-01'],
        ['name' => 'Kai Ming Lee',     'position' => 'Striker',    'jersey' => 10, 'foot' => 'both',  'height' => 176, 'dob' => '2002-01-19'],
        ['name' => 'Rui Feng Lim',     'position' => 'Defender',   'jersey' => 5,  'foot' => 'right', 'height' => 183, 'dob' => '2000-04-07'],
        ['name' => 'Jia Wei Chan',     'position' => 'Midfielder', 'jersey' => 6,  'foot' => 'left',  'height' => 173, 'dob' => '2001-10-23'],
        ['name' => 'Hao Yang Koh',     'position' => 'Winger',     'jersey' => 11, 'foot' => 'right', 'height' => 169, 'dob' => '2003-05-11'],
        ['name' => 'Zi Hao Yeoh',      'position' => 'Defender',   'jersey' => 3,  'foot' => 'right', 'height' => 178, 'dob' => '2002-08-30'],

        // Coach 4
        ['name' => 'Izzuddin Haris',   'position' => 'Forward',    'jersey' => 9,  'foot' => 'right', 'height' => 177, 'dob' => '2001-02-14'],
        ['name' => 'Mukhriz Fauzi',    'position' => 'Midfielder', 'jersey' => 8,  'foot' => 'right', 'height' => 173, 'dob' => '2003-07-08'],
        ['name' => 'Ridhwan Shah',     'position' => 'Winger',     'jersey' => 7,  'foot' => 'left',  'height' => 170, 'dob' => '2000-10-25'],
        ['name' => 'Faris Ikhwan',     'position' => 'Defender',   'jersey' => 4,  'foot' => 'right', 'height' => 182, 'dob' => '2002-05-17'],
        ['name' => 'Azlan Suhaimi',    'position' => 'Goalkeeper', 'jersey' => 1,  'foot' => 'right', 'height' => 191, 'dob' => '1999-11-03'],
        ['name' => 'Fitri Amzar',      'position' => 'Striker',    'jersey' => 10, 'foot' => 'both',  'height' => 175, 'dob' => '2001-03-29'],
        ['name' => 'Haikal Nizam',     'position' => 'Defender',   'jersey' => 5,  'foot' => 'right', 'height' => 184, 'dob' => '2003-09-12'],
        ['name' => 'Asyraf Zulkefli',  'position' => 'Midfielder', 'jersey' => 6,  'foot' => 'left',  'height' => 172, 'dob' => '2000-06-01'],
        ['name' => 'Shafwan Idris',    'position' => 'Winger',     'jersey' => 11, 'foot' => 'right', 'height' => 168, 'dob' => '2002-01-20'],
        ['name' => 'Ilham Ruslan',     'position' => 'Defender',   'jersey' => 3,  'foot' => 'right', 'height' => 180, 'dob' => '2001-08-06'],

        // Coach 5
        ['name' => 'Aravind Raj',      'position' => 'Forward',    'jersey' => 9,  'foot' => 'right', 'height' => 176, 'dob' => '2002-04-18'],
        ['name' => 'Harish Menon',     'position' => 'Midfielder', 'jersey' => 8,  'foot' => 'right', 'height' => 172, 'dob' => '2000-09-07'],
        ['name' => 'Dinesh Gopal',     'position' => 'Winger',     'jersey' => 7,  'foot' => 'left',  'height' => 167, 'dob' => '2003-02-14'],
        ['name' => 'Kamal Hassan',     'position' => 'Defender',   'jersey' => 4,  'foot' => 'right', 'height' => 181, 'dob' => '2001-07-31'],
        ['name' => 'Farouk Jalil',     'position' => 'Goalkeeper', 'jersey' => 1,  'foot' => 'right', 'height' => 189, 'dob' => '1999-12-22'],
        ['name' => 'Nizam Bahari',     'position' => 'Striker',    'jersey' => 10, 'foot' => 'both',  'height' => 174, 'dob' => '2002-06-05'],
        ['name' => 'Shahril Azmi',     'position' => 'Defender',   'jersey' => 5,  'foot' => 'right', 'height' => 183, 'dob' => '2000-03-19'],
        ['name' => 'Khairul Azhar',    'position' => 'Midfielder', 'jersey' => 6,  'foot' => 'left',  'height' => 173, 'dob' => '2001-11-08'],
        ['name' => 'Fadzillah Nasir',  'position' => 'Winger',     'jersey' => 11, 'foot' => 'right', 'height' => 169, 'dob' => '2003-04-27'],
        ['name' => 'Zaidi Mahmud',     'position' => 'Defender',   'jersey' => 3,  'foot' => 'right', 'height' => 178, 'dob' => '2002-10-13'],
    ];

    // ── Opponents pool for match history ───────────────────────────────────
    private array $opponents = [
        'Kedah Darul Aman', 'Pahang FC', 'Terengganu FC', 'Sabah FA',
        'Sarawak United', 'Negeri Sembilan', 'Melaka United', 'Sri Pahang',
        'Kuching City', 'Penang FC',
    ];

    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        // ── 1. Wipe everything ─────────────────────────────────────────────
        DB::table('community_bookings')->truncate();
        DB::table('community_announcements')->truncate();
        DB::table('community_games')->truncate();
        DB::table('community_users')->truncate();
        DB::table('performances')->truncate();
        DB::table('matches')->truncate();
        DB::table('attributes')->truncate();
        DB::table('players')->truncate();
        DB::table('coaches')->truncate();
        DB::table('users')->whereIn('role', [
            'player', 'coach', 'community_player', 'community_admin'
        ])->delete();

        $this->command->info('✅ All existing records cleared.');
        $this->command->info('');

        // ── 2. Create 5 Coaches + 10 Players each ─────────────────────────
        foreach ($this->coaches as $coachNum => $coachData) {
            $coachIndex = $coachNum + 1; // 1-based

            // a. users record
            $coachUserId = DB::table('users')->insertGetId([
                'name'       => $coachData['name'],
                'email'      => $coachData['email'],
                'password'   => Hash::make(self::PASSWORD),
                'role'       => 'coach',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // b. coaches record
            $coachId = DB::table('coaches')->insertGetId([
                'user_id'    => $coachUserId,
                'name'       => $coachData['name'],
                'email'      => $coachData['email'],
                'password'   => Hash::make(self::PASSWORD),
                'team_name'  => $coachData['team'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info("✅ Coach {$coachIndex}: {$coachData['email']}  →  {$coachData['team']}");

            // c. Create 8 matches for this coach
            $leagues  = ['Liga Super', 'Liga Premier', 'FA Cup', 'Malaysia Cup'];
            $venues   = ['Home', 'Away', 'Shah Alam Stadium', 'Stadium Bukit Jalil', 'Stadium Perak'];
            $matchIds = [];

            for ($m = 1; $m <= 8; $m++) {
                $opponent  = $this->opponents[($m + $coachNum) % count($this->opponents)];
                $matchIds[] = DB::table('matches')->insertGetId([
                    'coach_id'      => $coachId,
                    'opponent_name' => $opponent,
                    'match_date'    => now()->subDays($m * 8)->toDateString(),
                    'match_time'    => '20:00:00',
                    'venue'         => $venues[$m % count($venues)],
                    'league_type'   => 'League',
                    'league_name'   => $leagues[$m % count($leagues)],
                    'category'      => 'Senior',
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }

            // d. 10 players for this coach
            $squadStart = $coachNum * 10;

            for ($playerNum = 1; $playerNum <= 10; $playerNum++) {
                $p     = $this->playerPool[$squadStart + ($playerNum - 1)];
                $email = "player{$playerNum}_{$coachIndex}@gmail.com";

                $isAttacker = in_array($p['position'], ['Forward', 'Striker', 'Winger']);
                $isDefender = in_array($p['position'], ['Defender', 'Goalkeeper']);

                // users record
                $userId = DB::table('users')->insertGetId([
                    'name'       => $p['name'],
                    'email'      => $email,
                    'password'   => Hash::make(self::PASSWORD),
                    'role'       => 'player',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // players record
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
                    'date_of_birth' => $p['dob'],
                    'status'        => 'active',
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);

                // attributes (position-weighted)
                DB::table('attributes')->insert([
                    'player_id'  => $playerId,
                    'pace'       => $isAttacker ? rand(80, 97) : rand(60, 82),
                    'shooting'   => $isAttacker ? rand(78, 97) : ($isDefender ? rand(25, 50) : rand(50, 72)),
                    'passing'    => rand(62, 90),
                    'dribbling'  => $isAttacker ? rand(76, 95) : ($isDefender ? rand(40, 65) : rand(60, 80)),
                    'defending'  => $isDefender ? rand(78, 95) : ($isAttacker ? rand(20, 45) : rand(50, 70)),
                    'physical'   => rand(65, 92),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // 1 performance per match (8 total), linked via match_id
                $minsList = [60, 70, 75, 80, 85, 90, 90, 90];
                foreach ($matchIds as $idx => $matchId) {
                    DB::table('performances')->insert([
                        'player_id'      => $playerId,
                        'match_id'       => $matchId,
                        'minutes_played' => $minsList[$idx],
                        'goals'          => $isAttacker ? rand(0, 3) : ($isDefender ? 0 : rand(0, 1)),
                        'assists'        => rand(0, 2),
                        'rating'         => round(rand(55, 97) / 10, 1),
                        'cleansheet'     => ($isDefender && rand(0, 1)) ? 1 : 0,
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }

                $this->command->line("     · player{$playerNum}_{$coachIndex}@gmail.com  ({$p['name']} — {$p['position']})");
            }

            $this->command->info('');
        }

        // ── 3. Community Admin ─────────────────────────────────────────────
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

        // ── 4. Community User ──────────────────────────────────────────────
        $userUserId = DB::table('users')->insertGetId([
            'name'       => 'Nuvra User',
            'email'      => 'user@nuvra.com',
            'password'   => Hash::make(self::PASSWORD),
            'role'       => 'community_player',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('community_users')->insert([
            'user_id'    => $userUserId,
            'name'       => 'Nuvra User',
            'email'      => 'user@nuvra.com',
            'password'   => Hash::make(self::PASSWORD),
            'role'       => 'player',
            'phone'      => '+60 12-000 0002',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::enableForeignKeyConstraints();

        // ── Summary ────────────────────────────────────────────────────────
        $this->command->info('══════════════════════════════════════════════════════');
        $this->command->info('  FRESH CREDENTIALS  —  password: ' . self::PASSWORD);
        $this->command->info('══════════════════════════════════════════════════════');
        $this->command->info('  COACHES (Club Portal)');
        foreach ($this->coaches as $i => $c) {
            $this->command->info("    Coach " . ($i + 1) . "  →  {$c['email']}");
        }
        $this->command->info('');
        $this->command->info('  PLAYERS (Club Portal)');
        $this->command->info('    player{1-10}_{coachNum}@gmail.com');
        $this->command->info('    e.g. player3_2@gmail.com  =  player 3 under coach 2');
        $this->command->info('');
        $this->command->info('  COMMUNITY ADMIN  →  admin@nuvra.com');
        $this->command->info('  COMMUNITY USER   →  user@nuvra.com');
        $this->command->info('══════════════════════════════════════════════════════');
        $this->command->info('  Total: 5 coaches · 40 matches · 50 players · 400 performances');
        $this->command->info('══════════════════════════════════════════════════════');
    }
}
