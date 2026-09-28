<?php

namespace App\Http\Middleware;

use App\Support\CloudflareProxies;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpFoundation\Response;

class PreferCloudflareConnectingIp
{
    /**
     * When the socket peer is a trusted proxy, prefer CF-Connecting-IP.
     * Otherwise leave X-Forwarded-For for TrustProxies, which ignores it
     * unless that peer is trusted. This middleware never trusts every proxy.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $remote = (string) $request->server->get('REMOTE_ADDR', '');
        $trusted = CloudflareProxies::configured();

        if ($remote !== '' && $trusted !== [] && IpUtils::checkIp($remote, $trusted)) {
            $connecting = $request->headers->get('CF-Connecting-IP');

            if (is_string($connecting) && filter_var($connecting, FILTER_VALIDATE_IP)) {
                $request->headers->set('X-Forwarded-For', $connecting);
            }
        }

        return $next($request);
    }
}
