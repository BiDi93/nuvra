<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AttemptLimiter;
use App\Support\AuthMessages;
use App\Support\PlayerContact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class NewPasswordController extends Controller
{
    /**
     * Send a password reset link to the given user.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $email = strtolower($request->email);
        $attempts = app(AttemptLimiter::class);

        if ($attempts->blocked('forgot_password', 'email:'.$email, $request->ip())) {
            return response()->json(['message' => AuthMessages::TOO_MANY], 429);
        }

        $attempts->hit('forgot_password', 'email:'.$email, $request->ip());

        $user = User::where('email', $request->email)->first();

        // Placeholder @vellarleague.com addresses are login keys, not inboxes.
        if ($user && PlayerContact::usableEmail($user->email)) {
            Password::broker()->sendResetLink(['email' => $user->email]);
        }

        return response()->json([
            'message' => AuthMessages::FORGOT_GENERIC,
            'status' => 'success',
        ]);
    }

    /**
     * Reset the user's password.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $attempts = app(AttemptLimiter::class);
        $identifier = 'email:'.strtolower($request->email);

        if ($attempts->blocked('password_reset', $identifier, $request->ip())) {
            return response()->json(['message' => AuthMessages::TOO_MANY], 429);
        }

        // Attempt to reset the user's password
        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();
            }
        );

        if ($status != Password::PASSWORD_RESET) {
            $attempts->hit('password_reset', $identifier, $request->ip());

            return response()->json(['message' => AuthMessages::RESET_FAILED, 'status' => 'error'], 400);
        }

        return response()->json(['message' => __($status), 'status' => 'success']);
    }
}
