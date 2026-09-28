<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UatBasicAuth
{
    /**
     * Exemptions, and why each one is skipped:
     *
     * - `up` — Laravel's health route, registered in bootstrap/app.php as `/up`.
     *   Load balancers and deploy probes call it without browser credentials.
     *   Gating it would mark a healthy app as down.
     *
     * No payment-gateway webhook or callback route is registered on this
     * branch (Billplz is not routed here), so none is exempt. A future
     * gateway callback must be added here: the gateway cannot send this
     * password. Browser redirects, including any future OAuth return, are
     * not exempt; the browser repeats the basic-auth credentials.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedUser = config('nuvra.uat_basic_auth.user');
        $expectedPass = config('nuvra.uat_basic_auth.password');

        if (! $this->enabled($expectedUser, $expectedPass)) {
            return $next($request);
        }

        if ($request->is('up')) {
            return $next($request);
        }

        $givenUser = (string) $request->getUser();
        $givenPass = (string) $request->getPassword();

        if (! $this->matches($expectedUser, $expectedPass, $givenUser, $givenPass)) {
            return response('Authentication required.', 401, [
                'WWW-Authenticate' => 'Basic realm="UAT", charset="UTF-8"',
                'Cache-Control' => 'no-store',
            ]);
        }

        return $next($request);
    }

    private function enabled(mixed $user, mixed $password): bool
    {
        return is_string($user) && is_string($password) && filled($user) && filled($password);
    }

    /**
     * Compare both secrets in constant time. Hashing first keeps the
     * compared strings the same length, including when the guess is empty
     * or a different length from the configured password.
     */
    private function matches(string $expectedUser, string $expectedPass, string $givenUser, string $givenPass): bool
    {
        $userOk = hash_equals(hash('sha256', $expectedUser), hash('sha256', $givenUser));
        $passOk = hash_equals(hash('sha256', $expectedPass), hash('sha256', $givenPass));

        return $userOk && $passOk;
    }
}
