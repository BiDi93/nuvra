<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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

        $this->command?->info("Loading player stats from: {$excelPath}");

        $zip = new \ZipArchive();
        if ($zip->open($excelPath) !== true) {
            $this->command?->error("Failed to open Excel zip archive.");
            return;
        }

        // 1. Shared Strings
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

        $playerStats = []; // [clean_vellar_id => ['goals' => int, 'assists' => int, 'motm' => int, 'team' => string]]

        // 2. Sheet 2: TEAM REGISTRATION S1
        $sheet2Xml = $zip->getFromName('xl/worksheets/sheet2.xml');
        if ($sheet2Xml) {
            $this->parseSheetStats($sheet2Xml, $strings, $playerStats, [
                ['A', 'B', 'C', 'D', 'E', 'F'],
                ['H', 'I', 'J', 'K', 'L', 'M'],
                ['O', 'P', 'Q', 'R', 'S', 'T'],
                ['V', 'W', 'X', 'Y', 'Z', 'AA'],
            ]);
        }

        // 3. Sheet 4: VELLAR LEAGUE 30AN
        $sheet4Xml = $zip->getFromName('xl/worksheets/sheet4.xml');
        if ($sheet4Xml) {
            $this->parseSheetStats($sheet4Xml, $strings, $playerStats, [
                ['A', 'B', 'C', 'D', 'E', 'F'],
                ['H', 'I', 'J', 'K', 'L', 'M'],
                ['O', 'P', 'Q', 'R', 'S', 'T'],
            ]);
        }

        $zip->close();

        // 4. Official Sheet 3 (TOP SCORER & ASSIST) season-final totals
        $sheet3Overrides = [
            'VELLAR 340' => ['goals' => 6], // Hafizan Bin Ismail (KOMUXUSRA)
            'VELLAR 102' => ['goals' => 6], // Hazrul Farhan (BRG FC)
            'VELLAR 23'  => ['goals' => 5], // Aqil Fahmi (BOSS SC)
            'VELLAR 139' => ['goals' => 4], // Muhd Faiz (BRG FC)
            'VELLAR 470' => ['assists' => 4], // Abid Absyar (BRG FC)
            'VELLAR 41'  => ['assists' => 3], // Azhad (BOSS SC)
            'VELLAR 343' => ['assists' => 3], // Solahuddin (KOMUXUSRA)
            'VELLAR 256' => ['goals' => 9], // Hamed (MAKKAH FC)
            'VELLAR 352' => ['goals' => 5], // Aniq Asyraf (ZNR FT)
            'VELLAR 231' => ['goals' => 5], // aniq asyraf (znr fc)
            'VELLAR 255' => ['goals' => 5, 'assists' => 7], // Sadeq (MAKKAH FC)
            'VELLAR 259' => ['goals' => 4], // Anas (MAKKAH FC)
            'VELLAR 230' => ['assists' => 4], // Tawab (ZNR FT)
            'VELLAR 252' => ['assists' => 3], // Adham (MAKKAH FC)
            'VELLAR 253' => ['assists' => 2], // Aiman (MAKKAH FC)
            'VELLAR 112' => ['goals' => 10, 'assists' => 1], // Qamarulzaman (Z.5 FC)
            'VELLAR 290' => ['goals' => 7], // Kiran (VVS1)
            'VELLAR 159' => ['goals' => 2], // Muhammad Izzat (PRIME UNITED)
            'VELLAR 111' => ['assists' => 5], // Asrinuralif (Z.5 FC)
            'VELLAR 157' => ['assists' => 2], // Nasrah (PRIME UNITED)
            'VELLAR 109' => ['assists' => 1], // Khaidir (Z.5 FC)
            'VELLAR 310' => ['goals' => 8, 'assists' => 2], // Adam Husaini (FCFT)
            'VELLAR 181' => ['goals' => 6, 'assists' => 2], // Hariz Muhalim (HFRENZ FC)
            'VELLAR 365' => ['goals' => 4], // Fadhil (FCFT)
            'VELLAR 456' => ['goals' => 2, 'assists' => 2], // Johan (DER ALLIANZ)
            'VELLAR 303' => ['assists' => 2], // Dinesh (HFRENZ FC)
            'VELLAR 438' => ['goals' => 7], // Black / Amirul (FOURTEEN)
            'VELLAR 414' => ['goals' => 4], // Pali / Fadli (FENOMENO VFC)
            'VELLAR 447' => ['assists' => 4], // Syazwan (FOURTEEN)
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

        // 5. Update Database Users
        $users = User::where('role', 'player')->get();
        $updatedCount = 0;

        foreach ($users as $user) {
            $cleanVid = $this->cleanVellarId($user->vellar_id);
            $st = $playerStats[$cleanVid] ?? ['goals' => 0, 'assists' => 0, 'motm' => 0, 'team' => null];

            $effectiveTeam = $st['team'] ?: $user->club_name;
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

            // Also keep team if updated in sheet
            if ($st['team'] && empty($user->club_name)) {
                $user->club_name = $st['team'];
            }

            $user->save();
            $updatedCount++;
        }

        $this->command?->info("Successfully updated statistics for {$updatedCount} players from Masterbase Excel!");
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

    private function getMatchesForTeam(?string $team): int
    {
        if (!$team) return 0;
        $t = strtoupper($team);

        // Semenyih teams (5 matches played)
        foreach (['HFRENZ', 'KODOI', 'DER ALLIANZ', 'FCFT'] as $k) {
            if (str_contains($t, $k)) return 5;
        }

        // Serdang 30AN teams (4 matches played)
        foreach (['FENOMENO', 'FOURTEEN', 'MAULANA', 'LOYAL TROOPERS'] as $k) {
            if (str_contains($t, $k)) return 4;
        }

        // Bangi, Serdang, Sepang teams (6 matches played)
        foreach (['KOMU', 'AMIGOS', 'BOSS', 'BRG', 'MAKKAH', 'ZNR', 'SEMUT MERAH', 'LEGACY', 'Z.5', 'Z5', 'PRIME', 'VVS', 'PUTRA'] as $k) {
            if (str_contains($t, $k)) return 6;
        }

        return 0;
    }

    private function getTeamCleanSheets(?string $team): int
    {
        if (!$team) return 0;
        $t = strtoupper($team);

        $teamCleanSheets = [
            'HFRENZ'         => 3,
            'FCFT'           => 3,
            'DER ALLIANZ'    => 1,
            'KODOI'          => 0,
            'BRG'            => 1,
            'BOSS'           => 2,
            'KOMU'           => 1,
            'AMIGOS'         => 0,
            'MAKKAH'         => 2,
            'ZNR'            => 2,
            'LEGACY'         => 1,
            'SEMUT MERAH'    => 1,
            'PRIME UNITED'   => 1,
            'PRIME UTD'      => 1,
            'Z.5'            => 2,
            'Z5'             => 2,
            'PUTRA'          => 1,
            'VVS'            => 0,
            'LOYAL TROOPERS' => 3,
            'FENOMENO'       => 1,
            'FOURTEEN'       => 0,
            'MAULANA'        => 0,
        ];

        foreach ($teamCleanSheets as $k => $cs) {
            if (str_contains($t, $k)) {
                return $cs;
            }
        }

        return 0;
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
