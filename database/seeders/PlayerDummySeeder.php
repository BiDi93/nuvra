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
        $pastTitles = [
            'Liga Sekolah Invitational', 'Ajak Kawan FC vs Nuvra', 'Midnight Pickup Bangi',
            'Inter-Company Friendly', 'Pro-Am Scrimmage', 'Futsal Santai Weekend',
            'Nuvra Derby Night', 'Friendly Malam', 'Campus Cup Q1', 'Weekend Warrior Cup'
        ];
        $upcomingTitles = [
            'Kampung Friendly', 'Social League Tier 2', 'Pro-Am Scrimmage',
            'Nuvra Open League', 'KL Futsal Cup', 'Ajak Kawan FC vs Nuvra',
            'Friday Night Ballers', 'Corporate League Round 2', 'Midnight Pickup Bangi', 'Grand Community Clash'
        ];

        // 2. Create 20 Players with realistic Malaysian dummy data
        $playerData = [
            ['name' => 'Ahmad Farid Zulkifli',   'phone' => '0112345678', 'address' => 'No. 12, Jalan Putra 3, Taman Putra, Ampang, Selangor'],
            ['name' => 'Muhammad Haziq Rahim',    'phone' => '0123456789', 'address' => 'Blok B-12-3, Residensi Lembah Subang, Shah Alam, Selangor'],
            ['name' => 'Syafiq Danial Rosli',     'phone' => '0134567890', 'address' => 'No. 45, Jalan Kenanga 7, Taman Bukit Mewah, Kajang, Selangor'],
            ['name' => 'Irfan Hakim Zainuddin',   'phone' => '0145678901', 'address' => 'D-3-7, Vista Alam, Seksyen 14, Shah Alam, Selangor'],
            ['name' => 'Luqmanul Hakim Nasir',    'phone' => '0156789012', 'address' => 'No. 88, Jalan Damai 2, Taman Sri Rampai, Setapak, KL'],
            ['name' => 'Amirul Ariff Baharom',    'phone' => '0167890123', 'address' => 'No. 7, Lorong Mawar 4, Bandar Baru Bangi, Selangor'],
            ['name' => 'Harith Fauzan Abdullah',  'phone' => '0178901234', 'address' => 'Pangsapuri Sri Damansara, Blok E-5-2, Damansara, KL'],
            ['name' => 'Zulhilmi Azri Ismail',    'phone' => '0189012345', 'address' => 'No. 3, Jalan Wangsa 8, Taman Wangsa Jaya, Wangsa Maju, KL'],
            ['name' => 'Daniel Akmal Kamaruzaman','phone' => '0190123456', 'address' => 'No. 21, Jalan Teratai 6, Taman Muda, Cheras, KL'],
            ['name' => 'Afiq Nabil Mahmud',       'phone' => '0111234567', 'address' => 'Blok C, Apartment Lestari, Jalan Gombak, Gombak, KL'],
            ['name' => 'Rizwan Hafiz Osman',      'phone' => '0122345678', 'address' => 'No. 55, Jalan Bakawali 3, Taman Keramat, Ampang, KL'],
            ['name' => 'Khairul Anuar Hamid',     'phone' => '0133456789', 'address' => 'No. 14, Jalan Ikhlas 5, Taman Ikhlas, Kepong, KL'],
            ['name' => 'Izzat Hafizuddin Saad',   'phone' => '0144567890', 'address' => 'E-11-2, Menara U, Seksyen 13, Shah Alam, Selangor'],
            ['name' => 'Fareez Haikal Yusof',     'phone' => '0155678901', 'address' => 'No. 60, Jalan Indah 9, Taman Bukit Indah, Ampang, Selangor'],
            ['name' => 'Azfar Shukri Mansor',     'phone' => '0166789012', 'address' => 'No. 9, Lorong Utama 2, Bandar Sri Permaisuri, Cheras, KL'],
            ['name' => 'Hazwan Naim Norizan',     'phone' => '0177890123', 'address' => 'Blok A-7-12, Pangsapuri Mewah, Pandan Jaya, KL'],
            ['name' => 'Muaz Ikmal Zainal',       'phone' => '0188901234', 'address' => 'No. 33, Jalan Melor 11, Taman Melawati, Ulu Klang, Selangor'],
            ['name' => 'Aizat Firdaus Hashim',    'phone' => '0199012345', 'address' => 'D-2-3, Pangsapuri Desa Pinggiran, Taman Desa, KL'],
            ['name' => 'Suffian Ramadhan Ali',    'phone' => '0112233445', 'address' => 'No. 18, Jalan Anggerik 4, Taman Anggerik, Klang, Selangor'],
            ['name' => 'Faris Asyraf Othman',     'phone' => '0123344556', 'address' => 'No. 76, Jalan Sri Hartamas 7, Sri Hartamas, KL'],
        ];

        $players = [];
        foreach ($playerData as $i => $data) {
            $num = $i + 1;
            $players[] = User::updateOrCreate(
                ['email' => "player{$num}@nuvra.com"],
                [
                    'name'     => $data['name'],
                    'password' => Hash::make('password'),
                    'role'     => 'player',
                    'phone'    => $data['phone'],
                    'address'  => $data['address'],
                    'avatar'   => "https://i.pravatar.cc/150?img={$num}",
                ]
            );
        }

        // 3. Create 10 PAST matches (shared) — assign all players + record performances
        for ($j = 0; $j < 10; $j++) {
            $date = Carbon::now()->subWeeks($j + 1);
            $match = FootballMatch::create([
                'club_owner_id' => $owner->id,
                'title'         => $pastTitles[$j],
                'venue'         => $venues[$j % count($venues)],
                'match_date'    => $date->toDateString(),
                'match_time'    => '21:00:00',
                'price'         => 20,
                'total_slots'   => 22,
                'status'        => 'completed',
                'team_a_name'   => 'Nuvra Blues',
                'team_b_name'   => 'Opponent Team',
            ]);

            foreach ($players as $player) {
                DB::table('match_player')->insert([
                    'match_id'   => $match->id,
                    'user_id'    => $player->id,
                    'status'     => 'confirmed',
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                Performance::create([
                    'user_id'        => $player->id,
                    'match_id'       => $match->id,
                    'goals'          => rand(0, 3),
                    'assists'        => rand(0, 2),
                    'rating'         => rand(65, 95) / 10,
                    'minutes_played' => 60,
                ]);
            }
        }

        // 4. Create 10 UPCOMING matches (shared) — optionally assign players
        for ($k = 0; $k < 10; $k++) {
            $date = Carbon::now()->addDays(($k + 1) * 3);
            $match = FootballMatch::create([
                'club_owner_id' => $owner->id,
                'title'         => $upcomingTitles[$k],
                'venue'         => $venues[$k % count($venues)],
                'match_date'    => $date->toDateString(),
                'match_time'    => '20:00:00',
                'price'         => 25,
                'total_slots'   => 22,
                'status'        => 'open',
                'team_a_name'   => $upcomingTitles[$k] === 'Grand Community Clash' ? 'Komu FC' : 'Tigers FC',
                'team_b_name'   => $upcomingTitles[$k] === 'Grand Community Clash' ? 'AI Football Club' : 'Lions United',
            ]);

            // Assign a realistic mix of booking states to each upcoming match.
            // player1 (index 0) is intentionally LEFT OUT of matches k >= 7 so the
            // join → pay → upload flow can be tested on a fresh match.
            foreach ($players as $idx => $player) {
                if ($idx === 0 && $k >= 7) continue;          // leave matches 8,9,10 open for player1
                if ($idx % 2 !== 0 && $idx > 10) continue;    // only a subset joins

                // Vary status so the organizer review screen has content to act on
                if ($idx % 4 === 1) {
                    $status  = 'awaiting_approval';
                    $receipt = "https://picsum.photos/seed/receipt{$match->id}_{$idx}/400/600";
                    $paidAt  = now();
                } elseif ($idx % 4 === 3) {
                    $status  = 'pending';     // joined but not paid yet
                    $receipt = null;
                    $paidAt  = null;
                } else {
                    $status  = 'confirmed';
                    $receipt = null;
                    $paidAt  = now();
                }

                DB::table('match_player')->insert([
                    'match_id'        => $match->id,
                    'user_id'         => $player->id,
                    'status'          => $status,
                    'payment_receipt' => $receipt,
                    'paid_at'         => $paidAt,
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
            }
        }

        $this->command->info('✅ Seeded 20 matches (10 past + 10 upcoming) with 20 players + booking states.');
    }
}
