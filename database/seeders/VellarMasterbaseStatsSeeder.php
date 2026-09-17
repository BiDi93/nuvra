<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\FootballMatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VellarMasterbaseStatsSeeder extends Seeder
{
    public function run(): void
    {
        $possiblePaths = [
            base_path('MASTERBASE VELLAR ID S1.xlsx'),
            '/Volumes/MUHAIMIN/Project/NUVRA/MASTERBASE VELLAR ID S1.xlsx',
        ];

        $excelPath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $excelPath = $path;
                break;
            }
        }

        if (!$excelPath) {
            $this->command?->error("Masterbase Excel file not found!");
            return;
        }

        $this->command?->info("Loading player stats and matches from: {$excelPath}");

        $admin = User::where('role', 'admin')->first();
        $adminId = $admin ? $admin->id : 1;

        // 1. Tournaments
        $tournamentsData = [
            'vellar-league-semenyih' => [
                'name'        => 'Vellar League Semenyih',
                'description' => 'Official FAS Affiliate Tournament - Semenyih Division',
                'venue'       => 'Semenyih Sports Arena',
            ],
            'vellar-league-bangi' => [
                'name'        => 'Vellar League Bangi',
                'description' => 'Official FAS Affiliate Tournament - Bangi Division',
                'venue'       => 'Uptown Sports Bangi',
            ],
            'vellar-league-serdang' => [
                'name'        => 'Vellar League Serdang',
                'description' => 'Official FAS Affiliate Tournament - Serdang Division',
                'venue'       => 'Serdang Sports Complex',
            ],
            'vellar-league-sepang' => [
                'name'        => 'Vellar League Sepang',
                'description' => 'Official FAS Affiliate Tournament - Sepang Division',
                'venue'       => 'Sepang Football Arena',
            ],
            'vellar-league-serdang-30an' => [
                'name'        => 'Vellar League Serdang 30AN',
                'description' => 'Official FAS Affiliate Tournament - Serdang Veteran 30AN',
                'venue'       => 'Serdang Sports Complex',
            ],
        ];

        $tournaments = [];
        foreach ($tournamentsData as $slug => $tInfo) {
            $tournaments[$slug] = Tournament::updateOrCreate(
                ['slug' => $slug],
                [
                    'organizer_id' => $adminId,
                    'name'         => $tInfo['name'],
                    'description'  => $tInfo['description'],
                    'format'       => 'league',
                    'season'       => 'Season 1 (2026)',
                    'venue'        => $tInfo['venue'],
                    'status'       => 'active',
                ]
            );
        }

        // 2. Tournament Teams
        $divisionTeams = [
            'vellar-league-semenyih'     => ['HFRENZ FC', 'KODOI FC', 'FCFT', 'DER ALLIANZ FC'],
            'vellar-league-bangi'        => ['BRG FC', 'KOMUXUSRA', 'BOSS SC', 'AMIGOS FC'],
            'vellar-league-serdang'      => ['MAKKAH FC', 'ZNR FT', 'SEMUT MERAH FC', 'LEGACY FC'],
            'vellar-league-sepang'       => ['Z.5 FC', 'PRIME UNITED', 'VVS1', 'PUTRA GATHERS'],
            'vellar-league-serdang-30an' => ['MAULANA', 'FOURTEEN & CO FC', 'LOYAL TROOPERS', 'FENOMENO VFC'],
        ];

        $teamMap = [];
        foreach ($divisionTeams as $slug => $tList) {
            $tId = $tournaments[$slug]->id;
            foreach ($tList as $tName) {
                $teamMap[$tName] = TournamentTeam::firstOrCreate([
                    'tournament_id' => $tId,
                    'name'          => $tName,
                ]);
            }
        }

        // 3. Completed Matches across all 5 Divisions (from Sheet 5 & 6)
        $allMatches = [
            // Semenyih (5 Matchweeks)
            ['vellar-league-semenyih', 'Matchweek 1', 'HFRENZ FC', 'KODOI FC', 5, 0, '2026-07-20', '20:00:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 1', 'FCFT', 'DER ALLIANZ FC', 7, 0, '2026-07-20', '21:15:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 2', 'KODOI FC', 'DER ALLIANZ FC', 0, 2, '2026-07-27', '20:00:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 2', 'FCFT', 'HFRENZ FC', 4, 0, '2026-07-27', '21:15:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 3', 'HFRENZ FC', 'DER ALLIANZ FC', 3, 0, '2026-08-03', '20:00:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 3', 'FCFT', 'KODOI FC', 4, 0, '2026-08-03', '21:15:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 4', 'KODOI FC', 'HFRENZ FC', 0, 1, '2026-08-10', '20:00:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 4', 'DER ALLIANZ FC', 'FCFT', 1, 8, '2026-08-10', '21:15:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 5', 'HFRENZ FC', 'FCFT', 4, 2, '2026-08-17', '20:00:00', 'Padang A'],
            ['vellar-league-semenyih', 'Matchweek 5', 'KODOI FC', 'DER ALLIANZ FC', 3, 1, '2026-08-17', '21:15:00', 'Padang A'],

            // Bangi (6 Matchweeks)
            ['vellar-league-bangi', 'Matchweek 1', 'KOMUXUSRA', 'BRG FC', 0, 1, '2026-07-12', '20:30:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 1', 'BOSS SC', 'AMIGOS FC', 7, 1, '2026-07-12', '21:45:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 2', 'KOMUXUSRA', 'BOSS SC', 2, 1, '2026-07-19', '20:30:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 2', 'BRG FC', 'AMIGOS FC', 3, 2, '2026-07-19', '21:45:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 3', 'BRG FC', 'BOSS SC', 0, 1, '2026-07-26', '20:30:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 3', 'KOMUXUSRA', 'AMIGOS FC', 5, 0, '2026-07-26', '21:45:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 4', 'BOSS SC', 'AMIGOS FC', 5, 1, '2026-08-02', '20:30:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 4', 'KOMUXUSRA', 'BRG FC', 1, 4, '2026-08-02', '21:45:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 5', 'AMIGOS FC', 'BRG FC', 1, 8, '2026-08-09', '20:30:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 5', 'KOMUXUSRA', 'BOSS SC', 0, 2, '2026-08-09', '21:45:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 6', 'AMIGOS FC', 'KOMUXUSRA', 2, 6, '2026-08-16', '20:30:00', 'Court 1'],
            ['vellar-league-bangi', 'Matchweek 6', 'BOSS SC', 'BRG FC', 2, 1, '2026-08-16', '21:45:00', 'Court 1'],

            // Serdang (6 Matchweeks)
            ['vellar-league-serdang', 'Matchweek 1', 'LEGACY FC', 'ZNR FT', 1, 3, '2026-07-15', '20:00:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 1', 'MAKKAH FC', 'SEMUT MERAH FC', 9, 1, '2026-07-15', '21:15:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 2', 'SEMUT MERAH FC', 'ZNR FT', 0, 2, '2026-07-22', '20:00:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 2', 'MAKKAH FC', 'LEGACY FC', 7, 2, '2026-07-22', '21:15:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 3', 'MAKKAH FC', 'ZNR FT', 2, 2, '2026-07-29', '20:00:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 3', 'LEGACY FC', 'SEMUT MERAH FC', 1, 0, '2026-07-29', '21:15:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 4', 'SEMUT MERAH FC', 'MAKKAH FC', 0, 4, '2026-08-05', '20:00:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 4', 'LEGACY FC', 'ZNR FT', 0, 4, '2026-08-05', '21:15:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 5', 'MAKKAH FC', 'LEGACY FC', 4, 0, '2026-08-12', '20:00:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 5', 'ZNR FT', 'SEMUT MERAH FC', 3, 1, '2026-08-12', '21:15:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 6', 'SEMUT MERAH FC', 'LEGACY FC', 1, 0, '2026-08-19', '20:00:00', 'Pitch 1'],
            ['vellar-league-serdang', 'Matchweek 6', 'MAKKAH FC', 'ZNR FT', 1, 3, '2026-08-19', '21:15:00', 'Pitch 1'],

            // Sepang (6 Matchweeks)
            ['vellar-league-sepang', 'Matchweek 1', 'PRIME UNITED', 'Z.5 FC', 0, 0, '2026-07-19', '20:00:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 1', 'PUTRA GATHERS', 'VVS1', 3, 2, '2026-07-19', '21:15:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 2', 'PRIME UNITED', 'PUTRA GATHERS', 4, 1, '2026-07-26', '20:00:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 2', 'Z.5 FC', 'VVS1', 4, 1, '2026-07-26', '21:15:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 3', 'Z.5 FC', 'PUTRA GATHERS', 5, 3, '2026-08-02', '20:00:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 3', 'PRIME UNITED', 'VVS1', 1, 1, '2026-08-02', '21:15:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 4', 'PRIME UNITED', 'Z.5 FC', 1, 2, '2026-08-09', '20:00:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 4', 'PUTRA GATHERS', 'VVS1', 2, 0, '2026-08-09', '21:15:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 5', 'VVS1', 'Z.5 FC', 1, 3, '2026-08-16', '20:00:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 5', 'PUTRA GATHERS', 'PRIME UNITED', 2, 1, '2026-08-16', '21:15:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 6', 'VVS1', 'PRIME UNITED', 5, 1, '2026-08-23', '20:00:00', 'Arena 1'],
            ['vellar-league-sepang', 'Matchweek 6', 'PUTRA GATHERS', 'Z.5 FC', 0, 2, '2026-08-23', '21:15:00', 'Arena 1'],

            // Serdang 30AN (4 Matchweeks)
            ['vellar-league-serdang-30an', 'Matchweek 1', 'MAULANA', 'FOURTEEN & CO FC', 1, 4, '2026-07-21', '20:00:00', 'Pitch 2'],
            ['vellar-league-serdang-30an', 'Matchweek 1', 'FENOMENO VFC', 'LOYAL TROOPERS', 0, 5, '2026-07-21', '21:15:00', 'Pitch 2'],
            ['vellar-league-serdang-30an', 'Matchweek 2', 'FOURTEEN & CO FC', 'LOYAL TROOPERS', 0, 2, '2026-07-28', '20:00:00', 'Pitch 2'],
            ['vellar-league-serdang-30an', 'Matchweek 2', 'MAULANA', 'FENOMENO VFC', 0, 9, '2026-07-28', '21:15:00', 'Pitch 2'],
            ['vellar-league-serdang-30an', 'Matchweek 3', 'LOYAL TROOPERS', 'MAULANA', 8, 0, '2026-08-04', '20:00:00', 'Pitch 2'],
            ['vellar-league-serdang-30an', 'Matchweek 3', 'FENOMENO VFC', 'FOURTEEN & CO FC', 1, 2, '2026-08-04', '21:15:00', 'Pitch 2'],
            ['vellar-league-serdang-30an', 'Matchweek 4', 'LOYAL TROOPERS', 'FENOMENO VFC', 5, 1, '2026-08-11', '20:00:00', 'Pitch 2'],
            ['vellar-league-serdang-30an', 'Matchweek 4', 'FOURTEEN & CO FC', 'MAULANA', 5, 2, '2026-08-11', '21:15:00', 'Pitch 2'],
        ];

        $matchModels = [];
        foreach ($allMatches as $m) {
            [$tSlug, $gw, $hName, $aName, $hScore, $aScore, $mDate, $mTime, $mVenue] = $m;
            $tourn = $tournaments[$tSlug];
            $hTeam = $teamMap[$hName] ?? null;
            $aTeam = $teamMap[$aName] ?? null;

            $matchModels[] = FootballMatch::updateOrCreate(
                [
                    'tournament_id'  => $tourn->id,
                    'gameweek'       => $gw,
                    'home_team_name' => $hName,
                    'away_team_name' => $aName,
                ],
                [
                    'organizer_id'   => $adminId,
                    'home_team_id'   => $hTeam ? $hTeam->id : null,
                    'away_team_id'   => $aTeam ? $aTeam->id : null,
                    'team_a_name'    => $hName,
                    'team_b_name'    => $aName,
                    'home_score'     => $hScore,
                    'away_score'     => $aScore,
                    'match_date'     => $mDate,
                    'match_time'     => $mTime,
                    'venue'          => $mVenue,
                    'status'         => 'completed',
                ]
            );
        }

        // 4. Parse Excel for Cumulative Stats
        $zip = new \ZipArchive();
        if ($zip->open($excelPath) !== true) {
            $this->command?->error("Failed to open Excel zip archive.");
            return;
        }

        $strings = [];
        $ssXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($ssXml) {
            $xml = simplexml_load_string($ssXml);
            foreach ($xml->si as $si) {
                if (isset($si->t)) {
                    $strings[] = (string)$si->t;
                } else {
                    $text = '';
                    foreach ($si->r as $r) {
                        $text .= (string)($r->t ?? '');
                    }
                    $strings[] = $text;
                }
            }
        }

        $playerStats = [];

        // Sheet 2: TEAM REGISTRATION S1
        $sheet2Xml = $zip->getFromName('xl/worksheets/sheet2.xml');
        if ($sheet2Xml) {
            $this->parseSheetStats($sheet2Xml, $strings, $playerStats, [
                ['A', 'B', 'C', 'D', 'E', 'F'],
                ['H', 'I', 'J', 'K', 'L', 'M'],
                ['O', 'P', 'Q', 'R', 'S', 'T'],
                ['V', 'W', 'X', 'Y', 'Z', 'AA'],
            ]);
        }

        // Sheet 4: VELLAR LEAGUE 30AN
        $sheet4Xml = $zip->getFromName('xl/worksheets/sheet4.xml');
        if ($sheet4Xml) {
            $this->parseSheetStats($sheet4Xml, $strings, $playerStats, [
                ['A', 'B', 'C', 'D', 'E', 'F'],
                ['H', 'I', 'J', 'K', 'L', 'M'],
                ['O', 'P', 'Q', 'R', 'S', 'T'],
            ]);
        }

        $zip->close();

        // Sheet 3 (TOP SCORER & ASSIST) Overrides
        $sheet3Overrides = [
            'VELLAR 340' => ['goals' => 6],
            'VELLAR 102' => ['goals' => 6],
            'VELLAR 23'  => ['goals' => 5],
            'VELLAR 139' => ['goals' => 4],
            'VELLAR 470' => ['assists' => 4],
            'VELLAR 41'  => ['assists' => 3],
            'VELLAR 343' => ['assists' => 3],
            'VELLAR 256' => ['goals' => 9],
            'VELLAR 352' => ['goals' => 5],
            'VELLAR 231' => ['goals' => 5],
            'VELLAR 255' => ['goals' => 5, 'assists' => 7],
            'VELLAR 259' => ['goals' => 4],
            'VELLAR 230' => ['assists' => 4],
            'VELLAR 252' => ['assists' => 3],
            'VELLAR 253' => ['assists' => 2],
            'VELLAR 112' => ['goals' => 10, 'assists' => 1],
            'VELLAR 290' => ['goals' => 7],
            'VELLAR 159' => ['goals' => 2],
            'VELLAR 111' => ['assists' => 5],
            'VELLAR 157' => ['assists' => 2],
            'VELLAR 109' => ['assists' => 1],
            'VELLAR 310' => ['goals' => 8, 'assists' => 2],
            'VELLAR 181' => ['goals' => 6, 'assists' => 2],
            'VELLAR 365' => ['goals' => 4],
            'VELLAR 456' => ['goals' => 2, 'assists' => 2],
            'VELLAR 303' => ['assists' => 2],
            'VELLAR 438' => ['goals' => 7],
            'VELLAR 414' => ['goals' => 4],
            'VELLAR 447' => ['assists' => 4],
        ];

        foreach ($sheet3Overrides as $vid => $ov) {
            $cleanVid = $this->cleanVellarId($vid);
            if (!isset($playerStats[$cleanVid])) {
                $playerStats[$cleanVid] = ['goals' => 0, 'assists' => 0, 'motm' => 0, 'team' => null];
            }
            if (isset($ov['goals'])) {
                $playerStats[$cleanVid]['goals'] = max($playerStats[$cleanVid]['goals'], $ov['goals']);
            }
            if (isset($ov['assists'])) {
                $playerStats[$cleanVid]['assists'] = max($playerStats[$cleanVid]['assists'], $ov['assists']);
            }
        }

        // 5. Update Users & Cumulative Statistics
        $users = User::where('role', 'player')->get();
        $updatedUsers = [];

        foreach ($users as $user) {
            $cleanVid = $this->cleanVellarId($user->vellar_id);
            $st = $playerStats[$cleanVid] ?? ['goals' => 0, 'assists' => 0, 'motm' => 0, 'team' => null];

            $effectiveTeam = $this->normalizeTeamName($st['team'] ?: $user->club_name);
            if ($user->name === 'Anouar Charik' && empty($effectiveTeam)) {
                $effectiveTeam = 'MAKKAH FC';
            }

            $matches = $this->getMatchesForTeam($effectiveTeam);
            $goals = (int)$st['goals'];
            $assists = (int)$st['assists'];
            $motm = (int)$st['motm'];

            $isDefOrGk = $this->isDefenderOrGoalkeeper($user->position);
            $cleanSheets = ($isDefOrGk && $matches > 0) ? $this->getTeamCleanSheets($effectiveTeam) : 0;

            if ($matches > 0) {
                $rawRating = 6.5 + ($goals * 0.3) + ($assists * 0.2) + ($motm * 0.4) + ($cleanSheets * 0.15);
                $rating = min(9.8, round($rawRating, 1));
            } else {
                $rating = 0.0;
            }

            $user->stat_matches = $matches;
            $user->stat_goals = $goals;
            $user->stat_assists = $assists;
            $user->stat_rating = $rating;
            $user->stat_clean_sheets = $cleanSheets;

            if ($effectiveTeam && empty($user->club_name)) {
                $user->club_name = $effectiveTeam;
            }

            $user->save();
            $updatedUsers[$user->id] = [
                'user'          => $user,
                'team'          => $effectiveTeam,
                'goals'         => $goals,
                'assists'       => $assists,
                'rating'        => $rating,
                'clean_sheets'  => $cleanSheets,
                'is_def_or_gk'  => $isDefOrGk,
            ];
        }

        // 6. Populate 'performances' table
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            Schema::disableForeignKeyConstraints();
        }
        DB::table('performances')->delete();

        // Group players by normalized team name
        $playersByTeam = [];
        foreach ($updatedUsers as $uId => $pData) {
            $t = $pData['team'];
            if ($t) {
                $playersByTeam[$t][] = $pData;
            }
        }

        $perfInserts = [];
        $now = now();

        foreach ($matchModels as $match) {
            $hTeam = $this->normalizeTeamName($match->home_team_name ?: $match->team_a_name);
            $aTeam = $this->normalizeTeamName($match->away_team_name ?: $match->team_b_name);
            $hScore = (int)$match->home_score;
            $aScore = (int)$match->away_score;

            // Participants in this match
            $homePlayers = $playersByTeam[$hTeam] ?? [];
            $awayPlayers = $playersByTeam[$aTeam] ?? [];

            // Add Home Players
            foreach ($homePlayers as $p) {
                $user = $p['user'];
                $totalGoals = $p['goals'];
                $totalAssists = $p['assists'];
                $baseRating = $p['rating'] ?: 6.5;

                // Match specific stats
                $mGoals = 0;
                $mAssists = 0;
                if ($totalGoals > 0 && $hScore > 0) {
                    $mGoals = ($hScore >= 4) ? 2 : 1;
                    if ($mGoals > $totalGoals) $mGoals = $totalGoals;
                }
                if ($totalAssists > 0 && $hScore > 0) {
                    $mAssists = 1;
                    if ($mAssists > $totalAssists) $mAssists = $totalAssists;
                }

                $cs = ($p['is_def_or_gk'] && $aScore === 0) ? 1 : 0;

                // Match rating with realistic variation
                $mRating = $baseRating;
                if ($hScore > $aScore) $mRating += 0.3;
                elseif ($hScore < $aScore) $mRating -= 0.3;
                if ($mGoals > 0) $mRating += ($mGoals * 0.4);
                if ($cs === 1) $mRating += 0.3;
                $mRating = min(9.9, max(5.8, round($mRating, 1)));

                $perfInserts[] = [
                    'user_id'        => $user->id,
                    'match_id'       => $match->id,
                    'goals'          => $mGoals,
                    'assists'        => $mAssists,
                    'rating'         => $mRating,
                    'cleansheet'     => $cs,
                    'minutes_played' => 90,
                    'created_at'     => $match->match_date . ' ' . ($match->match_time ?: '20:00:00'),
                    'updated_at'     => $match->match_date . ' ' . ($match->match_time ?: '20:00:00'),
                ];
            }

            // Add Away Players
            foreach ($awayPlayers as $p) {
                $user = $p['user'];
                $totalGoals = $p['goals'];
                $totalAssists = $p['assists'];
                $baseRating = $p['rating'] ?: 6.5;

                $mGoals = 0;
                $mAssists = 0;
                if ($totalGoals > 0 && $aScore > 0) {
                    $mGoals = ($aScore >= 4) ? 2 : 1;
                    if ($mGoals > $totalGoals) $mGoals = $totalGoals;
                }
                if ($totalAssists > 0 && $aScore > 0) {
                    $mAssists = 1;
                    if ($mAssists > $totalAssists) $mAssists = $totalAssists;
                }

                $cs = ($p['is_def_or_gk'] && $hScore === 0) ? 1 : 0;

                $mRating = $baseRating;
                if ($aScore > $hScore) $mRating += 0.3;
                elseif ($aScore < $hScore) $mRating -= 0.3;
                if ($mGoals > 0) $mRating += ($mGoals * 0.4);
                if ($cs === 1) $mRating += 0.3;
                $mRating = min(9.9, max(5.8, round($mRating, 1)));

                $perfInserts[] = [
                    'user_id'        => $user->id,
                    'match_id'       => $match->id,
                    'goals'          => $mGoals,
                    'assists'        => $mAssists,
                    'rating'         => $mRating,
                    'cleansheet'     => $cs,
                    'minutes_played' => 90,
                    'created_at'     => $match->match_date . ' ' . ($match->match_time ?: '20:00:00'),
                    'updated_at'     => $match->match_date . ' ' . ($match->match_time ?: '20:00:00'),
                ];
            }
        }

        // Bulk insert performances in chunks of 500
        foreach (array_chunk($perfInserts, 500) as $chunk) {
            DB::table('performances')->insert($chunk);
        }
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            Schema::enableForeignKeyConstraints();
        }

        $this->command?->info("Successfully updated statistics for " . count($updatedUsers) . " players and seeded " . count($perfInserts) . " match performances across 50 matches!");
    }

    private function parseSheetStats(string $xmlContent, array $strings, array &$playerStats, array $columnSets): void
    {
        $sXml = simplexml_load_string($xmlContent);
        if (!$sXml || !isset($sXml->sheetData->row)) {
            return;
        }

        foreach ($sXml->sheetData->row as $row) {
            $rNum = (int)$row['r'];
            if ($rNum <= 1) continue;

            $cells = [];
            foreach ($row->c as $c) {
                $ref = (string)$c['r'];
                $col = preg_replace('/[0-9]/', '', $ref);
                $val = (string)$c->v;
                if ((string)$c['t'] === 's' && isset($strings[(int)$val])) {
                    $val = $strings[(int)$val];
                }
                $cells[$col] = $val;
            }

            foreach ($columnSets as $set) {
                [$tCol, $nCol, $vCol, $gCol, $aCol, $mCol] = $set;
                $vid = $cells[$vCol] ?? null;
                $team = $cells[$tCol] ?? null;
                $g = $this->parseNumber($cells[$gCol] ?? null);
                $a = $this->parseNumber($cells[$aCol] ?? null);
                $m = $this->parseNumber($cells[$mCol] ?? null);

                if ($vid && stripos($vid, 'VELLAR') !== false && stripos($vid, 'ID') === false) {
                    $cleanVid = $this->cleanVellarId($vid);
                    if (!isset($playerStats[$cleanVid])) {
                        $playerStats[$cleanVid] = ['goals' => 0, 'assists' => 0, 'motm' => 0, 'team' => null];
                    }
                    $playerStats[$cleanVid]['goals'] = max($playerStats[$cleanVid]['goals'], $g);
                    $playerStats[$cleanVid]['assists'] = max($playerStats[$cleanVid]['assists'], $a);
                    $playerStats[$cleanVid]['motm'] = max($playerStats[$cleanVid]['motm'], $m);
                    if ($team && empty($playerStats[$cleanVid]['team'])) {
                        $playerStats[$cleanVid]['team'] = trim($team);
                    }
                }
            }
        }
    }

    private function cleanVellarId(?string $vid): string
    {
        if (!$vid) return '';
        return strtoupper(preg_replace('/\s+/', ' ', trim($vid)));
    }

    private function parseNumber($val): int
    {
        if ($val === null || $val === '') return 0;
        return (int)round((float)$val);
    }

    public function normalizeTeamName(?string $name): string
    {
        if (!$name) return '';
        $n = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $name));
        if (str_contains($n, 'HFRENZ')) return 'HFRENZ FC';
        if (str_contains($n, 'KODOI')) return 'KODOI FC';
        if (str_contains($n, 'ALLIANZ')) return 'DER ALLIANZ FC';
        if (str_contains($n, 'FCFT') || str_contains($n, 'FCFC') || str_contains($n, 'FIEZTA')) return 'FCFT';
        if (str_contains($n, 'BRG') || str_contains($n, 'BROSGANG')) return 'BRG FC';
        if (str_contains($n, 'KOMU') || str_contains($n, 'KXU') || str_contains($n, 'USRA')) return 'KOMUXUSRA';
        if (str_contains($n, 'BOSS')) return 'BOSS SC';
        if (str_contains($n, 'AMIGO') || str_contains($n, 'AIMGOS')) return 'AMIGOS FC';
        if (str_contains($n, 'MAKKAH')) return 'MAKKAH FC';
        if (str_contains($n, 'ZNR') || str_contains($n, 'ZR')) return 'ZNR FT';
        if (str_contains($n, 'SEMUT')) return 'SEMUT MERAH FC';
        if (str_contains($n, 'LEGACY') || str_contains($n, 'LGCY') || str_contains($n, 'LFGCY')) return 'LEGACY FC';
        if (str_contains($n, 'Z5') || str_contains($n, 'X5')) return 'Z.5 FC';
        if (str_contains($n, 'PRIME')) return 'PRIME UNITED';
        if (str_contains($n, 'VVS')) return 'VVS1';
        if (str_contains($n, 'PUTRA') || $n === 'PG') return 'PUTRA GATHERS';
        if (str_contains($n, 'FENOMENO')) return 'FENOMENO VFC';
        if (str_contains($n, 'FOURTEEN')) return 'FOURTEEN & CO FC';
        if (str_contains($n, 'MAULANA')) return 'MAULANA';
        if (str_contains($n, 'LOYAL')) return 'LOYAL TROOPERS';
        return strtoupper(trim($name));
    }

    private function getMatchesForTeam(?string $team): int
    {
        if (!$team) return 0;
        $norm = $this->normalizeTeamName($team);

        if (in_array($norm, ['HFRENZ FC', 'KODOI FC', 'DER ALLIANZ FC', 'FCFT'])) {
            return 5;
        }
        if (in_array($norm, ['FENOMENO VFC', 'FOURTEEN & CO FC', 'MAULANA', 'LOYAL TROOPERS'])) {
            return 4;
        }
        if (in_array($norm, ['KOMUXUSRA', 'AMIGOS FC', 'BOSS SC', 'BRG FC', 'MAKKAH FC', 'ZNR FT', 'SEMUT MERAH FC', 'LEGACY FC', 'Z.5 FC', 'PRIME UNITED', 'VVS1', 'PUTRA GATHERS'])) {
            return 6;
        }

        return 0;
    }

    private function getTeamCleanSheets(?string $team): int
    {
        if (!$team) return 0;
        $norm = $this->normalizeTeamName($team);

        $teamCleanSheets = [
            'HFRENZ FC'         => 3,
            'FCFT'              => 3,
            'DER ALLIANZ FC'    => 1,
            'KODOI FC'          => 0,
            'BRG FC'            => 1,
            'BOSS SC'           => 2,
            'KOMUXUSRA'         => 1,
            'AMIGOS FC'         => 0,
            'MAKKAH FC'         => 2,
            'ZNR FT'            => 2,
            'LEGACY FC'         => 1,
            'SEMUT MERAH FC'    => 1,
            'PRIME UNITED'      => 1,
            'Z.5 FC'            => 2,
            'PUTRA GATHERS'     => 1,
            'VVS1'              => 0,
            'LOYAL TROOPERS'    => 3,
            'FENOMENO VFC'      => 1,
            'FOURTEEN & CO FC'  => 0,
            'MAULANA'           => 0,
        ];

        return $teamCleanSheets[$norm] ?? 0;
    }

    private function isDefenderOrGoalkeeper(?string $pos): bool
    {
        if (!$pos) return false;
        $p = strtoupper($pos);

        foreach (['GOALKEEPER', 'PENJAGA GOL', 'KEEPER', 'GOAL KEEPER', 'DEFENDER', 'PERTAHANAN', 'GELANDANG BERTAHAN', 'DEFENCE', 'CENTER BACK', 'LEFT BACK', 'RIGHT BACK', 'SWEEPER'] as $kw) {
            if (str_contains($p, $kw)) return true;
        }

        preg_match_all('/[A-Z]+/', $p, $matches);
        $tokens = array_flip($matches[0] ?? []);
        foreach (['GK', 'CB', 'LB', 'RB', 'DF', 'DMF', 'DMC', 'CDM', 'BEK', 'RWB', 'LWB'] as $tok) {
            if (isset($tokens[$tok])) return true;
        }

        return false;
    }
}
