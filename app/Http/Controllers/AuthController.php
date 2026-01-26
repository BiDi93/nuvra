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
        $googleUser = Socialite::driver('google')->stateless()->user();

        // 1. Find or Create User
        $user = User::updateOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'password' => Hash::make(Str::random(24)), // Random password for security
                // If you have a 'role' column, make sure to set a default or fetch it
                // 'role' => 'player' 
            ]
        );

        // 2. Generate Token
        $token = $user->createToken('auth_token')->plainTextToken;

        // 3. Check Role & Status (Logic from your smart login)
        $role = $user->role ?? 'player';
        $status = 'active';

        if ($role === 'player') {
            $player = \DB::table('players')->where('email', $user->email)->first();
            $status = $player ? $player->status : 'pending';
        }

        // 4. REDIRECT TO FRONTEND WITH DATA 🚀
        // We send the data as Query Parameters so React can grab them
        //return redirect("http://127.0.0.1:8000/auth/callback?token={$token}&role={$role}&status={$status}&user_id={$user->id}");
        // Uses APP_URL from your .env file automatically!
        $frontendUrl = config('app.url') . "/auth/callback";

return redirect("{$frontendUrl}?token={$token}&role={$role}&status={$status}&user_id={$user->id}");
    }
}