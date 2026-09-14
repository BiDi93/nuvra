<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CommunityAuthController extends Controller
{
    // ── Google OAuth ──────────────────────────────────────────────────────────
    public function redirectToGoogle()
    {
        return \Laravel\Socialite\Facades\Socialite::driver('google')
            ->stateless()
            ->with(['state' => 'portal=community'])
            ->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->user();

            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name'      => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                    'avatar'    => $googleUser->getAvatar(),
                    'password'  => Hash::make(Str::random(24)),
                    'role'      => 'player',
                    'status'    => 'active',
                ]
            );

            $token = $user->createToken('community_token')->plainTextToken;

            $frontendUrl = config('app.url');
            return redirect("{$frontendUrl}/community/auth/callback?token={$token}&id={$user->id}&name=" . urlencode($user->name) . "&role={$user->role}");

        } catch (\Exception $e) {
            \Log::error("Community Google Auth error: " . $e->getMessage());
            return redirect(config('app.url') . "/community?error=google_failed");
        }
    }

    // ── Register (Pemain Baharu) ───────────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'phone'                 => 'nullable|string|max:20',
            'position'              => 'nullable|string|max:100',
            'password'              => 'required|string|min:6|confirmed',
        ]);

        // Auto-increment Vellar ID: ambil nombor tertinggi + 1
        $maxNumber = User::whereNotNull('vellar_id')
            ->get()
            ->map(fn($u) => (int) preg_replace('/[^0-9]/', '', $u->vellar_id))
            ->max() ?? 0;

        $nextNumber = $maxNumber + 1;
        $vellarId   = 'VELLAR ' . $nextNumber;
        $email      = 'vellar' . $nextNumber . '@vellarleague.com';

        // Pastikan email/vellar_id unik (edge case)
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
            'status'    => 'pending',   // Tunggu kelulusan admin
            'vellar_id' => $vellarId,
            'phone'     => $request->phone ?? null,
            'position'  => $request->position ?? null,
        ]);

        // Pemain pending tidak dapat token — kena tunggu approve dulu
        return response()->json([
            'message'       => 'Pendaftaran berjaya! Sila tunggu kelulusan admin.',
            'vellar_id'     => $vellarId,
            'vellar_number' => $nextNumber,
            'name'          => $user->name,
            'status'        => 'pending',
        ], 201);
    }

    // ── Login (Guna Vellar ID Number atau Email untuk Admin) ───────────────────
    public function login(Request $request)
    {
        $request->validate([
            'vellar_id' => 'required',
            'password'  => 'required',
        ]);

        $input = trim($request->vellar_id);

        // Jika input ada '@' → rawat sebagai email (untuk admin/organizer)
        if (str_contains($input, '@')) {
            $email = $input;
        } else {
            // Bina email dari nombor vellar_id
            $vellarNumber = preg_replace('/[^0-9]/', '', $input);

            if (empty($vellarNumber)) {
                return response()->json(['message' => 'Vellar ID tidak sah. Masukkan nombor sahaja (cth: 82).'], 422);
            }

            $email = 'vellar' . $vellarNumber . '@vellarleague.com';
        }

        // Cari user
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Vellar ID atau kata laluan tidak betul.'], 401);
        }

        // Semak status
        if ($user->status === 'pending') {
            return response()->json([
                'message' => 'Akaun anda masih menunggu kelulusan admin. Sila cuba sebentar lagi.',
                'status'  => 'pending',
            ], 403);
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Akaun anda telah digantung. Sila hubungi admin untuk maklumat lanjut.',
                'status'  => 'suspended',
            ], 403);
        }

        $token = $user->createToken('community_token')->plainTextToken;

        return response()->json([
            'message'    => 'Log masuk berjaya.',
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
        return response()->json(['message' => 'Log keluar berjaya.']);
    }

    // ── Me ────────────────────────────────────────────────────────────────────
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // =========================================================================
    // ADMIN — Player Approval Management
    // =========================================================================

    // Senarai pemain pending
    public function pendingPlayers(Request $request)
    {
        // Only admin/club_owner can access
        if (!in_array($request->user()->role, ['club_owner', 'admin'])) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
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

    // Approve pemain
    public function approvePlayer(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_owner', 'admin'])) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $player = User::findOrFail($id);

        if ($player->role !== 'player') {
            return response()->json(['message' => 'Pengguna ini bukan pemain.'], 422);
        }

        $player->update(['status' => 'active']);

        return response()->json([
            'message'   => "Pemain {$player->name} ({$player->vellar_id}) telah diluluskan.",
            'player'    => $player->only(['id', 'name', 'vellar_id', 'position', 'status']),
        ]);
    }

    // Reject / delete pemain
    public function rejectPlayer(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['club_owner', 'admin'])) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $player = User::findOrFail($id);

        if ($player->role !== 'player') {
            return response()->json(['message' => 'Pengguna ini bukan pemain.'], 422);
        }

        $name     = $player->name;
        $vellarId = $player->vellar_id;
        $player->delete();

        return response()->json([
            'message' => "Pemain {$name} ({$vellarId}) telah ditolak dan dipadam.",
        ]);
    }

    // Semak status sendiri (untuk WaitingRoom polling)
    public function checkStatus(Request $request)
    {
        $vellarNumber = preg_replace('/[^0-9]/', '', $request->input('vellar_id', ''));

        if (empty($vellarNumber)) {
            return response()->json(['message' => 'Vellar ID tidak sah.'], 422);
        }

        $email = 'vellar' . $vellarNumber . '@vellarleague.com';
        $user  = User::where('email', $email)->first(['id', 'name', 'vellar_id', 'position', 'status']);

        if (!$user) {
            return response()->json(['message' => 'Pemain tidak dijumpai.'], 404);
        }

        return response()->json([
            'status'    => $user->status,
            'name'      => $user->name,
            'vellar_id' => $user->vellar_id,
            'position'  => $user->position,
        ]);
    }
}
