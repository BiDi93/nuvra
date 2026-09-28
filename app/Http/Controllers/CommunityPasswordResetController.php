<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\NotSharedDefaultPassword;
use App\Services\PlayerVerificationService;
use App\Support\AttemptLimiter;
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

        if ($this->attempts->blocked('password_request', $identifier, $request->ip())) {
            return response()->json(['message' => AuthMessages::TOO_MANY], 429);
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

        if ($this->attempts->blocked('password_reset', $identifier, $request->ip())) {
            return response()->json(['message' => AuthMessages::TOO_MANY], 429);
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
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $player = User::find($id);

        if (! $player || $player->role !== 'player') {
            return response()->json(['message' => 'Player not found.'], 404);
        }

        $issued = $this->verification->issueAdminCode($player);

        return response()->json([
            'message' => 'Give this code to the player in person. It is shown only once.',
            'activation_code' => $issued['code'],
            'expires_at' => $issued['expires_at']->toIso8601String(),
            'can_receive_email' => PlayerContact::canReceiveEmail($player),
            'can_receive_sms' => PlayerContact::canReceiveSms($player) && app(\App\Contracts\SmsSender::class)->enabled(),
        ]);
    }
}
