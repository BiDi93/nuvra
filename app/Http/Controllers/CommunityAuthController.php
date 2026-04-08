<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CommunityUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class CommunityAuthController extends Controller
{
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

        return response()->json([
            'message' => 'Registration successful! Welcome to the Nuvra Community.',
            'token'   => $token,
            'user'    => $user,
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

        return response()->json([
            'message' => 'Login successful.',
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
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
