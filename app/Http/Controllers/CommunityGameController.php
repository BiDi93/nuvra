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
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $match = FootballMatch::find($id);
        if (!$match) return response()->json(['message' => 'Match not found'], 404);

        // Check if already joined
        $exists = MatchPlayer::where('match_id', $id)->where('user_id', $user->id)->exists();
        if ($exists) return response()->json(['message' => 'You already joined this match'], 422);

        // Check slots
        $count = MatchPlayer::where('match_id', $id)->where('status', 'confirmed')->count();
        if ($count >= $match->total_slots) return response()->json(['message' => 'Match is full'], 422);

        MatchPlayer::create([
            'match_id' => $id,
            'user_id' => $user->id,
            'status' => $match->price > 0 ? 'pending' : 'confirmed'
        ]);

        return response()->json([
            'message' => $match->price > 0 ? 'Request sent! Please pay using the QR code.' : 'Joined successfully!'
        ]);
    }
}
