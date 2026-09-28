<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\PlayerPassword;
use App\Services\PlayerVerificationService;
use App\Support\AttemptLimiter;
use App\Support\AttemptResponse;
use App\Support\AuthMessages;
use App\Support\PlayerContact;
use App\Support\PlayerLocator;
use Illuminate\Http\Request;

class CommunityPasswordResetController extends Controller
{
    public function __construct(
        private PlayerVerificationService $verification,
        private AttemptLimiter $attempts,
    ) {}

    public function requestReset(Request $request)
    {
        $request->validate([
            'vellar_id' => 'required|string|max:255',
        ]);

        $identifier = PlayerLocator::identifier($request->vellar_id);

        if ($denied = AttemptResponse::ifBlocked($this->attempts, 'password_request', $identifier, $request->ip())) {
            return $denied;
        }

        $this->attempts->hit('password_request', $identifier, $request->ip());
        $this->verification->requestForLogin($request->vellar_id);

        return response()->json(['message' => AuthMessages::resetSent()]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'nullable|string|max:200',
            'vellar_id' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:50',
            'password' => ['required', 'string', 'confirmed', new PlayerPassword],
        ]);

        if (filled($request->token)) {
            return $this->resetWithEmailToken($request);
        }

        $identifier = PlayerLocator::identifier((string) $request->input('vellar_id', ''));

        if ($denied = AttemptResponse::ifBlocked($this->attempts, 'password_reset', $identifier, $request->ip())) {
            return $denied;
        }

        if (! filled($request->vellar_id) || ! filled($request->code)) {
            $this->attempts->hit('password_reset', $identifier, $request->ip());

            return response()->json(['message' => AuthMessages::RESET_FAILED], 422);
        }

        $saved = $this->verification->resetWithSecret(
            $request->input('vellar_id'),
            $request->input('code'),
            $request->password,
        );

        if (! $saved) {
            $this->attempts->hit('password_reset', $identifier, $request->ip());

            return response()->json(['message' => AuthMessages::RESET_FAILED], 422);
        }

        $this->attempts->clearIdentifier('password_reset', $identifier);

        return response()->json(['message' => AuthMessages::RESET_SAVED]);
    }

    /**
     * Email links only. A 6-digit SMS code or an admin code is rejected here.
     * Backoff is the caller IP, not the token.
     */
    private function resetWithEmailToken(Request $request)
    {
        $ip = (string) $request->ip();

        if ($denied = AttemptResponse::ifIpBlocked($this->attempts, 'password_reset', $ip)) {
            return $denied;
        }

        $saved = $this->verification->resetWithEmailToken((string) $request->token, (string) $request->password);

        if (! $saved) {
            $this->attempts->hitIp('password_reset', $ip);

            return response()->json(['message' => AuthMessages::RESET_FAILED], 422);
        }

        return response()->json(['message' => AuthMessages::RESET_SAVED]);
    }

    public function issueActivationCode(Request $request, $id)
    {
        $player = User::find($id);

        if (! $player || $player->role !== 'player') {
            return response()->json(['message' => 'Player not found.'], 404);
        }

        if (! $request->user()->can('issueActivationCode', $player)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $issued = $this->verification->issueAdminCode($player, $request->user()->id, 'admin_api');

        if (! $issued) {
            $wait = $this->attempts->retryAfter('activation_code', 'player:'.$player->id, null);

            return response()->json([
                'message' => AuthMessages::TOO_MANY,
                'retry_after' => max(1, $wait),
            ], 429, ['Retry-After' => (string) max(1, $wait)]);
        }

        return response()->json([
            'message' => 'Give this code to the player in person. It is shown only once. The password is not included.',
            'activation_code' => $issued['code'],
            'expires_at' => $issued['expires_at']->toIso8601String(),
            'can_receive_email' => PlayerContact::canReceiveEmail($player),
            'can_receive_sms' => PlayerContact::canReceiveSms($player) && app(\App\Contracts\SmsSender::class)->enabled(),
        ]);
    }
}
