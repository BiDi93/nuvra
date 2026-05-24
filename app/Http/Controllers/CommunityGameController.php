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
        ->orderBy('match_date', 'desc')
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

    // Create a new match (Admin/Club Owner)
    public function store(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['club_owner', 'community_admin', 'coach', 'admin'])) {
            return response()->json(['message' => 'Unauthorized to create games'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'venue' => 'required|string',
            'game_date' => 'required', 
            'price_per_player' => 'required|numeric|min:0',
            'max_slots_per_team' => 'required|integer|min:1',
            'team_a_name' => 'nullable|string',
            'team_b_name' => 'nullable|string',
            'opponent_name' => 'nullable|string',
            'match_type' => 'nullable|string', 
            'payment_qr' => 'nullable|image|max:2048',
        ]);

        $dt = new \DateTime($validated['game_date']);
        $match_date = $dt->format('Y-m-d');
        $match_time = $dt->format('H:i:s');

        if ($request->hasFile('payment_qr')) {
            $path = $request->file('payment_qr')->store('qrcodes', 'public');
            $user->update(['qr_code_path' => '/storage/' . $path]);
        }

        $matchType = $validated['match_type'] ?? 'pickup';
        $totalSlots = ($matchType === 'external') 
            ? $validated['max_slots_per_team'] 
            : ($validated['max_slots_per_team'] * 2);

        $match = FootballMatch::create([
            'club_owner_id' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'venue' => $validated['venue'],
            'match_date' => $match_date,
            'match_time' => $match_time,
            'price' => $validated['price_per_player'],
            'total_slots' => $totalSlots,
            'team_a_name' => $validated['team_a_name'] ?? 'Team A',
            'team_b_name' => ($matchType === 'external') ? null : ($validated['team_b_name'] ?? 'Team B'),
            'opponent_name' => ($matchType === 'external') ? $validated['opponent_name'] : null,
            'status' => 'open'
        ]);

        return response()->json(['message' => 'Game created successfully', 'game' => $match], 201);
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
        $match = FootballMatch::find($id);

        if (!$match) return response()->json(['message' => 'Match not found'], 404);
        if ($match->status !== 'open') return response()->json(['message' => 'This match is not open for registration'], 400);

        $existing = DB::table('match_player')->where('match_id', $id)->where('user_id', $user->id)->first();
        if ($existing) return response()->json(['message' => 'You have already registered for this match'], 400);

        $confirmedCount = DB::table('match_player')->where('match_id', $id)->where('status', 'confirmed')->count();
        if ($confirmedCount >= $match->total_slots) {
            $match->update(['status' => 'full']);
            return response()->json(['message' => 'Match is full'], 400);
        }

        $status = ($match->price <= 0) ? 'confirmed' : 'pending';

        DB::table('match_player')->insert([
            'match_id' => $id,
            'user_id' => $user->id,
            'status' => $status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($status === 'confirmed' && ($confirmedCount + 1) >= $match->total_slots) {
            $match->update(['status' => 'full']);
        }

        return response()->json([
            'message' => $status === 'confirmed' ? 'Successfully joined the match!' : 'Registration submitted. Please upload payment receipt.',
            'status' => $status
        ]);
    }

    // Leave a match
    public function leave(Request $request, $id)
    {
        $user = $request->user();
        $deleted = DB::table('match_player')
            ->where('match_id', $id)
            ->where('user_id', $user->id)
            ->delete();

        if (!$deleted) return response()->json(['message' => 'Registration not found'], 404);

        return response()->json(['message' => 'Successfully left the match']);
    }

    // Cancel match (Admin only)
    public function cancel(Request $request, $id)
    {
        $match = FootballMatch::find($id);
        if (!$match) return response()->json(['message' => 'Match not found'], 404);

        if ($match->club_owner_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $match->update(['status' => 'cancelled']);
        return response()->json(['message' => 'Match cancelled']);
    }

    // Get bookings for a match (Admin only)
    public function bookings($id)
    {
        $match = FootballMatch::with(['players' => function($query) {
            $query->select('users.id', 'users.name', 'users.email', 'users.avatar')
                  ->withPivot('status', 'id as booking_id');
        }])->find($id);

        if (!$match) return response()->json(['message' => 'Match not found'], 404);

        return response()->json($match->players);
    }

    // Approve booking
    public function approveBooking(Request $request, $bookingId)
    {
        $updated = DB::table('match_player')
            ->where('id', $bookingId)
            ->update([
                'status' => 'confirmed',
                'updated_at' => now()
            ]);

        if (!$updated) return response()->json(['message' => 'Booking not found'], 404);

        return response()->json(['message' => 'Booking approved']);
    }

    // Reject booking
    public function rejectBooking(Request $request, $bookingId)
    {
        $updated = DB::table('match_player')
            ->where('id', $bookingId)
            ->update([
                'status' => 'cancelled',
                'updated_at' => now()
            ]);

        if (!$updated) return response()->json(['message' => 'Booking not found'], 404);

        return response()->json(['message' => 'Booking rejected']);
    }

    // List all community members
    public function members()
    {
        $users = User::select('id', 'name', 'avatar', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($user) {
                $stats = DB::table('performances')
                    ->where('user_id', $user->id)
                    ->selectRaw('COUNT(id) as total_games, SUM(goals) as goals')
                    ->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'role' => $user->role,
                    'joined' => $user->created_at->format('M Y'),
                    'games' => $stats->total_games ?? 0,
                    'goals' => $stats->goals ?? 0,
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
            ->selectRaw('COUNT(match_id) as total_matches, SUM(goals) as total_goals, SUM(assists) as total_assists, AVG(rating) as avg_rating')
            ->first();

        $history = FootballMatch::whereHas('players', function($q) use ($user) {
            $q->where('user_id', $user->id)->where('match_player.status', 'confirmed');
        })
        ->with(['performances' => function($q) use ($user) {
            $q->where('user_id', $user->id);
        }])
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
                'name' => $user->name,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'joined' => $user->created_at->format('M Y'),
            ],
            'stats' => [
                'total_matches' => $stats->total_matches ?? 0,
                'total_goals' => $stats->total_goals ?? 0,
                'total_assists' => $stats->total_assists ?? 0,
                'avg_rating' => round($stats->avg_rating ?? 0, 1),
            ],
            'history' => $history
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
            ]
        ];

        if (in_array($user->role, ['club_owner', 'admin'])) {
            $data['club'] = [
                'name' => $user->club_name ?? 'Nuvra Club',
                'established_at' => $user->established_at,
                'location' => $user->location ?? 'Unknown',
            ];
            
            $data['stats'] = [
                'total_organized' => DB::table('matches')->where('club_owner_id', $user->id)->count(),
                'active_players' => DB::table('match_player')
                    ->join('matches', 'match_player.match_id', '=', 'matches.id')
                    ->where('matches.club_owner_id', $user->id)
                    ->where('match_player.status', 'confirmed')
                    ->distinct('user_id')
                    ->count('user_id'),
            ];
        } else {
            $stats = DB::table('performances')
                ->where('user_id', $user->id)
                ->selectRaw('COUNT(match_id) as total_games, SUM(goals) as total_goals, SUM(assists) as total_assists, AVG(rating) as avg_rating')
                ->first();

            $data['stats'] = [
                'total_matches' => $stats->total_matches ?? 0,
                'total_goals' => $stats->total_goals ?? 0,
                'total_assists' => $stats->total_assists ?? 0,
                'avg_rating' => round($stats->avg_rating ?? 0, 1),
            ];

            $data['history'] = FootballMatch::whereHas('players', function($q) use ($user) {
                $q->where('user_id', $user->id)->where('match_player.status', 'confirmed');
            })
            ->with(['performances' => function($q) use ($user) {
                $q->where('user_id', $user->id);
            }])
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
        }

        return response()->json($data);
    }
}
