<?php

namespace App\Services\Sms;

use App\Contracts\SmsSender;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class HttpSmsSender implements SmsSender
{
    public function enabled(): bool
    {
        return config('nuvra.sms.driver') === 'http' && filled(config('nuvra.sms.url'));
    }

    public function send(string $phoneDigits, string $message): void
    {
        if (! $this->enabled()) {
            throw new RuntimeException('SMS is not configured.');
        }

        $request = Http::timeout(10)->acceptJson();
        $token = config('nuvra.sms.token');

        if (filled($token)) {
            $request = $request->withToken($token);
        }

        $response = $request->post(config('nuvra.sms.url'), [
            'to' => $phoneDigits,
            'message' => $message,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('SMS provider rejected the message.');
        }
    }
}
