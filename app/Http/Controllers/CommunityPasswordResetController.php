<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\NotSharedDefaultPassword;
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

        return response()->json(['message' => AuthMessages::RESET_SENT]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'nullable|string|max:200',
            'vellar_id' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:50',
            'password' => ['required', 'string', 'min:8', 'confirmed', new NotSharedDefaultPassword],
        ]);

        $identifier = filled($request->token)
            ? 'token:'.hash('sha256', (string) $request->token)
            : PlayerLocator::identifier((string) $request->input('vellar_id', ''));

        if ($denied = AttemptResponse::ifBlocked($this->attempts, 'password_reset', $identifier, $request->ip())) {
            return $denied;
        }

        if (! filled($request->token) && (! filled($request->vellar_id) || ! filled($request->code))) {
            $this->attempts->hit('password_reset', $identifier, $request->ip());

            return response()->json(['message' => AuthMessages::RESET_FAILED], 422);
        }

        $saved = $this->verification->resetWithSecret(
            $request->input('token'),
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
