<?php

namespace App\Http\Middleware;

use App\Support\AuthMessages;
use App\Support\SharedPassword;
use App\Support\WeakPassword;
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

        if (! $user) {
            return $next($request);
        }

        if ($user->role === 'admin') {
            return $this->guardAdmin($request, $next, $user);
        }

        if ($user->role !== 'player') {
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

    /**
     * When NUVRA_FORCE_ADMIN_PASSWORD_CHANGE is on, an admin on a known
     * default must set a new password before any other action. The flag
     * defaults to off and is separate from player retirement.
     */
    private function guardAdmin(Request $request, Closure $next, $user): Response
    {
        if (! config('nuvra.force_admin_password_change')) {
            return $next($request);
        }

        $mustChange = (bool) $user->password_reset_required;

        if (! $mustChange && $user->sharedPasswordState() !== false) {
            $weak = WeakPassword::matchesStored($user);
            $user->forceFill([
                'password_is_shared' => $weak,
                'password_reset_required' => $weak,
            ])->save();
            $mustChange = $weak;
        }

        if (! $mustChange) {
            return $next($request);
        }

        $changingPassword = $request->is('api/community/admin/password') && $request->isMethod('POST');
        $loggingOut = $request->is('api/community/logout') && $request->isMethod('POST');

        if ($changingPassword || $loggingOut) {
            return $next($request);
        }

        return response()->json([
            'message' => AuthMessages::ADMIN_PASSWORD_CHANGE,
            'password_change_required' => true,
        ], 403);
    }
}
