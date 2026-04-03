<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CommunityAuthController extends Controller
{
    // ── Register ──────────────────────────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:community_users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = DB::table('community_users')->insertGetId([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role'       => 'player',
            'phone'      => $request->phone ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = Str::random(60);

        DB::table('community_users')->where('id', $user)->update([
            'remember_token' => $token,
        ]);

        return response()->json([
            'message' => 'Registration successful! Welcome to the Nuvra Community.',
            'token'   => $token,
            'user'    => DB::table('community_users')->where('id', $user)->first(),
        ], 201);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = DB::table('community_users')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $token = Str::random(60);

        DB::table('community_users')->where('id', $user->id)->update([
            'remember_token' => $token,
            'updated_at'     => now(),
        ]);

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
        $token = $request->bearerToken();

        if ($token) {
            DB::table('community_users')->where('remember_token', $token)->update([
                'remember_token' => null,
                'updated_at'     => now(),
            ]);
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    // ── Get Current User (me) ─────────────────────────────────────────────────
    public function me(Request $request)
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = DB::table('community_users')->where('remember_token', $token)->first();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
            'phone' => $user->phone,
        ]);
    }
}
