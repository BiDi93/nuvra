<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\NotSharedDefaultPassword;
use App\Rules\PlayerPassword;
use App\Support\AttemptLimiter;
use App\Support\AttemptResponse;
use App\Support\AuthMessages;
use App\Support\PlayerContact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
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

        $identifier = 'email:'.$email;

        if ($denied = AttemptResponse::ifBlocked($attempts, 'forgot_password', $identifier, $request->ip())) {
            return $denied;
        }

        $attempts->hit('forgot_password', $identifier, $request->ip());

        $user = User::where('email', $request->email)->first();

        // Placeholder @vellarleague.com addresses are login keys, not inboxes.
        // Send after the response so a live mailer does not reveal that the address exists.
        if ($user && PlayerContact::usableEmail($user->email)) {
            $inbox = $user->email;
            $sent = false;
            app()->terminating(function () use (&$sent, $inbox) {
                if ($sent) {
                    return;
                }
                $sent = true;
                Password::broker()->sendResetLink(['email' => $inbox]);
            });
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
            'password' => ['required', 'string', 'confirmed', new PlayerPassword, new NotSharedDefaultPassword],
        ]);

        $attempts = app(AttemptLimiter::class);
        $identifier = 'email:'.strtolower($request->email);

        if ($denied = AttemptResponse::ifBlocked($attempts, 'password_reset', $identifier, $request->ip())) {
            return $denied;
        }

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => $password,
                    'password_reset_required' => false,
                    'password_is_shared' => false,
                    'password_is_shared_verified' => null,
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status != Password::PASSWORD_RESET) {
            $attempts->hit('password_reset', $identifier, $request->ip());

            return response()->json(['message' => AuthMessages::RESET_FAILED, 'status' => 'error'], 400);
        }

        return response()->json(['message' => __($status), 'status' => 'success']);
    }
}
