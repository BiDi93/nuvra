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
            // Get user info from Google
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Check if this user already exists (by Email or Google ID)
            $user = User::where('email', $googleUser->getEmail())
                        ->orWhere('google_id', $googleUser->getId())
                        ->first();

            $isNewUser = false;

            if (!$user) {
                // SCENARIO A: Brand new user -> Create them!
                $isNewUser = true;
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(16)), // Random secure password
                    'role' => 'player' // Default role (we can change this later)
                ]);
            } else {
                // SCENARIO B: Existing user -> Update their avatar/ID just in case
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            }

            // Create a Token for them (So React can call the API)
            $token = $user->createToken('auth_token')->plainTextToken;

            // DECIDE WHERE TO SEND THEM
            // We redirect back to your Frontend (React) with the token in the URL.
            // React will grab this token and save it.
            
            // If they are brand new, send to "Onboarding" (Pick Team)
            // If they are old, send to "Dashboard"
            $targetPage = $isNewUser ? '/onboarding' : '/dashboard';
            
            // NOTE: Change 'http://localhost:8000' to your actual frontend URL if different
            return redirect("http://localhost:8000{$targetPage}?token={$token}&user_id={$user->id}");

        } catch (\Exception $e) {
            return response()->json(['error' => 'Login failed: ' . $e->getMessage()], 500);
        }
    }
}