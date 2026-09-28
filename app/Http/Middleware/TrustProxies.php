<?php

namespace App\Http\Middleware;

use App\Support\CloudflareProxies;
use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    /**
     * Forwarded headers accepted from a trusted proxy. The AWS ELB header
     * is not included. The proxy list itself is read in proxies() so this
     * class can be registered before configuration is loaded.
     *
     * @var int
     */
    protected $headers = Request::HEADER_X_FORWARDED_FOR
        | Request::HEADER_X_FORWARDED_HOST
        | Request::HEADER_X_FORWARDED_PORT
        | Request::HEADER_X_FORWARDED_PROTO;

    /**
     * Resolve on each request. Calling config() while the HTTP kernel is
     * created would run before Laravel loads configuration.
     *
     * @return array<int, string>
     */
    protected function proxies()
    {
        return CloudflareProxies::configured();
    }
}
