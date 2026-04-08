<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class CommunityGameController extends Controller
{
    // ── Helper: resolve community user from bearer token ──────────────────────
    private function resolveUser(Request $request)
    {
        $token = $request->bearerToken();
        if (! $token) return null;
        return DB::table('community_users')->where('remember_token', $token)->first();
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
                    ->where('status', 'confirmed')
                    ->count();
                $game->team_b_count = DB::table('community_bookings')
                    ->where('game_id', $game->id)
                    ->where('team_side', 'team_b')
                    ->where('status', 'confirmed')
                    ->count();
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

        $teamA = DB::table('community_bookings')
            ->join('community_users', 'community_bookings.community_user_id', '=', 'community_users.id')
            ->where('community_bookings.game_id', $id)
            ->where('community_bookings.team_side', 'team_a')
            ->where('community_bookings.status', 'confirmed')
            ->select('community_users.id', 'community_users.name', 'community_bookings.created_at as joined_at')
            ->get();

        $teamB = DB::table('community_bookings')
            ->join('community_users', 'community_bookings.community_user_id', '=', 'community_users.id')
            ->where('community_bookings.game_id', $id)
            ->where('community_bookings.team_side', 'team_b')
            ->where('community_bookings.status', 'confirmed')
            ->select('community_users.id', 'community_users.name', 'community_bookings.created_at as joined_at')
            ->get();

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
        ]);

        $gameId = DB::table('community_games')->insertGetId([
            'title'              => $request->title,
            'description'        => $request->description,
            'venue'              => $request->venue,
            'game_date'          => $request->game_date,
            'team_a_name'        => $request->team_a_name ?? 'Team A',
            'team_b_name'        => $request->team_b_name ?? 'Team B',
            'max_slots_per_team' => $request->max_slots_per_team ?? 20,
            'status'             => 'open',
            'created_by'         => $user->id,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $game = DB::table('community_games')->where('id', $gameId)->first();

        // ── Fire email notifications to all community players ──────────────────
        // $this->notifyPlayers($game);

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
        ]);

        try {
            return DB::transaction(function () use ($request, $id, $user) {
                // Lock the game row for update to prevent concurrent overbooking
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
                    ->where('status', 'confirmed')
                    ->exists();

                if ($existing) {
                    return response()->json(['message' => 'You have already joined this game.'], 422);
                }

                // Check team slot availability
                $sideCount = DB::table('community_bookings')
                    ->where('game_id', $id)
                    ->where('team_side', $request->team_side)
                    ->where('status', 'confirmed')
                    ->count();

                if ($sideCount >= $game->max_slots_per_team) {
                    return response()->json(['message' => 'This team is full. Try the other side!'], 422);
                }

                // Create booking
                DB::table('community_bookings')->insert([
                    'game_id'           => $id,
                    'community_user_id' => $user->id,
                    'team_side'         => $request->team_side,
                    'status'            => 'confirmed',
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]);

                // Check if both teams are now full → update status to 'full'
                $teamACount = DB::table('community_bookings')
                    ->where('game_id', $id)->where('team_side', 'team_a')->where('status', 'confirmed')->count();
                $teamBCount = DB::table('community_bookings')
                    ->where('game_id', $id)->where('team_side', 'team_b')->where('status', 'confirmed')->count();

                if ($teamACount >= $game->max_slots_per_team && $teamBCount >= $game->max_slots_per_team) {
                    DB::table('community_games')->where('id', $id)->update([
                        'status'     => 'full',
                        'updated_at' => now(),
                    ]);
                }

                return response()->json(['message' => 'Slot booked! See you on the pitch. 🔥'], 201);
            });
        } catch (\Exception $e) {
            \Log::error("Join game error: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred while joining the game.'], 500);
        }
    }

    // ── DELETE /community/games/{id}/leave — cancel own booking ──────────────
    public function leave(Request $request, $id)
    {
        $user = $this->resolveUser($request);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        try {
            return DB::transaction(function () use ($id, $user) {
                // Lock game row
                $game = DB::table('community_games')->where('id', $id)->lockForUpdate()->first();

                if (! $game) {
                    return response()->json(['message' => 'Game not found.'], 404);
                }

                $booking = DB::table('community_bookings')
                    ->where('game_id', $id)
                    ->where('community_user_id', $user->id)
                    ->where('status', 'confirmed')
                    ->first();

                if (! $booking) {
                    return response()->json(['message' => 'No active booking found.'], 404);
                }

                DB::table('community_bookings')
                    ->where('id', $booking->id)
                    ->update(['status' => 'cancelled', 'updated_at' => now()]);

                // If game was full and someone leaves, re-open it
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

    // ── Private: send email notifications to all community players ────────────
    private function notifyPlayers($game)
    {
        $players = DB::table('community_users')->where('role', 'player')->get();

        foreach ($players as $player) {
            try {
                Mail::raw(
                    "Hi {$player->name},\n\nA new game has been posted on Nuvra Community!\n\n"
                    . "🏟️  {$game->title}\n"
                    . "📍  {$game->venue}\n"
                    . "⏰  " . date('D, d M Y H:i', strtotime($game->game_date)) . "\n\n"
                    . "Open the Nuvra Community app to book your slot before it fills up!\n\n"
                    . "See you on the pitch,\nNuvra Community Team",
                    function ($message) use ($player, $game) {
                        $message->to($player->email, $player->name)
                                ->subject("⚽ New Game Posted: {$game->title}");
                    }
                );
            } catch (\Exception $e) {
                // Silently fail — don't break game creation if email fails
                \Log::warning("Community email failed for {$player->email}: " . $e->getMessage());
            }
        }
    }
}
