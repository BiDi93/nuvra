<?php

namespace App\Http\Middleware;

use App\Support\AuthMessages;
use App\Support\SharedPassword;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceVerifiedReset
{
    /**
     * A player still on the shared default, once retirement is enabled, or a
     * player already marked for reset, cannot use an existing session.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'player') {
            return $next($request);
        }

        $retired = $user->password_reset_required
            || (SharedPassword::retirementEnabled() && SharedPassword::usesSharedPassword($user));

        if (! $retired) {
            return $next($request);
        }

        if (SharedPassword::retirementEnabled() && SharedPassword::usesSharedPassword($user)) {
            SharedPassword::requireReset($user);
        } else {
            $user->tokens()->delete();
        }

        return response()->json(['message' => AuthMessages::RESET_REQUIRED], 401);
    }
}
