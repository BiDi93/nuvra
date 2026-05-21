<?php

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Models\MatchPlayer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class CommunityGameController extends Controller
{
    // List all upcoming matches
    public function index()
    {
        $matches = FootballMatch::withCount(['players as confirmed_players' => function($query) {
            $query->where('match_player.status', 'confirmed');
        }])
        ->where('status', 'open')
        ->where('match_date', '>=', now()->toDateString())
        ->orderBy('match_date', 'asc')
        ->get()
        ->map(function($match) {
            return [
                'id' => $match->id,
                'title' => $match->title ?? ($match->team_a_name . ' vs ' . $match->team_b_name),
                'venue' => $match->venue,
                'game_date' => $match->match_date,
                'game_time' => $match->match_time,
                'team_a_name' => $match->team_a_name,
                'team_b_name' => $match->team_b_name,
                'price' => $match->price,
                'total_slots' => $match->total_slots,
                'filled_slots' => $match->confirmed_players,
                'status' => $match->status,
            ];
        });

        return response()->json($matches);
    }

    // Match details
    public function show($id)
    {
        $match = FootballMatch::with(['owner', 'players' => function($query) {
            $query->where('match_player.status', 'confirmed');
        }])->find($id);

        if (!$match) return response()->json(['message' => 'Match not found'], 404);

        return response()->json([
            'game' => [
                'id' => $match->id,
                'title' => $match->title,
                'description' => $match->description,
                'venue' => $match->venue,
                'game_date' => $match->match_date,
                'game_time' => $match->match_time,
                'price' => $match->price,
                'total_slots' => $match->total_slots,
                'status' => $match->status,
                'team_a_name' => $match->team_a_name,
                'team_b_name' => $match->team_b_name,
                'qr_code_url' => $match->owner->qr_code_path ?? null,
            ],
            'players' => $match->players->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'avatar' => $u->avatar,
            ])
        ]);
    }

    // Join a match
    public function join(Request $request, $id)
    {
        // ... (existing join code)
    }

    // Get User Profile Statistics
    public function getProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        // 1. Calculate Stats from Performances
        $stats = DB::table('performances')
            ->where('user_id', $user->id)
            ->selectRaw('COUNT(match_id) as total_games, SUM(goals) as total_goals, SUM(assists) as total_assists, AVG(rating) as avg_rating')
            ->first();

        // 2. Get Match History
        $history = FootballMatch::whereHas('players', function($q) use ($user) {
            $q->where('user_id', $user->id)->where('match_player.status', 'confirmed');
        })
        ->orderBy('match_date', 'desc')
        ->limit(10)
        ->get()
        ->map(fn($m) => [
            'id' => $m->id,
            'title' => $m->title,
            'date' => $m->match_date,
            'venue' => $m->venue,
            'league' => $m->league_name ?? 'Community Friendly'
        ]);

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $user->role,
            ],
            'stats' => [
                'total_matches' => $stats->total_games ?? 0,
                'total_goals' => $stats->total_goals ?? 0,
                'total_assists' => $stats->total_assists ?? 0,
                'avg_rating' => round($stats->avg_rating ?? 0, 1),
            ],
            'history' => $history
        ]);
    }
}
