<?php

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Models\MatchPlayer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Notifications\BookingStatusUpdated;

class CommunityGameController extends Controller
{
    // Record player performances for a completed match (Admin / Match Organizer only)
    public function recordPerformances(Request $request, $id)
    {
        $match = FootballMatch::find($id);
        if (!$match) return response()->json(['message' => 'Match not found'], 404);

        $me = $request->user();
        if ((int) $match->organizer_id !== (int) $me->id && $me->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'performances'                  => 'required|array',
            'performances.*.user_id'        => 'required|integer|exists:users,id',
            'performances.*.goals'          => 'required|integer|min:0',
            'performances.*.assists'        => 'required|integer|min:0',
            'performances.*.rating'         => 'required|numeric|min:0|max:10',
            'performances.*.cleansheet'     => 'required|boolean',
            'performances.*.minutes_played' => 'required|integer|min:0',
        ]);

        foreach ($request->performances as $p) {
            DB::table('performances')->updateOrInsert(
                ['user_id' => $p['user_id'], 'match_id' => $id],
                [
                    'goals'          => $p['goals'],
                    'assists'        => $p['assists'],
                    'rating'         => $p['rating'],
                    'cleansheet'     => $p['cleansheet'],
                    'minutes_played' => $p['minutes_played'],
                    'updated_at'     => now(),
                    'created_at'     => now(),
                ]
            );
        }

        return response()->json(['message' => 'Performances saved successfully']);
    }

    // List all community members
    public function members()
    {
        $users = User::select(
            'id', 'name', 'avatar', 'club_logo', 'role', 'created_at',
            'vellar_id', 'position', 'club_name',
            'stat_matches', 'stat_goals', 'stat_assists', 'stat_rating', 'stat_clean_sheets'
        )
            ->orderBy('id', 'asc')
            ->get()
            ->map(function($user) {
                // If manual/admin stats are not set, fallback to performances table
                if ($user->stat_matches === null) {
                    $stats = DB::table('performances')
                        ->where('user_id', $user->id)
                        ->selectRaw('COUNT(id) as total_games, SUM(goals) as goals, SUM(assists) as assists, AVG(rating) as avg_rating')
                        ->first();
                    $games = (int)($stats->total_games ?? 0);
                    $goals = (int)($stats->goals ?? 0);
                    $assists = (int)($stats->assists ?? 0);
                    $rating = round((float)($stats->avg_rating ?? 0), 1);
                } else {
                    $games = (int)$user->stat_matches;
                    $goals = (int)($user->stat_goals ?? 0);
                    $assists = (int)($user->stat_assists ?? 0);
                    $rating = round((float)($user->stat_rating ?? 0), 1);
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'club_logo' => $user->club_logo,
                    'role' => $user->role,
                    'vellar_id' => $user->vellar_id,
                    'position' => $user->position,
                    'club_name' => $user->club_name,
                    'joined' => $user->created_at ? $user->created_at->format('M Y') : 'N/A',
                    'games' => $games,
                    'goals' => $goals,
                    'assists' => $assists,
                    'rating' => $rating,
                ];
            });

        return response()->json($users);
    }

    // Get Public Profile of another player
    public function memberProfile($id)
    {
        $user = User::find($id);
        if (!$user) return response()->json(['message' => 'User not found'], 404);

        $stats = DB::table('performances')
            ->where('user_id', $user->id)
            ->selectRaw('COUNT(match_id) as total_matches, SUM(goals) as total_goals, SUM(assists) as total_assists, AVG(rating) as avg_rating, SUM(cleansheet) as total_cleansheets')
            ->first();

        $totalMatches = $user->stat_matches !== null ? (int)$user->stat_matches : (int)($stats->total_matches ?? 0);
        $totalGoals = $user->stat_goals !== null ? (int)$user->stat_goals : (int)($stats->total_goals ?? 0);
        $totalAssists = $user->stat_assists !== null ? (int)$user->stat_assists : (int)($stats->total_assists ?? 0);
        $avgRating = $user->stat_rating !== null ? round((float)$user->stat_rating, 1) : round((float)($stats->avg_rating ?? 0), 1);
        $cleanSheets = $user->stat_clean_sheets !== null ? (int)$user->stat_clean_sheets : (int)($stats->total_cleansheets ?? 0);

        $history = FootballMatch::whereHas('performances', function($pq) use ($user) {
            $pq->where('user_id', $user->id);
        })
        ->with(['performances' => function($q) use ($user) {
            $q->where('user_id', $user->id);
        }])
        ->where('match_date', '<=', now()->toDateString())
        ->orderBy('match_date', 'desc')
        ->limit(10)
        ->get()
        ->map(fn($m) => [
            'id' => $m->id,
            'title' => $m->title ?? ($m->team_a_name . ' vs ' . $m->team_b_name),
            'venue' => $m->venue,
            'date' => $m->match_date,
            'goals' => $m->performances->first()->goals ?? 0,
            'rating' => $m->performances->first()->rating ?? 0,
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'vellar_id' => $user->vellar_id,
                'position' => $user->position,
                'club_name' => $user->club_name,
                'phone' => $user->phone,
                'joined' => $user->created_at ? $user->created_at->format('M Y') : 'N/A',
                'club_logo' => $user->club_logo,
                'stat_matches' => $user->stat_matches,
                'stat_goals' => $user->stat_goals,
                'stat_assists' => $user->stat_assists,
                'stat_rating' => $user->stat_rating,
                'stat_clean_sheets' => $user->stat_clean_sheets,
            ],
            'stats' => [
                'total_matches' => $totalMatches,
                'total_goals' => $totalGoals,
                'total_assists' => $totalAssists,
                'avg_rating' => $avgRating,
                'clean_sheets' => $cleanSheets,
            ],
            'history' => $history ?? []
        ]);
    }

    // Get Personal Profile Stats
    public function getProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $data = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'club_logo' => $user->club_logo,
                'vellar_id' => $user->vellar_id,
                'position' => $user->position,
                'club_name' => $user->club_name,
            ]
        ];

        if ($user->role === 'admin') {
            $data['club'] = [
                'name' => $user->club_name ?? 'Nuvra Official',
                'established_at' => $user->established_at,
                'location' => $user->location ?? 'Unknown',
            ];
            
            $data['stats'] = [
                'total_organized' => DB::table('matches')->where('organizer_id', $user->id)->count(),
                'active_players' => DB::table('users')->where('role', 'player')->where('status', 'active')->count(),
            ];
        } else {
            $stats = DB::table('performances')
                ->where('user_id', $user->id)
                ->selectRaw('COUNT(match_id) as total_games, SUM(goals) as total_goals, SUM(assists) as total_assists, AVG(rating) as avg_rating, SUM(cleansheet) as total_cleansheets')
                ->first();

            $data['stats'] = [
                'total_matches' => $user->stat_matches !== null ? (int)$user->stat_matches : (int)($stats->total_games ?? 0),
                'total_goals'   => $user->stat_goals !== null ? (int)$user->stat_goals : (int)($stats->total_goals ?? 0),
                'total_assists' => $user->stat_assists !== null ? (int)$user->stat_assists : (int)($stats->total_assists ?? 0),
                'avg_rating'    => $user->stat_rating !== null ? round((float)$user->stat_rating, 1) : round((float)($stats->avg_rating ?? 0), 1),
                'clean_sheets'  => $user->stat_clean_sheets !== null ? (int)$user->stat_clean_sheets : (int)($stats->total_cleansheets ?? 0),
            ];

            $history = FootballMatch::whereHas('performances', function($pq) use ($user) {
                $pq->where('user_id', $user->id);
            })
            ->with(['performances' => function($q) use ($user) {
                $q->where('user_id', $user->id);
            }])
            ->where('match_date', '<=', now()->toDateString())
            ->orderBy('match_date', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($m) => [
                'id'     => $m->id,
                'title'  => $m->title ?? ($m->team_a_name . ' vs ' . $m->team_b_name),
                'venue'  => $m->venue,
                'date'   => $m->match_date,
                'goals'  => $m->performances->first()->goals ?? 0,
                'rating' => $m->performances->first()->rating ?? 0,
            ]);
            $data['history'] = $history ?? [];
        }

        return response()->json($data);
    }

    // Update User Avatar
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        $user = $request->user();
        
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => '/storage/' . $path]);
            
            return response()->json([
                'message' => 'Profile picture updated!',
                'avatar' => $user->avatar
            ]);
        }

        return response()->json(['message' => 'Upload failed'], 400);
    }

    // Update User Club Logo
    public function updateClubLogo(Request $request)
    {
        $request->validate([
            'club_logo' => 'required|image|max:2048',
        ]);

        $user = $request->user();
        
        if ($request->hasFile('club_logo')) {
            $path = $request->file('club_logo')->store('logos', 'public');
            $user->update(['club_logo' => '/storage/' . $path]);
            
            return response()->json([
                'message' => 'Club logo updated!',
                'club_logo' => $user->club_logo
            ]);
        }

        return response()->json(['message' => 'Upload failed'], 400);
    }

    // Update Player Statistics & Info (Admin only)
    public function updatePlayerStats(Request $request, $id)
    {
        $me = $request->user();
        if (!$me || $me->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $player = User::find($id);
        if (!$player) {
            return response()->json(['message' => 'Player not found.'], 404);
        }

        $validated = $request->validate([
            'total_matches'     => 'nullable|integer|min:0',
            'total_goals'       => 'nullable|integer|min:0',
            'total_assists'     => 'nullable|integer|min:0',
            'avg_rating'        => 'nullable|numeric|min:0|max:10',
            'clean_sheets'      => 'nullable|integer|min:0',
            'position'          => 'nullable|string|max:50',
            'vellar_id'         => 'nullable|string|max:50',
            'club_name'         => 'nullable|string|max:100',
        ]);

        $updateData = [];
        if (array_key_exists('total_matches', $validated)) {
            $updateData['stat_matches'] = $validated['total_matches'];
        }
        if (array_key_exists('total_goals', $validated)) {
            $updateData['stat_goals'] = $validated['total_goals'];
        }
        if (array_key_exists('total_assists', $validated)) {
            $updateData['stat_assists'] = $validated['total_assists'];
        }
        if (array_key_exists('avg_rating', $validated)) {
            $updateData['stat_rating'] = $validated['avg_rating'];
        }
        if (array_key_exists('clean_sheets', $validated)) {
            $updateData['stat_clean_sheets'] = $validated['clean_sheets'];
        }
        if (array_key_exists('position', $validated)) {
            $updateData['position'] = $validated['position'];
        }
        if (array_key_exists('vellar_id', $validated)) {
            $updateData['vellar_id'] = $validated['vellar_id'];
        }
        if (array_key_exists('club_name', $validated)) {
            $updateData['club_name'] = $validated['club_name'];
        }

        $player->update($updateData);
        $fresh = $player->fresh();

        return response()->json([
            'message' => 'Player statistics updated successfully.',
            'user' => [
                'id' => $fresh->id,
                'name' => $fresh->name,
                'avatar' => $fresh->avatar,
                'role' => $fresh->role,
                'vellar_id' => $fresh->vellar_id,
                'position' => $fresh->position,
                'club_name' => $fresh->club_name,
                'phone' => $fresh->phone,
                'joined' => $fresh->created_at ? $fresh->created_at->format('M Y') : 'N/A',
                'club_logo' => $fresh->club_logo,
                'stat_matches' => $fresh->stat_matches,
                'stat_goals' => $fresh->stat_goals,
                'stat_assists' => $fresh->stat_assists,
                'stat_rating' => $fresh->stat_rating,
                'stat_clean_sheets' => $fresh->stat_clean_sheets,
            ],
            'stats' => [
                'total_matches' => (int)($fresh->stat_matches ?? 0),
                'total_goals'   => (int)($fresh->stat_goals ?? 0),
                'total_assists' => (int)($fresh->stat_assists ?? 0),
                'avg_rating'    => round((float)($fresh->stat_rating ?? 0), 1),
                'clean_sheets'  => (int)($fresh->stat_clean_sheets ?? 0),
            ]
        ]);
    }
}
