<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CommunityGameController extends Controller
{
    // ── Helper: resolve community user from Sanctum-authenticated request ────────
    private function resolveUser(Request $request)
    {
        $authUser = $request->user(); // Resolved by auth:sanctum middleware
        if (! $authUser) return null;
        return DB::table('community_users')->where('user_id', $authUser->id)->first();
    }

    // ── GET /community/games — list all open/upcoming games (public) ──────────
    public function index()
    {
        $games = DB::table('community_games')
            ->whereIn('status', ['open', 'full'])
            ->where('game_date', '>=', now())
            ->orderBy('game_date', 'asc')
            ->get()
            ->map(function ($game) {
                $game->team_a_count = DB::table('community_bookings')
                    ->where('game_id', $game->id)
                    ->where('team_side', 'team_a')
                    ->whereIn('status', ['payment_submitted', 'confirmed'])
                    ->count();
                $game->team_b_count = DB::table('community_bookings')
                    ->where('game_id', $game->id)
                    ->where('team_side', 'team_b')
                    ->whereIn('status', ['payment_submitted', 'confirmed'])
                    ->count();

                // Dynamic Status Verification
                $totalLocked = $game->team_a_count + $game->team_b_count;
                $maxCapacity = $game->max_slots_per_team * 2;
                $calculatedStatus = ($totalLocked >= $maxCapacity) ? 'full' : 'open';

                // Only update if it's currently open/full and out of sync
                if (in_array($game->status, ['open', 'full']) && $game->status !== $calculatedStatus) {
                    DB::table('community_games')->where('id', $game->id)->update(['status' => $calculatedStatus]);
                    $game->status = $calculatedStatus;
                }

                $game->payment_qr_url = $game->payment_qr_path
                    ? Storage::url($game->payment_qr_path)
                    : null;
                return $game;
            });

        return response()->json($games);
    }

    // ── GET /community/games/{id} — single game detail ────────────────────────
    public function show($id)
    {
        $game = DB::table('community_games')->where('id', $id)->first();

        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        $game->payment_qr_url = $game->payment_qr_path
            ? Storage::url($game->payment_qr_path)
            : null;

        $teamA = DB::table('community_bookings')
            ->join('community_users', 'community_bookings.community_user_id', '=', 'community_users.id')
            ->where('community_bookings.game_id', $id)
            ->where('community_bookings.team_side', 'team_a')
            ->whereIn('community_bookings.status', ['payment_submitted', 'confirmed'])
            ->select('community_users.id', 'community_users.name', 'community_bookings.created_at as joined_at', 'community_bookings.status as booking_status')
            ->get();

        $teamB = DB::table('community_bookings')
            ->join('community_users', 'community_bookings.community_user_id', '=', 'community_users.id')
            ->where('community_bookings.game_id', $id)
            ->where('community_bookings.team_side', 'team_b')
            ->whereIn('community_bookings.status', ['payment_submitted', 'confirmed'])
            ->select('community_users.id', 'community_users.name', 'community_bookings.created_at as joined_at', 'community_bookings.status as booking_status')
            ->get();

        // Dynamic Status Verification
        $totalLocked = $teamA->count() + $teamB->count();
        $maxCapacity = $game->max_slots_per_team * 2;
        $calculatedStatus = ($totalLocked >= $maxCapacity) ? 'full' : 'open';

        if (in_array($game->status, ['open', 'full']) && $game->status !== $calculatedStatus) {
            DB::table('community_games')->where('id', $id)->update(['status' => $calculatedStatus]);
            $game->status = $calculatedStatus;
        }

        return response()->json([
            'game'   => $game,
            'team_a' => $teamA,
            'team_b' => $teamB,
        ]);
    }

    // ── POST /community/games — create game (admin only) ─────────────────────
    public function store(Request $request)
    {
        $user = $this->resolveUser($request);

        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        $request->validate([
            'title'               => 'required|string|max:255',
            'venue'               => 'required|string|max:255',
            'game_date'           => 'required|date|after:now',
            'team_a_name'         => 'nullable|string|max:100',
            'team_b_name'         => 'nullable|string|max:100',
            'max_slots_per_team'  => 'nullable|integer|min:1|max:20',
            'description'         => 'nullable|string',
            'price_per_player'    => 'nullable|numeric|min:0',
            'payment_qr'          => 'nullable|image|max:4096',
        ]);

        $qrPath = null;
        if ($request->hasFile('payment_qr')) {
            $qrPath = $request->file('payment_qr')->store('payment-qr', 'public');
        }

        $gameId = DB::table('community_games')->insertGetId([
            'title'              => $request->title,
            'description'        => $request->description,
            'venue'              => $request->venue,
            'game_date'          => $request->game_date,
            'team_a_name'        => $request->team_a_name ?? 'Team A',
            'team_b_name'        => $request->team_b_name ?? 'Team B',
            'max_slots_per_team' => $request->max_slots_per_team ?? 20,
            'price_per_player'   => $request->price_per_player ?? 0,
            'payment_qr_path'    => $qrPath,
            'status'             => 'open',
            'created_by'         => $user->id,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $game = DB::table('community_games')->where('id', $gameId)->first();

        return response()->json([
            'message' => 'Game created successfully!',
            'game'    => $game,
        ], 201);
    }

    // ── PATCH /community/games/{id}/cancel — cancel game (admin only) ─────────
    public function cancel(Request $request, $id)
    {
        $user = $this->resolveUser($request);

        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        $game = DB::table('community_games')->where('id', $id)->first();

        if (! $game) {
            return response()->json(['message' => 'Game not found.'], 404);
        }

        DB::table('community_games')->where('id', $id)->update([
            'status'     => 'cancelled',
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Game cancelled successfully.']);
    }

    // ── POST /community/games/{id}/join — book a slot ────────────────────────
    public function join(Request $request, $id)
    {
        $user = $this->resolveUser($request);

        if (! $user) {
            return response()->json(['message' => 'Please log in to join a game.'], 401);
        }

        $request->validate([
            'team_side' => 'required|in:team_a,team_b',
            'receipt'   => 'nullable|image|max:8192',
        ]);

        try {
            return DB::transaction(function () use ($request, $id, $user) {
                $game = DB::table('community_games')->where('id', $id)->lockForUpdate()->first();

                if (! $game) {
                    return response()->json(['message' => 'Game not found.'], 404);
                }

                if ($game->status !== 'open') {
                    return response()->json(['message' => 'This game is no longer open for bookings.'], 422);
                }

                // Check duplicate booking
                $existing = DB::table('community_bookings')
                    ->where('game_id', $id)
                    ->where('community_user_id', $user->id)
                    ->whereIn('status', ['payment_submitted', 'confirmed'])
                    ->exists();

                if ($existing) {
                    return response()->json(['message' => 'You have already joined this game.'], 422);
                }

                // Check team slot availability
                $sideCount = DB::table('community_bookings')
                    ->where('game_id', $id)
                    ->where('team_side', $request->team_side)
                    ->whereIn('status', ['payment_submitted', 'confirmed'])
                    ->count();

                if ($sideCount >= $game->max_slots_per_team) {
                    return response()->json(['message' => 'This team is full. Try the other side!'], 422);
                }

                // Free game → confirm immediately; paid game → require receipt
                $isPaid = $game->price_per_player > 0;

                if ($isPaid && ! $request->hasFile('receipt')) {
                    return response()->json(['message' => 'Payment receipt is required to book a slot.'], 422);
                }

                $receiptPath = null;
                if ($isPaid && $request->hasFile('receipt')) {
                    $receiptPath = $request->file('receipt')->store('receipts', 'public');
                }

                $bookingStatus = $isPaid ? 'payment_submitted' : 'confirmed';

                DB::table('community_bookings')->insert([
                    'game_id'           => $id,
                    'community_user_id' => $user->id,
                    'team_side'         => $request->team_side,
                    'status'            => $bookingStatus,
                    'receipt_path'      => $receiptPath,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]);

                // Check if both teams are now full
                $teamACount = DB::table('community_bookings')
                    ->where('game_id', $id)->where('team_side', 'team_a')
                    ->whereIn('status', ['payment_submitted', 'confirmed'])->count();
                $teamBCount = DB::table('community_bookings')
                    ->where('game_id', $id)->where('team_side', 'team_b')
                    ->whereIn('status', ['payment_submitted', 'confirmed'])->count();

                if ($teamACount >= $game->max_slots_per_team && $teamBCount >= $game->max_slots_per_team) {
                    DB::table('community_games')->where('id', $id)->update([
                        'status'     => 'full',
                        'updated_at' => now(),
                    ]);
                }

                $msg = $isPaid
                    ? 'Slot reserved! Admin will verify your payment soon. 🔥'
                    : 'Slot booked! See you on the pitch. 🔥';

                return response()->json(['message' => $msg, 'booking_status' => $bookingStatus], 201);
            });
        } catch (\Exception $e) {
            \Log::error("Join game error: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred while joining the game.'], 500);
        }
    }

    // ── DELETE /community/games/{id}/leave — cancel own booking ──────────────
    // Only allowed for free games (confirmed, before admin approval for paid games)
    // Paid game bookings (payment_submitted) cannot be self-cancelled
    public function leave(Request $request, $id)
    {
        $user = $this->resolveUser($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        try {
            return DB::transaction(function () use ($id, $user) {
                $game = DB::table('community_games')->where('id', $id)->lockForUpdate()->first();

                if (! $game) {
                    return response()->json(['message' => 'Game not found.'], 404);
                }

                $booking = DB::table('community_bookings')
                    ->where('game_id', $id)
                    ->where('community_user_id', $user->id)
                    ->where('status', 'confirmed') // only free-game confirmed bookings can self-cancel
                    ->first();

                if (! $booking) {
                    return response()->json(['message' => 'No cancellable booking found.'], 404);
                }

                DB::table('community_bookings')
                    ->where('id', $booking->id)
                    ->update(['status' => 'cancelled', 'updated_at' => now()]);

                if ($game->status === 'full') {
                    DB::table('community_games')->where('id', $id)->update([
                        'status'     => 'open',
                        'updated_at' => now(),
                    ]);
                }

                return response()->json(['message' => 'Your booking has been cancelled.']);
            });
        } catch (\Exception $e) {
            \Log::error("Leave game error: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred while leaving the game.'], 500);
        }
    }

    // ── GET /community/games/{id}/bookings — admin: see all bookings ──────────
    public function bookings(Request $request, $id)
    {
        $user = $this->resolveUser($request);

        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        $bookings = DB::table('community_bookings')
            ->join('community_users', 'community_bookings.community_user_id', '=', 'community_users.id')
            ->where('community_bookings.game_id', $id)
            ->whereIn('community_bookings.status', ['payment_submitted', 'confirmed'])
            ->select(
                'community_bookings.id',
                'community_bookings.team_side',
                'community_bookings.status',
                'community_bookings.receipt_path',
                'community_bookings.created_at',
                'community_users.id as player_id',
                'community_users.name as player_name',
                'community_users.email as player_email'
            )
            ->orderBy('community_bookings.status')
            ->orderBy('community_bookings.created_at')
            ->get()
            ->map(function ($b) {
                $b->receipt_url = $b->receipt_path ? Storage::url($b->receipt_path) : null;
                return $b;
            });

        return response()->json($bookings);
    }

    // ── PATCH /community/bookings/{bookingId}/approve — admin approves ─────────
    public function approveBooking(Request $request, $bookingId)
    {
        $user = $this->resolveUser($request);

        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        $booking = DB::table('community_bookings')->where('id', $bookingId)->first();

        if (! $booking || $booking->status !== 'payment_submitted') {
            return response()->json(['message' => 'Booking not found or not pending approval.'], 404);
        }

        DB::table('community_bookings')->where('id', $bookingId)->update([
            'status'     => 'confirmed',
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Booking approved. Player confirmed!']);
    }

    // ── PATCH /community/bookings/{bookingId}/reject — admin rejects ───────────
    public function rejectBooking(Request $request, $bookingId)
    {
        $user = $this->resolveUser($request);

        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        try {
            return DB::transaction(function () use ($bookingId) {
                $booking = DB::table('community_bookings')->where('id', $bookingId)->lockForUpdate()->first();

                if (! $booking || $booking->status === 'cancelled') {
                    return response()->json(['message' => 'Booking not found.'], 404);
                }

                DB::table('community_bookings')->where('id', $bookingId)->update([
                    'status'     => 'cancelled',
                    'updated_at' => now(),
                ]);

                // If game was full, reopen it
                $game = DB::table('community_games')->where('id', $booking->game_id)->first();
                if ($game && $game->status === 'full') {
                    DB::table('community_games')->where('id', $booking->game_id)->update([
                        'status'     => 'open',
                        'updated_at' => now(),
                    ]);
                }

                return response()->json(['message' => 'Booking rejected and slot freed.']);
            });
        } catch (\Exception $e) {
            \Log::error("Reject booking error: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred.'], 500);
        }
    }
}
