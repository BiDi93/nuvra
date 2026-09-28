<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\NotSharedDefaultPassword;
use App\Support\AttemptLimiter;
use App\Support\AuthMessages;
use App\Support\PlayerLocator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CommunityAuthController extends Controller
{
    // ── Register (New Player) ──────────────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'phone'                 => 'nullable|string|max:20',
            'position'              => 'nullable|string|max:100',
            'password'              => ['required', 'string', 'min:6', 'confirmed', new NotSharedDefaultPassword],
        ]);

        // Auto-increment Vellar ID: get highest number + 1
        $maxNumber = User::whereNotNull('vellar_id')
            ->get()
            ->map(fn($u) => (int) preg_replace('/[^0-9]/', '', $u->vellar_id))
            ->max() ?? 0;

        $nextNumber = $maxNumber + 1;
        $vellarId   = 'VELLAR ' . $nextNumber;
        $email      = 'vellar' . $nextNumber . '@vellarleague.com';

        // Ensure email/vellar_id is unique (edge case check)
        while (User::where('email', $email)->exists()) {
            $nextNumber++;
            $vellarId = 'VELLAR ' . $nextNumber;
            $email    = 'vellar' . $nextNumber . '@vellarleague.com';
        }

        $user = User::create([
            'name'      => $request->name,
            'email'     => $email,
            'password'  => Hash::make($request->password),
            'role'      => 'player',
            'status'    => 'pending',   // Awaiting admin approval
            'vellar_id' => $vellarId,
            'phone'     => $request->phone ?? null,
            'position'  => $request->position ?? null,
        ]);

        return response()->json([
            'message'       => 'Registration successful! Awaiting admin approval.',
            'vellar_id'     => $vellarId,
            'vellar_number' => $nextNumber,
            'name'          => $user->name,
            'status'        => 'pending',
        ], 201);
    }

    // ── Login (Vellar ID Number or Email for Admin) ───────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'vellar_id' => 'required',
            'password'  => 'required',
        ]);

        $input = trim($request->vellar_id);
        $identifier = PlayerLocator::identifier($input);
        $attempts = app(AttemptLimiter::class);

        if ($attempts->blocked('login', $identifier, $request->ip())) {
            return response()->json(['message' => AuthMessages::TOO_MANY], 429);
        }

        // If input contains '@', treat as email (for admin/organizer)
        if (! str_contains($input, '@')) {
            $vellarNumber = preg_replace('/[^0-9]/', '', $input);

            if (empty($vellarNumber)) {
                $attempts->hit('login', $identifier, $request->ip());

                return response()->json(['message' => 'Invalid Vellar ID. Please enter numbers only (e.g. 82).'], 422);
            }
        }

        $user = PlayerLocator::find($input);

        // A fixed hash keeps a missing account on the same cost as a real one.
        $hash = $user?->password ?? '$2y$12$0JVSj34kuHi7I8AV0oUaiOyzOqJPIGbVFHHTJZcfAHiiOlAH5CbVy';
        $passwordMatches = Hash::check($request->password, $hash);
        $mustReset = $user && $user->role === 'player' && $user->password_reset_required;

        if (! $user || ! $passwordMatches || $mustReset) {
            $attempts->hit('login', $identifier, $request->ip());

            return response()->json(['message' => AuthMessages::LOGIN_FAILED], 401);
        }

        $attempts->clearIdentifier('login', $identifier);

        // Check account status
        if ($user->status === 'pending') {
            return response()->json([
                'message' => 'Your account is pending admin approval. Please check back shortly.',
                'status'  => 'pending',
            ], 403);
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact support/admin.',
                'status'  => 'suspended',
            ], 403);
        }

        $token = $user->createToken('community_token')->plainTextToken;

        return response()->json([
            'message'    => 'Login successful.',
            'token'      => $token,
            'status'     => $user->status,
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $user->role,
                'vellar_id' => $user->vellar_id,
                'position'  => $user->position,
                'club_name' => $user->club_name,
                'avatar'    => $user->avatar,
            ],
        ]);
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    // ── Me ────────────────────────────────────────────────────────────────────
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // =========================================================================
    // ADMIN — Player Approval Management
    // =========================================================================

    // List pending players
    public function pendingPlayers(Request $request)
    {
        // Only admin can access
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $players = User::where('status', 'pending')
            ->where('role', 'player')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'vellar_id', 'position', 'phone', 'status', 'created_at']);

        return response()->json([
            'count'   => $players->count(),
            'players' => $players,
        ]);
    }

    // Approve player
    public function approvePlayer(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $player = User::findOrFail($id);

        if ($player->role !== 'player') {
            return response()->json(['message' => 'This user is not a player.'], 422);
        }

        $player->update(['status' => 'active']);

        return response()->json([
            'message'   => "Player {$player->name} ({$player->vellar_id}) has been approved.",
            'player'    => $player->only(['id', 'name', 'vellar_id', 'position', 'status']),
        ]);
    }

    // Reject / delete player
    public function rejectPlayer(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $player = User::findOrFail($id);

        if ($player->role !== 'player') {
            return response()->json(['message' => 'This user is not a player.'], 422);
        }

        $name     = $player->name;
        $vellarId = $player->vellar_id;
        $player->delete();

        return response()->json([
            'message' => "Player {$name} ({$vellarId}) has been rejected and removed.",
        ]);
    }

    // Check status endpoint (for WaitingRoom polling)
    public function checkStatus(Request $request)
    {
        $identifier = PlayerLocator::identifier((string) $request->input('vellar_id', ''));
        $attempts = app(AttemptLimiter::class);

        if ($attempts->blocked('check_status', $identifier, $request->ip())) {
            return response()->json(['message' => AuthMessages::TOO_MANY], 429);
        }

        $attempts->hit('check_status', $identifier, $request->ip());

        $vellarNumber = preg_replace('/[^0-9]/', '', $request->input('vellar_id', ''));

        if (empty($vellarNumber)) {
            return response()->json(['message' => 'Invalid Vellar ID.'], 422);
        }

        $email = 'vellar' . $vellarNumber . '@vellarleague.com';
        $user  = User::where('email', $email)->first(['id', 'name', 'vellar_id', 'position', 'status']);

        if (!$user) {
            return response()->json(['message' => 'Player not found.'], 404);
        }

        return response()->json([
            'status'    => $user->status,
            'name'      => $user->name,
            'vellar_id' => $user->vellar_id,
            'position'  => $user->position,
        ]);
    }
}
