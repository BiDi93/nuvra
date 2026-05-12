<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CommunityUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class CommunityAuthController extends Controller
{
    // ── Google OAuth ──────────────────────────────────────────────────────────
    public function redirectToGoogle()
    {
        // Use a different state or redirect path for community to distinguish from main app if needed
        return \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->user();

            // 1. Find or Create Unified User
            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name'      => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                    'avatar'    => $googleUser->getAvatar(),
                    'password'  => Hash::make(\Illuminate\Support\Str::random(24)),
                    'role'      => 'community_player', // Default role for community login
                ]
            );

            // 2. Ensure Community Profile exists
            $communityUser = CommunityUser::where('user_id', $user->id)->first();
            if (!$communityUser) {
                $communityUser = CommunityUser::create([
                    'user_id' => $user->id,
                    'name'    => $user->name,
                    'email'   => $user->email,
                    'role'    => 'player',
                    'avatar'  => $user->avatar,
                ]);
            }

            // 3. Generate Token
            $token = $user->createToken('community_token')->plainTextToken;

            // 4. Redirect back to frontend
            // Note: You may want a specific callback route for community
            $frontendUrl = config('app.url');
            return redirect("{$frontendUrl}/community/auth/callback?token={$token}&id={$communityUser->id}&name=" . urlencode($user->name) . "&role={$communityUser->role}");

        } catch (\Exception $e) {
            \Log::error("Community Google Auth error: " . $e->getMessage());
            return redirect(config('app.url') . "/community/login?error=google_failed");
        }
    }

    // ── Register ──────────────────────────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        // Create unified User
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'community_player',
            'phone'    => $request->phone ?? null,
        ]);

        // Create Community Profile
        CommunityUser::create([
            'user_id' => $user->id,
            'name'    => $user->name,
            'email'   => $user->email,
            'role'    => 'player',
            'phone'   => $user->phone,
        ]);

        $token = $user->createToken('community_token')->plainTextToken;

        $communityProfile = \Illuminate\Support\Facades\DB::table('community_users')
            ->where('user_id', $user->id)
            ->first();

        return response()->json([
            'message' => 'Registration successful! Welcome to the Nuvra Community.',
            'token'   => $token,
            'user'    => [
                'id'    => $communityProfile->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $communityProfile->role,
            ],
        ], 201);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('community_token')->plainTextToken;

        // Fetch community profile for role and community_user id
        $communityUser = \Illuminate\Support\Facades\DB::table('community_users')
            ->where('user_id', $user->id)
            ->first();

        return response()->json([
            'message' => 'Login successful.',
            'token'   => $token,
            'user'    => [
                'id'    => $communityUser ? $communityUser->id : $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $communityUser ? $communityUser->role : 'player',
            ],
        ]);
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    // ── Get Current User (me) ─────────────────────────────────────────────────
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
            'phone' => $user->phone,
        ]);
    }
}
