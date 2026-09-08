<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\FootballMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TournamentController extends Controller
{
    /**
     * List all tournaments (Public & Authenticated)
     */
    public function index()
    {
        $tournaments = Tournament::withCount(['teams', 'matches'])
            ->with(['organizer:id,name,avatar'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                return [
                    'id'          => $t->id,
                    'name'        => $t->name,
                    'slug'        => $t->slug,
                    'description' => $t->description,
                    'format'      => $t->format,
                    'season'      => $t->season,
                    'venue'       => $t->venue,
                    'banner'      => $t->banner,
                    'status'      => $t->status,
                    'teams_count' => $t->teams_count,
                    'matches_count' => $t->matches_count,
                    'organizer'   => $t->organizer ? [
                        'name'   => $t->organizer->name,
                        'avatar' => $t->organizer->avatar,
                    ] : null,
                ];
            });

        return response()->json($tournaments);
    }

    /**
     * Get tournament details, teams, gameweek fixtures, and auto standings
     */
    public function show(Request $request, $id)
    {
        $tournament = Tournament::with(['teams', 'organizer:id,name,avatar'])->find($id);

        if (!$tournament) {
            // Check if queried by slug
            $tournament = Tournament::with(['teams', 'organizer:id,name,avatar'])->where('slug', $id)->first();
        }

        if (!$tournament) {
            return response()->json(['message' => 'Tournament not found'], 404);
        }

        // Check ownership
        $user = auth('sanctum')->user();
        $isOrganizer = $user && ($user->id === $tournament->organizer_id || $user->role === 'admin');

        // Fetch matches grouped by gameweek
        $matches = FootballMatch::where('tournament_id', $tournament->id)
            ->orderBy('match_date', 'asc')
            ->orderBy('match_time', 'asc')
            ->get();

        $gameweeks = [];
        foreach ($matches as $m) {
            $gw = $m->gameweek ?: 'General Fixtures';
            if (!isset($gameweeks[$gw])) {
                $gameweeks[$gw] = [];
            }
            $gameweeks[$gw][] = [
                'id'              => $m->id,
                'gameweek'        => $m->gameweek,
                'home_team_id'    => $m->home_team_id,
                'away_team_id'    => $m->away_team_id,
                'home_team_name'  => $m->home_team_name ?: ($m->homeTeam->name ?? 'Team A'),
                'away_team_name'  => $m->away_team_name ?: ($m->awayTeam->name ?? 'Team B'),
                'home_score'      => $m->home_score,
                'away_score'      => $m->away_score,
                'match_date'      => $m->match_date,
                'match_time'      => $m->match_time,
                'venue'           => $m->venue,
                'status'          => $m->status,
            ];
        }

        // Calculate automated standings
        $standings = $this->calculateStandings($tournament->id, $tournament->teams, $matches);

        return response()->json([
            'tournament'   => $tournament,
            'teams'        => $tournament->teams,
            'gameweeks'    => $gameweeks,
            'standings'    => $standings,
            'is_organizer' => $isOrganizer,
        ]);
    }

    /**
     * Create a new tournament (Organizer only)
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['club_owner', 'community_admin', 'admin'])) {
            return response()->json(['message' => 'Only organizers can create tournaments.'], 403);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'format'      => 'required|string|in:league,knockout,group_knockout',
            'season'      => 'nullable|string|max:100',
            'venue'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'banner'      => 'nullable|image|max:3072',
        ]);

        $bannerPath = null;
        if ($request->hasFile('banner')) {
            $path = $request->file('banner')->store('tournaments', 'public');
            $bannerPath = '/storage/' . $path;
        }

        $tournament = Tournament::create([
            'organizer_id' => $user->id,
            'name'         => $validated['name'],
            'slug'         => Str::slug($validated['name']) . '-' . Str::random(5),
            'format'       => $validated['format'],
            'season'       => $validated['season'] ?? date('Y'),
            'venue'        => $validated['venue'],
            'description'  => $validated['description'] ?? null,
            'banner'       => $bannerPath,
            'status'       => 'active',
        ]);

        return response()->json([
            'message'    => 'Tournament created successfully!',
            'tournament' => $tournament,
        ], 201);
    }

    /**
     * Add team to tournament
     */
    public function addTeam(Request $request, $tournamentId)
    {
        $tournament = Tournament::findOrFail($tournamentId);
        $user = $request->user();

        if ($tournament->organizer_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'group_name' => 'nullable|string|max:50',
            'logo'       => 'nullable|image|max:2048',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('teams', 'public');
            $logoPath = '/storage/' . $path;
        }

        $team = TournamentTeam::create([
            'tournament_id' => $tournament->id,
            'name'          => $validated['name'],
            'group_name'    => $validated['group_name'] ?? null,
            'logo'          => $logoPath,
        ]);

        return response()->json([
            'message' => 'Team added successfully',
            'team'    => $team,
        ], 201);
    }

    /**
     * Delete team from tournament
     */
    public function deleteTeam(Request $request, $tournamentId, $teamId)
    {
        $tournament = Tournament::findOrFail($tournamentId);
        $user = $request->user();

        if ($tournament->organizer_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $team = TournamentTeam::where('tournament_id', $tournamentId)->where('id', $teamId)->firstOrFail();
        $team->delete();

        return response()->json(['message' => 'Team deleted successfully']);
    }

    /**
     * Create fixture in a tournament gameweek
     */
    public function createFixture(Request $request, $tournamentId)
    {
        $tournament = Tournament::findOrFail($tournamentId);
        $user = $request->user();

        if ($tournament->organizer_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'gameweek'        => 'required|string|max:100',
            'home_team_id'    => 'nullable|exists:tournament_teams,id',
            'away_team_id'    => 'nullable|exists:tournament_teams,id',
            'home_team_name'  => 'required|string|max:255',
            'away_team_name'  => 'required|string|max:255',
            'match_date'      => 'required|date',
            'match_time'      => 'required',
            'venue'           => 'nullable|string|max:255',
        ]);

        $match = FootballMatch::create([
            'tournament_id'   => $tournament->id,
            'club_owner_id'   => $user->id,
            'gameweek'        => $validated['gameweek'],
            'home_team_id'    => $validated['home_team_id'] ?? null,
            'away_team_id'    => $validated['away_team_id'] ?? null,
            'home_team_name'  => $validated['home_team_name'],
            'away_team_name'  => $validated['away_team_name'],
            'team_a_name'     => $validated['home_team_name'],
            'team_b_name'     => $validated['away_team_name'],
            'match_date'      => $validated['match_date'],
            'match_time'      => $validated['match_time'],
            'venue'           => $validated['venue'] ?? $tournament->venue,
            'status'          => 'scheduled',
        ]);

        return response()->json([
            'message' => 'Fixture added successfully',
            'match'   => $match,
        ], 201);
    }

    /**
     * Update match score (Quick score entry)
     */
    public function updateScore(Request $request, $matchId)
    {
        $match = FootballMatch::findOrFail($matchId);
        $user = $request->user();

        $tournament = $match->tournament;
        if ($tournament && $tournament->organizer_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'home_score' => 'required|integer|min:0',
            'away_score' => 'required|integer|min:0',
            'status'     => 'nullable|string|in:scheduled,live,completed,postponed',
        ]);

        $match->update([
            'home_score' => $validated['home_score'],
            'away_score' => $validated['away_score'],
            'status'     => $validated['status'] ?? 'completed',
        ]);

        return response()->json([
            'message' => 'Match score updated!',
            'match'   => $match,
        ]);
    }

    /**
     * Delete fixture
     */
    public function deleteFixture(Request $request, $matchId)
    {
        $match = FootballMatch::findOrFail($matchId);
        $user = $request->user();

        $tournament = $match->tournament;
        if ($tournament && $tournament->organizer_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $match->delete();
        return response()->json(['message' => 'Fixture deleted successfully']);
    }

    /**
     * Helper: Calculate real-time automated standings from completed matches
     */
    protected function calculateStandings($tournamentId, $teams, $matches)
    {
        $table = [];

        // Initialize table for each team
        foreach ($teams as $t) {
            $table[$t->name] = [
                'team_id' => $t->id,
                'name'    => $t->name,
                'logo'    => $t->logo,
                'group'   => $t->group_name,
                'played'  => 0,
                'won'     => 0,
                'drawn'   => 0,
                'lost'    => 0,
                'gf'      => 0, // Goals For
                'ga'      => 0, // Goals Against
                'gd'      => 0, // Goal Difference
                'points'  => 0, // PTS
            ];
        }

        // Process each completed match
        foreach ($matches as $m) {
            if ($m->home_score !== null && $m->away_score !== null) {
                $hName = $m->home_team_name ?: ($m->homeTeam->name ?? null);
                $aName = $m->away_team_name ?: ($m->awayTeam->name ?? null);

                if ($hName && !isset($table[$hName])) {
                    $table[$hName] = [
                        'team_id' => $m->home_team_id,
                        'name'    => $hName,
                        'logo'    => null,
                        'group'   => null,
                        'played'  => 0, 'won' => 0, 'drawn' => 0, 'lost' => 0,
                        'gf' => 0, 'ga' => 0, 'gd' => 0, 'points' => 0
                    ];
                }

                if ($aName && !isset($table[$aName])) {
                    $table[$aName] = [
                        'team_id' => $m->away_team_id,
                        'name'    => $aName,
                        'logo'    => null,
                        'group'   => null,
                        'played'  => 0, 'won' => 0, 'drawn' => 0, 'lost' => 0,
                        'gf' => 0, 'ga' => 0, 'gd' => 0, 'points' => 0
                    ];
                }

                if ($hName && $aName) {
                    $table[$hName]['played']++;
                    $table[$aName]['played']++;

                    $table[$hName]['gf'] += $m->home_score;
                    $table[$hName]['ga'] += $m->away_score;
                    $table[$aName]['gf'] += $m->away_score;
                    $table[$aName]['ga'] += $m->home_score;

                    if ($m->home_score > $m->away_score) {
                        $table[$hName]['won']++;
                        $table[$hName]['points'] += 3;
                        $table[$aName]['lost']++;
                    } elseif ($m->home_score < $m->away_score) {
                        $table[$aName]['won']++;
                        $table[$aName]['points'] += 3;
                        $table[$hName]['lost']++;
                    } else {
                        $table[$hName]['drawn']++;
                        $table[$hName]['points'] += 1;
                        $table[$aName]['drawn']++;
                        $table[$aName]['points'] += 1;
                    }
                }
            }
        }

        // Calculate GD & rank
        $standingsList = array_values($table);
        foreach ($standingsList as &$row) {
            $row['gd'] = $row['gf'] - $row['ga'];
        }

        // Sort by Points DESC, GD DESC, GF DESC, Name ASC
        usort($standingsList, function ($a, $b) {
            if ($b['points'] !== $a['points']) {
                return $b['points'] <=> $a['points'];
            }
            if ($b['gd'] !== $a['gd']) {
                return $b['gd'] <=> $a['gd'];
            }
            if ($b['gf'] !== $a['gf']) {
                return $b['gf'] <=> $a['gf'];
            }
            return strcmp($a['name'], $b['name']);
        });

        // Add position number (1-indexed)
        foreach ($standingsList as $idx => &$row) {
            $row['position'] = $idx + 1;
        }

        return $standingsList;
    }
}
