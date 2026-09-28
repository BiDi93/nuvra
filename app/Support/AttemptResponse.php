<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class AttemptResponse
{
    public static function ifBlocked(AttemptLimiter $limiter, string $action, string $identifier, ?string $ip): ?JsonResponse
    {
        $wait = $limiter->retryAfter($action, $identifier, $ip);

        if ($wait < 1) {
            return null;
        }

        return response()->json([
            'message' => AuthMessages::TOO_MANY,
            'retry_after' => $wait,
        ], 429, [
            'Retry-After' => (string) $wait,
        ]);
    }
}
