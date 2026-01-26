<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // Redirect the user to Google's Login Page
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    // Handle the user coming back from Google
public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            // 1. Find or Create User
            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(24)),
                    // Default role to player if not set
                    'role' => 'player' 
                ]
            );

            // 2. Generate Token
            $token = $user->createToken('auth_token')->plainTextToken;

            // 3. CHECK FOR PLAYER PROFILE (The Fix 🛠️)
            $player = \DB::table('players')->where('email', $user->email)->first();
            
            // Use config('app.url') so it works on Local AND Production automatically
            $frontendUrl = config('app.url'); 

            // CASE A: New Player (No Profile) -> Send to Onboarding
            // We verify they are NOT a coach, and they have NO player record
            if (!$player && $user->role !== 'coach') {
                return redirect("{$frontendUrl}/onboarding?token={$token}&user_id={$user->id}");
            }

            // CASE B: Existing Player or Coach -> Proceed as normal
            $role = $user->role ?? 'player';
            
            // If it's a coach, they are always 'active'. If player, use their DB status.
            $status = 'active';
            if ($player) {
                $status = $player->status;
            }

            return redirect("{$frontendUrl}/auth/callback?token={$token}&role={$role}&status={$status}&user_id={$user->id}");

        } catch (\Exception $e) {
            // Optional: Log the error if needed
            return redirect(config('app.url') . "/login?error=google_failed");
        }
    }
}