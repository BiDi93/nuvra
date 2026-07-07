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
                'club_owner_id' => $match->club_owner_id,
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
    public function show(Request $request, $id)
    {
        $match = FootballMatch::with(['owner', 'players' => function($query) {
            $query->where('match_player.status', 'confirmed');
        }])->find($id);

        if (!$match) return response()->json(['message' => 'Match not found'], 404);

        // Optional auth: detect the requesting user (token may be sent on this public route)
        $me = auth('sanctum')->user();
        $myBooking = null;
        $isOwner = false;

        if ($me) {
            $isOwner = ((int) $match->club_owner_id === (int) $me->id) || $me->role === 'admin';
            $booking = DB::table('match_player')
                ->where('match_id', $id)
                ->where('user_id', $me->id)
                ->first();
            if ($booking) {
                $myBooking = [
                    'status'      => $booking->status,
                    'has_receipt' => !empty($booking->payment_receipt),
                    'receipt_url' => $booking->payment_receipt,
                ];
            }
        }

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
            ]),
            'my_booking' => $myBooking,
            'is_owner'   => $isOwner,
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
            'message' => $status === 'confirmed' ? 'Successfully joined the match!' : 'Registration submitted. Please upload your payment receipt.',
            'status' => $status
        ]);
    }

    // Upload payment receipt for a pending booking
    public function uploadReceipt(Request $request, $id)
    {
        $request->validate([
            'receipt' => 'required|image|max:4096',
        ]);

        $user = $request->user();

        $booking = DB::table('match_player')
            ->where('match_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$booking) {
            return response()->json(['message' => 'You have not joined this match yet'], 404);
        }
        if ($booking->status === 'confirmed') {
            return response()->json(['message' => 'Your booking is already confirmed'], 400);
        }

        $path = $request->file('receipt')->store('receipts', 'public');

        DB::table('match_player')
            ->where('id', $booking->id)
            ->update([
                'payment_receipt' => '/storage/' . $path,
                'paid_at'         => now(),
                'status'          => 'awaiting_approval',
                'updated_at'      => now(),
            ]);

        return response()->json([
            'message' => 'Receipt uploaded! Waiting for organizer approval.',
            'status'  => 'awaiting_approval',
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

    // Get bookings for a match (Organizer only)
    public function bookings(Request $request, $id)
    {
        $match = FootballMatch::find($id);
        if (!$match) return response()->json(['message' => 'Match not found'], 404);

        $me = $request->user();
        if ((int) $match->club_owner_id !== (int) $me->id && $me->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bookings = DB::table('match_player')
            ->join('users', 'match_player.user_id', '=', 'users.id')
            ->where('match_player.match_id', $id)
            ->where('match_player.status', '!=', 'cancelled')
            ->select(
                'match_player.id as booking_id',
                'match_player.status',
                'match_player.payment_receipt',
                'match_player.paid_at',
                'users.id as user_id',
                'users.name',
                'users.email',
                'users.avatar'
            )
            ->orderByRaw("CASE match_player.status
                WHEN 'awaiting_approval' THEN 0
                WHEN 'pending' THEN 1
                WHEN 'confirmed' THEN 2
                ELSE 3 END")
            ->get();

        return response()->json($bookings);
    }

    // Approve booking
    public function approveBooking(Request $request, $bookingId)
    {
        $booking = DB::table('match_player')->where('id', $bookingId)->first();
        if (!$booking) return response()->json(['message' => 'Booking not found'], 404);

        DB::table('match_player')
            ->where('id', $bookingId)
            ->update([
                'status' => 'confirmed',
                'updated_at' => now()
            ]);

        $match = FootballMatch::find($booking->match_id);
        $player = User::find($booking->user_id);

        if ($player && $match) {
            $player->notify(new BookingStatusUpdated($match, 'approved'));
        }

        return response()->json(['message' => 'Booking approved']);
    }

    // Reject booking
    public function rejectBooking(Request $request, $bookingId)
    {
        $booking = DB::table('match_player')->where('id', $bookingId)->first();
        if (!$booking) return response()->json(['message' => 'Booking not found'], 404);

        DB::table('match_player')
            ->where('id', $bookingId)
            ->update([
                'status' => 'rejected',
                'updated_at' => now()
            ]);

        $match = FootballMatch::find($booking->match_id);
        $player = User::find($booking->user_id);

        if ($player && $match) {
            $player->notify(new BookingStatusUpdated($match, 'rejected'));
        }

        return response()->json(['message' => 'Booking rejected']);
    }

    // Record player performances for a completed match (organizer only)
    public function recordPerformances(Request $request, $id)
    {
        $match = FootballMatch::find($id);
        if (!$match) return response()->json(['message' => 'Match not found'], 404);

        $me = $request->user();
        if ((int) $match->club_owner_id !== (int) $me->id && $me->role !== 'admin') {
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
        $users = User::select('id', 'name', 'avatar', 'club_logo', 'role', 'created_at')
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
                    'club_logo' => $user->club_logo,
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
        ->where('match_date', '<', now())   // past matches only
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
                'club_logo' => $user->club_logo,
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
                'club_logo' => $user->club_logo,
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
                'total_matches' => $stats->total_games ?? 0,
                'total_goals'   => $stats->total_goals ?? 0,
                'total_assists' => $stats->total_assists ?? 0,
                'avg_rating'    => round($stats->avg_rating ?? 0, 1),
            ];

            $data['history'] = FootballMatch::whereHas('players', function($q) use ($user) {
                $q->where('user_id', $user->id)->where('match_player.status', 'confirmed');
            })
            ->with(['performances' => function($q) use ($user) {
                $q->where('user_id', $user->id);
            }])
            ->where('match_date', '<', now())   // past matches only
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
}
