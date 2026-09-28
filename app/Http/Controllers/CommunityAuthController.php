<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\PlayerPassword;
use App\Rules\StrongPassword;
use App\Support\AttemptLimiter;
use App\Support\AttemptResponse;
use App\Support\AuthMessages;
use App\Support\PlayerLocator;
use App\Support\SharedPassword;
use App\Support\WeakPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CommunityAuthController extends Controller
{
    // ── Register (New Player) ──────────────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:100',
            'password' => ['required', 'string', 'confirmed', new PlayerPassword],
        ]);

        // Auto-increment Vellar ID: get highest number + 1
        $maxNumber = User::whereNotNull('vellar_id')
            ->get()
            ->map(fn ($u) => (int) preg_replace('/[^0-9]/', '', $u->vellar_id))
            ->max() ?? 0;

        $nextNumber = $maxNumber + 1;
        $vellarId = 'VELLAR '.$nextNumber;
        $email = 'vellar'.$nextNumber.'@vellarleague.com';

        // Ensure email/vellar_id is unique (edge case check)
        while (User::where('email', $email)->exists()) {
            $nextNumber++;
            $vellarId = 'VELLAR '.$nextNumber;
            $email = 'vellar'.$nextNumber.'@vellarleague.com';
        }

        $statusToken = Str::random(40);

        $user = User::create([
            'name' => $request->name,
            'email' => $email,
            'password' => Hash::make($request->password),
            'role' => 'player',
            'status' => 'pending',   // Awaiting admin approval
            'vellar_id' => $vellarId,
            'phone' => $request->phone ?? null,
            'position' => $request->position ?? null,
        ]);
        $user->forceFill(['status_token' => hash('sha256', $statusToken)])->save();

        return response()->json([
            'message' => 'Registration successful! Awaiting admin approval.',
            'vellar_id' => $vellarId,
            'vellar_number' => $nextNumber,
            'name' => $user->name,
            'status' => 'pending',
            'status_token' => $statusToken,
        ], 201);
    }

    // ── Login (Vellar ID Number or Email for Admin) ───────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'vellar_id' => 'required',
            'password' => 'required',
        ]);

        $input = trim($request->vellar_id);
        $identifier = PlayerLocator::identifier($input);
        $attempts = app(AttemptLimiter::class);

        if ($denied = AttemptResponse::ifBlocked($attempts, 'login', $identifier, $request->ip())) {
            return $denied;
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
        $isPlayer = $user && $user->role === 'player';
        $submittedShared = SharedPassword::same((string) $request->password);

        if ($isPlayer && $passwordMatches) {
            $user->forceFill(['password_is_shared' => $submittedShared])->save();
        }

        $forcedReset = $isPlayer && $passwordMatches && (
            $user->password_reset_required
            || (SharedPassword::retirementEnabled() && $submittedShared)
        );

        if ($forcedReset) {
            SharedPassword::requireReset($user);
            $attempts->hit('login', $identifier, $request->ip());

            return response()->json([
                'message' => AuthMessages::SET_PASSWORD,
                'password_reset_required' => true,
            ], 403);
        }

        if (! $user || ! $passwordMatches) {
            $attempts->hit('login', $identifier, $request->ip());

            return response()->json(['message' => AuthMessages::LOGIN_FAILED], 401);
        }

        if (config('nuvra.force_admin_password_change') && $user->role === 'admin' && WeakPassword::isKnown((string) $request->password)) {
            $user->forceFill([
                'password_reset_required' => true,
                'password_is_shared' => true,
                'remember_token' => Str::random(60),
            ])->save();
            $user->tokens()->delete();
            $attempts->clearIdentifier('login', $identifier);

            return response()->json([
                'message' => AuthMessages::ADMIN_PASSWORD_CHANGE,
                'password_change_required' => true,
                'token' => $user->createToken('admin-password-change', ['admin:password'])->plainTextToken,
            ]);
        }

        $attempts->clearIdentifier('login', $identifier);

        // Check account status
        if ($user->status === 'pending') {
            return response()->json([
                'message' => 'Your account is pending admin approval. Please check back shortly.',
                'status' => 'pending',
            ], 403);
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact support/admin.',
                'status' => 'suspended',
            ], 403);
        }

        $token = $user->createToken('community_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'status' => $user->status,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'vellar_id' => $user->vellar_id,
                'position' => $user->position,
                'club_name' => $user->club_name,
                'avatar' => $user->avatar,
            ],
        ]);
    }

    // ── Admin password change (no email or SMS) ───────────────────────────────
    public function changeAdminPassword(Request $request)
    {
        $user = $request->user();

        if (! $user || $user->role !== 'admin' || ! $user->tokenCan('admin:password')) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', 'confirmed', new StrongPassword],
        ]);

        $attempts = app(AttemptLimiter::class);
        $identifier = 'admin:'.$user->id;

        if ($denied = AttemptResponse::ifBlocked($attempts, 'admin_password', $identifier, $request->ip())) {
            return $denied;
        }

        if (! Hash::check((string) $request->current_password, $user->password)) {
            $attempts->hit('admin_password', $identifier, $request->ip());

            return response()->json(['message' => 'The current password is incorrect.'], 422);
        }

        if (Hash::check((string) $request->password, $user->password)) {
            return response()->json(['message' => 'Choose a different password.'], 422);
        }

        $user->forceFill([
            'password' => $request->password,
            'password_reset_required' => false,
            'password_is_shared' => false,
            'remember_token' => Str::random(60),
        ])->save();
        $user->tokens()->delete();
        $attempts->clearIdentifier('admin_password', $identifier);

        return response()->json([
            'message' => 'Your password has been updated.',
            'token' => $user->createToken('community_token', ['*'])->plainTextToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
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
        if (! $request->user()->can('viewAny', User::class)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $players = User::where('status', 'pending')
            ->where('role', 'player')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'vellar_id', 'position', 'phone', 'status', 'created_at']);

        return response()->json([
            'count' => $players->count(),
            'players' => $players,
        ]);
    }

    // Approve player
    public function approvePlayer(Request $request, $id)
    {
        $player = User::findOrFail($id);

        if (! $request->user()->can('reviewRegistration', $player)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $player->update(['status' => 'active']);

        return response()->json([
            'message' => "Player {$player->name} ({$player->vellar_id}) has been approved.",
            'player' => $player->only(['id', 'name', 'vellar_id', 'position', 'status']),
        ]);
    }

    // Reject / delete player
    public function rejectPlayer(Request $request, $id)
    {
        $player = User::findOrFail($id);

        if (! $request->user()->can('reviewRegistration', $player)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $name = $player->name;
        $vellarId = $player->vellar_id;
        $player->delete();

        return response()->json([
            'message' => "Player {$name} ({$vellarId}) has been rejected and removed.",
        ]);
    }

    // Registration status. A Vellar number alone never reveals whether it exists.
    public function checkStatus(Request $request)
    {
        $identifier = PlayerLocator::identifier((string) $request->input('vellar_id', ''));
        $attempts = app(AttemptLimiter::class);

        if ($denied = AttemptResponse::ifBlocked($attempts, 'check_status', $identifier, $request->ip())) {
            return $denied;
        }

        $attempts->hit('check_status', $identifier, $request->ip());

        $vellarNumber = preg_replace('/[^0-9]/', '', (string) $request->input('vellar_id', ''));
        $user = $vellarNumber !== ''
            ? User::where('email', 'vellar'.$vellarNumber.'@vellarleague.com')->first()
            : null;

        $presented = (string) $request->input('status_token', '');
        $stored = (string) ($user->status_token ?? '');
        $known = $user && $presented !== '' && $stored !== '' && hash_equals($stored, hash('sha256', $presented));

        if (! $known) {
            hash_equals(hash('sha256', $presented), hash('sha256', 'missing-registration'));

            return response()->json(['message' => AuthMessages::STATUS_PRIVATE]);
        }

        return response()->json([
            'status' => $user->status,
            'name' => $user->name,
            'vellar_id' => $user->vellar_id,
            'position' => $user->position,
        ]);
    }
}
