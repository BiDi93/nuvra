<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\FootballMatch;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TournamentMasterbaseSeeder extends Seeder
{
    public function run(): void
    {
        $organizer = User::firstOrCreate(
            ['email' => 'admin@vellarleague.com'],
            [
                'name' => 'Vellar League Admin',
                'password' => Hash::make('password'),
                'role' => 'club_owner',
                'club_name' => 'Vellar League Official',
                'location' => 'Bangi, Selangor',
            ]
        );

        // 1. Tournaments
        $tournaments = [
            'Semenyih' => Tournament::updateOrCreate(
                ['slug' => 'vellar-league-semenyih'],
                [
                    'organizer_id' => $organizer->id,
                    'name'         => 'Vellar League Semenyih',
                    'description'  => 'Official FAS Affiliate Tournament - Semenyih Division',
                    'format'       => 'league',
                    'season'       => 'Season 1 (2026)',
                    'venue'        => 'Semenyih Sports Arena',
                    'status'       => 'active',
                ]
            ),
            'Serdang' => Tournament::updateOrCreate(
                ['slug' => 'vellar-league-serdang-30an'],
                [
                    'organizer_id' => $organizer->id,
                    'name'         => 'Vellar League Serdang 30AN',
                    'description'  => 'Official FAS Affiliate Tournament - Serdang Veteran 30AN',
                    'format'       => 'league',
                    'season'       => 'Season 1 (2026)',
                    'venue'        => 'Serdang Sports Complex',
                    'status'       => 'active',
                ]
            ),
            'Bangi' => Tournament::updateOrCreate(
                ['slug' => 'vellar-league-bangi'],
                [
                    'organizer_id' => $organizer->id,
                    'name'         => 'Vellar League Bangi',
                    'description'  => 'Official FAS Affiliate Tournament - Bangi Division',
                    'format'       => 'league',
                    'season'       => 'Season 1 (2026)',
                    'venue'        => 'Uptown Sports Bangi',
                    'status'       => 'active',
                ]
            ),
        ];

        // 2. Teams
        $semenyihTeams = ['HFRENZ FC', 'KODOI FC', 'FCFT', 'DER ALLIANZ FC'];
        $semTeamMap = [];
        foreach ($semenyihTeams as $name) {
            $semTeamMap[$name] = TournamentTeam::firstOrCreate([
                'tournament_id' => $tournaments['Semenyih']->id,
                'name'          => $name,
            ]);
        }

        $serdangTeams = ['MAULANA', 'FOURTEEN & CO FC', 'LOYAL TROOPERS', 'FENOMENO VFC'];
        $serTeamMap = [];
        foreach ($serdangTeams as $name) {
            $serTeamMap[$name] = TournamentTeam::firstOrCreate([
                'tournament_id' => $tournaments['Serdang']->id,
                'name'          => $name,
            ]);
        }

        $bangiTeams = ['BRG FC', 'KOMUXUSRA', 'BOSS SC', 'AMIGOS FC', 'NUVRA BLUES', 'VALIANT FC'];
        $banTeamMap = [];
        foreach ($bangiTeams as $name) {
            $banTeamMap[$name] = TournamentTeam::firstOrCreate([
                'tournament_id' => $tournaments['Bangi']->id,
                'name'          => $name,
            ]);
        }

        // 3. Semenyih Fixtures
        $semFixtures = [
            ['Matchweek 1', 'HFRENZ FC', 'KODOI FC', 5, 0, '2026-07-20', '20:00:00', 'Padang A', 'completed'],
            ['Matchweek 1', 'FCFT', 'DER ALLIANZ FC', 7, 0, '2026-07-20', '21:15:00', 'Padang A', 'completed'],
            ['Matchweek 2', 'KODOI FC', 'DER ALLIANZ FC', 0, 2, '2026-07-27', '20:00:00', 'Padang A', 'completed'],
            ['Matchweek 2', 'FCFT', 'HFRENZ FC', 4, 0, '2026-07-27', '21:15:00', 'Padang A', 'completed'],
            ['Matchweek 3', 'HFRENZ FC', 'DER ALLIANZ FC', 3, 0, '2026-08-03', '20:00:00', 'Padang A', 'completed'],
            ['Matchweek 3', 'FCFT', 'KODOI FC', 4, 0, '2026-08-03', '21:15:00', 'Padang A', 'completed'],
            ['Matchweek 4', 'KODOI FC', 'HFRENZ FC', 0, 1, '2026-08-10', '20:00:00', 'Padang A', 'completed'],
            ['Matchweek 4', 'DER ALLIANZ FC', 'FCFT', 1, 8, '2026-08-10', '21:15:00', 'Padang A', 'completed'],
            ['Matchweek 5', 'HFRENZ FC', 'FCFT', 4, 2, '2026-08-17', '20:00:00', 'Padang A', 'completed'],
            ['Matchweek 5', 'DER ALLIANZ FC', 'KODOI FC', null, null, '2026-08-17', '21:15:00', 'Padang A', 'scheduled'],
            ['Matchweek 6', 'DER ALLIANZ FC', 'HFRENZ FC', null, null, '2026-08-24', '20:00:00', 'Padang A', 'scheduled'],
            ['Matchweek 6', 'KODOI FC', 'FCFT', null, null, '2026-08-24', '21:15:00', 'Padang A', 'scheduled'],
        ];

        foreach ($semFixtures as $f) {
            FootballMatch::updateOrCreate(
                [
                    'tournament_id'   => $tournaments['Semenyih']->id,
                    'gameweek'        => $f[0],
                    'home_team_name'  => $f[1],
                    'away_team_name'  => $f[2],
                ],
                [
                    'club_owner_id'   => $organizer->id,
                    'home_team_id'    => $semTeamMap[$f[1]]->id ?? null,
                    'away_team_id'    => $semTeamMap[$f[2]]->id ?? null,
                    'team_a_name'     => $f[1],
                    'team_b_name'     => $f[2],
                    'home_score'      => $f[3],
                    'away_score'      => $f[4],
                    'match_date'      => $f[5],
                    'match_time'      => $f[6],
                    'venue'           => $f[7],
                    'status'          => $f[8],
                ]
            );
        }

        // 4. Serdang Fixtures
        $serFixtures = [
            ['Matchweek 1', 'MAULANA', 'FOURTEEN & CO FC', 1, 4, '2026-07-21', '20:00:00', 'Pitch 1', 'completed'],
            ['Matchweek 1', 'FENOMENO VFC', 'LOYAL TROOPERS', 0, 5, '2026-07-21', '21:15:00', 'Pitch 1', 'completed'],
            ['Matchweek 2', 'FOURTEEN & CO FC', 'LOYAL TROOPERS', 0, 2, '2026-07-28', '20:00:00', 'Pitch 1', 'completed'],
            ['Matchweek 2', 'MAULANA', 'FENOMENO VFC', 0, 9, '2026-07-28', '21:15:00', 'Pitch 1', 'completed'],
            ['Matchweek 3', 'LOYAL TROOPERS', 'MAULANA', 8, 0, '2026-08-04', '20:00:00', 'Pitch 1', 'completed'],
            ['Matchweek 3', 'FENOMENO VFC', 'FOURTEEN & CO FC', 1, 2, '2026-08-04', '21:15:00', 'Pitch 1', 'completed'],
            ['Matchweek 4', 'LOYAL TROOPERS', 'FENOMENO VFC', 5, 1, '2026-08-11', '20:00:00', 'Pitch 1', 'completed'],
            ['Matchweek 4', 'FOURTEEN & CO FC', 'MAULANA', 5, 2, '2026-08-11', '21:15:00', 'Pitch 1', 'completed'],
            ['Matchweek 5', 'LOYAL TROOPERS', 'FOURTEEN & CO FC', null, null, '2026-08-18', '20:00:00', 'Pitch 1', 'scheduled'],
            ['Matchweek 5', 'FENOMENO VFC', 'MAULANA', null, null, '2026-08-18', '21:15:00', 'Pitch 1', 'scheduled'],
        ];

        foreach ($serFixtures as $f) {
            FootballMatch::updateOrCreate(
                [
                    'tournament_id'   => $tournaments['Serdang']->id,
                    'gameweek'        => $f[0],
                    'home_team_name'  => $f[1],
                    'away_team_name'  => $f[2],
                ],
                [
                    'club_owner_id'   => $organizer->id,
                    'home_team_id'    => $serTeamMap[$f[1]]->id ?? null,
                    'away_team_id'    => $serTeamMap[$f[2]]->id ?? null,
                    'team_a_name'     => $f[1],
                    'team_b_name'     => $f[2],
                    'home_score'      => $f[3],
                    'away_score'      => $f[4],
                    'match_date'      => $f[5],
                    'match_time'      => $f[6],
                    'venue'           => $f[7],
                    'status'          => $f[8],
                ]
            );
        }

        // 5. Bangi Fixtures
        $banFixtures = [
            ['Matchweek 1', 'BRG FC', 'KOMUXUSRA', 3, 2, '2026-07-22', '20:30:00', 'Court 1', 'completed'],
            ['Matchweek 1', 'BOSS SC', 'AMIGOS FC', 4, 1, '2026-07-22', '21:45:00', 'Court 1', 'completed'],
            ['Matchweek 1', 'NUVRA BLUES', 'VALIANT FC', 2, 2, '2026-07-23', '20:30:00', 'Court 2', 'completed'],
            ['Matchweek 2', 'KOMUXUSRA', 'BOSS SC', 2, 1, '2026-07-29', '20:30:00', 'Court 1', 'completed'],
            ['Matchweek 2', 'BRG FC', 'VALIANT FC', 5, 0, '2026-07-29', '21:45:00', 'Court 1', 'completed'],
            ['Matchweek 2', 'AMIGOS FC', 'NUVRA BLUES', 1, 3, '2026-07-30', '20:30:00', 'Court 2', 'completed'],
            ['Matchweek 3', 'BOSS SC', 'BRG FC', null, null, '2026-08-05', '20:30:00', 'Court 1', 'scheduled'],
            ['Matchweek 3', 'VALIANT FC', 'AMIGOS FC', null, null, '2026-08-05', '21:45:00', 'Court 1', 'scheduled'],
            ['Matchweek 3', 'KOMUXUSRA', 'NUVRA BLUES', null, null, '2026-08-06', '20:30:00', 'Court 2', 'scheduled'],
        ];

        foreach ($banFixtures as $f) {
            FootballMatch::updateOrCreate(
                [
                    'tournament_id'   => $tournaments['Bangi']->id,
                    'gameweek'        => $f[0],
                    'home_team_name'  => $f[1],
                    'away_team_name'  => $f[2],
                ],
                [
                    'club_owner_id'   => $organizer->id,
                    'home_team_id'    => $banTeamMap[$f[1]]->id ?? null,
                    'away_team_id'    => $banTeamMap[$f[2]]->id ?? null,
                    'team_a_name'     => $f[1],
                    'team_b_name'     => $f[2],
                    'home_score'      => $f[3],
                    'away_score'      => $f[4],
                    'match_date'      => $f[5],
                    'match_time'      => $f[6],
                    'venue'           => $f[7],
                    'status'          => $f[8],
                ]
            );
        }

        // 6. Masterbase Players Import from Excel
        $excelPath = base_path('MASTERBASE VELLAR ID S1.xlsx');
        if (file_exists($excelPath) && class_exists('ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($excelPath) === true) {
                // Shared strings
                $strings = [];
                $ssXml = $zip->getFromName('xl/sharedStrings.xml');
                if ($ssXml) {
                    $xml = simplexml_load_string($ssXml);
                    foreach ($xml->si as $si) {
                        $strings[] = (string)($si->t ?? '');
                    }
                }

                // Sheet 1: Masterbase Players
                $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
                if ($sheetXml) {
                    $sXml = simplexml_load_string($sheetXml);
                    $defaultPwd = Hash::make('password');
                    $batchUsers = [];

                    foreach ($sXml->sheetData->row as $row) {
                        $rNum = (int)$row['r'];
                        if ($rNum <= 1) continue; // skip header

                        $cells = [];
                        foreach ($row->c as $c) {
                            $r = (string)$c['r'];
                            $col = preg_replace('/[0-9]/', '', $r);
                            $val = (string)$c->v;
                            if ((string)$c['t'] === 's' && isset($strings[(int)$val])) {
                                $val = $strings[(int)$val];
                            }
                            $cells[$col] = $val;
                        }

                        $vellarId = trim($cells['A'] ?? '');
                        $name = trim($cells['B'] ?? '');
                        $phone = trim($cells['C'] ?? '');
                        $pos = trim($cells['E'] ?? '');
                        $team = trim($cells['F'] ?? '');

                        if ($vellarId && $name) {
                            $cleanVid = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $vellarId));
                            $email = "{$cleanVid}@vellarleague.com";

                            User::firstOrCreate(
                                ['email' => $email],
                                [
                                    'name'       => $name,
                                    'password'   => $defaultPwd,
                                    'role'       => 'player',
                                    'vellar_id'  => $vellarId,
                                    'position'   => $pos,
                                    'phone'      => $phone,
                                    'club_name'  => $team,
                                ]
                            );
                        }
                    }
                }
                $zip->close();
            }
        }
    }
}
