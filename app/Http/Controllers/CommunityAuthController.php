<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\NotSharedDefaultPassword;
use App\Rules\StrongPassword;
use App\Services\PlayerRegistrationService;
use App\Support\AttemptLimiter;
use App\Support\AttemptResponse;
use App\Support\AuthMessages;
use App\Support\PasswordConfiguration;
use App\Support\PlayerLocator;
use App\Support\SharedPassword;
use App\Support\WeakPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CommunityAuthController extends Controller
{
    // ── Register (New Player) ──────────────────────────────────────────────────
    public function register(Request $request, PlayerRegistrationService $registration)
    {
        return $registration->register($request);
    }

    public function resendConfirmation(Request $request, PlayerRegistrationService $registration)
    {
        return $registration->resend($request);
    }

    public function confirmEmail(Request $request, PlayerRegistrationService $registration)
    {
        $token = (string) ($request->json('token') ?? $request->request->get('token') ?? '');

        return response()->json([
            'status' => $registration->confirm($token),
        ]);
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

                return response()->json(['message' => 'Invalid Vellar ID. Please enter numbers only (e.g. 123).'], 422);
            }
        }

        $user = PlayerLocator::find($input);

        // A fixed hash keeps a missing account on the same cost as a real one.
        $hash = $user?->password ?? '$2y$12$0JVSj34kuHi7I8AV0oUaiOyzOqJPIGbVFHHTJZcfAHiiOlAH5CbVy';
        $passwordMatches = Hash::check($request->password, $hash);
        $isPlayer = $user && $user->role === 'player';

        if ($passwordMatches && $isPlayer && PasswordConfiguration::retirementIsInvalid()) {
            PasswordConfiguration::report();

            return response()->json(['message' => AuthMessages::PASSWORD_CHECKS_UNCONFIGURED], 503);
        }

        if ($passwordMatches && $user && $user->role === 'admin' && PasswordConfiguration::adminForceIsInvalid()) {
            PasswordConfiguration::report();

            return response()->json(['message' => AuthMessages::PASSWORD_CHECKS_UNCONFIGURED], 503);
        }

        $submittedShared = SharedPassword::configuredValue() !== null
            && SharedPassword::same((string) $request->password);

        if ($isPlayer && $passwordMatches && SharedPassword::configuredValue() !== null) {
            $user->forceFill([
                'password_is_shared' => $submittedShared,
                'password_is_shared_verified' => true,
            ])->save();
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

        if ($user->mustConfirmRegistrationEmail()) {
            return response()->json([
                'message' => AuthMessages::SIGNUP_UNCONFIRMED,
            ], 403);
        }

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
            'password' => ['required', 'string', 'confirmed', new StrongPassword, new NotSharedDefaultPassword],
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
            ->get(['id', 'name', 'position', 'phone', 'status', 'created_at', 'email_verified_at', 'contact_email_source', 'pending_contact_email', 'role']);

        return response()->json([
            'count' => $players->count(),
            'players' => $players->map(fn (User $player) => [
                'id' => $player->id,
                'name' => $player->name,
                'position' => $player->position,
                'phone' => $player->phone,
                'status' => $player->status,
                'created_at' => $player->created_at,
                'email_confirmed' => ! $player->mustConfirmRegistrationEmail(),
                'expired' => $player->registrationIsExpired(),
            ])->values(),
        ]);
    }

    // Approve player
    public function approvePlayer(Request $request, $id)
    {
        $player = User::findOrFail($id);

        if (! $request->user()->can('reviewRegistration', $player)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $registration = app(PlayerRegistrationService::class);

        if ($player->registrationIsExpired()) {
            return response()->json([
                'message' => 'This registration has expired. It cannot be approved.',
            ], 422);
        }

        if ($player->mustConfirmRegistrationEmail()) {
            return response()->json([
                'message' => 'This registration is not confirmed yet.',
            ], 422);
        }

        $player->update(['status' => 'active']);
        $registration->writeAudit($player, $request->user(), 'approve');
        $registration->sendApproval($player);

        return response()->json([
            'message' => "Player {$player->name} has been approved.",
            'player' => $player->only(['id', 'name', 'position', 'status']),
        ]);
    }

    // Reject / delete player
    public function rejectPlayer(Request $request, $id)
    {
        $player = User::findOrFail($id);

        if (! $request->user()->can('reviewRegistration', $player)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $registration = app(PlayerRegistrationService::class);
        $name = $player->name;
        $registration->sendRejection($player);
        $registration->writeAudit($player, $request->user(), 'reject');
        $player->delete();

        return response()->json([
            'message' => "Player {$name} has been rejected and removed.",
        ]);
    }

    // Registration status. Only the opaque token from the confirmation email is accepted.
    public function checkStatus(Request $request, PlayerRegistrationService $registration)
    {
        $presented = $request->isJson()
            ? $request->json('status_token')
            : $request->request->get('status_token');
        $presented = is_string($presented) ? $presented : '';
        $identifier = hash('sha256', $presented !== '' ? $presented : 'missing-registration');
        $attempts = app(AttemptLimiter::class);

        if ($denied = AttemptResponse::ifBlocked($attempts, 'check_status', $identifier, $request->ip())) {
            return $denied;
        }

        $attempts->hit('check_status', $identifier, $request->ip());

        $digest = hash('sha256', $presented !== '' ? $presented : 'missing-registration');
        $user = User::query()->where('status_token', $digest)->first();
        hash_equals($digest, hash('sha256', 'missing-registration'));

        if (! $user || ! hash_equals((string) $user->status_token, $digest)) {
            return response()->json([
                'status' => 'rejected_or_expired',
            ]);
        }

        return response()->json([
            'status' => $registration->publicStatus($user),
        ]);
    }
}
