<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class UatBasicAuth
{
    public const COOKIE = 'nuvra_uat_gate';

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
     *
     * The gate never reads an Authorization: Bearer header. Sanctum uses
     * that header. After one successful basic-auth check the response sets
     * a signed HttpOnly cookie, and later API calls send that cookie plus
     * the Bearer token.
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

        if ($this->cookieIsValid($request, $expectedUser, $expectedPass)) {
            return $next($request);
        }

        [$givenUser, $givenPass] = $this->basicCredentials($request);

        if (! $this->matches($expectedUser, $expectedPass, $givenUser, $givenPass)) {
            return response('Authentication required.', 401, [
                'WWW-Authenticate' => 'Basic realm="UAT", charset="UTF-8"',
                'Cache-Control' => 'no-store',
            ]);
        }

        $response = $next($request);
        $response->headers->setCookie($this->gateCookie($expectedUser, $expectedPass));

        return $response;
    }

    private function enabled(mixed $user, mixed $password): bool
    {
        return is_string($user) && is_string($password) && filled($user) && filled($password);
    }

    /**
     * Basic credentials only. A Bearer token is left for Sanctum.
     *
     * @return array{0: string, 1: string}
     */
    private function basicCredentials(Request $request): array
    {
        $header = trim((string) $request->headers->get('Authorization', ''));

        if ($header !== '' && ! str_starts_with(strtolower($header), 'basic ')) {
            return ['', ''];
        }

        if (str_starts_with(strtolower($header), 'basic ')) {
            $decoded = base64_decode(substr($header, 6), true);

            if (! is_string($decoded) || ! str_contains($decoded, ':')) {
                return ['', ''];
            }

            [$user, $pass] = explode(':', $decoded, 2);

            return [$user, $pass];
        }

        return [
            (string) $request->server('PHP_AUTH_USER', ''),
            (string) $request->server('PHP_AUTH_PW', ''),
        ];
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

    private function cookieIsValid(Request $request, string $expectedUser, string $expectedPass): bool
    {
        $raw = (string) $request->cookies->get(self::COOKIE, '');
        $parts = explode('.', $raw, 2);

        if (count($parts) !== 2 || ! ctype_digit($parts[0])) {
            return false;
        }

        $expected = hash_hmac('sha256', $parts[0], $this->signingKey($expectedUser, $expectedPass));

        if (! hash_equals($expected, $parts[1])) {
            return false;
        }

        return (int) $parts[0] >= time();
    }

    private function gateCookie(string $expectedUser, string $expectedPass): Cookie
    {
        $minutes = max(1, (int) config('nuvra.uat_basic_auth.minutes', 480));
        $expires = time() + ($minutes * 60);
        $signature = hash_hmac('sha256', (string) $expires, $this->signingKey($expectedUser, $expectedPass));

        return Cookie::create(self::COOKIE)
            ->withValue($expires.'.'.$signature)
            ->withExpires($expires)
            ->withPath('/')
            ->withSecure(true)
            ->withHttpOnly(true)
            ->withSameSite(Cookie::SAMESITE_LAX)
            ->withRaw(true);
    }

    private function signingKey(string $user, string $password): string
    {
        return hash_hmac('sha256', $user."\0".$password, (string) config('app.key'));
    }
}
