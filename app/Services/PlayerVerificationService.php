<?php

namespace App\Services;

use App\Contracts\SmsSender;
use App\Mail\PlayerPasswordResetLink;
use App\Models\PlayerVerificationCode;
use App\Models\User;
use App\Support\PlayerContact;
use App\Support\PlayerLocator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PlayerVerificationService
{
    public function __construct(private SmsSender $sms) {}

    /**
     * Send a reset secret when a real channel exists. Unknown IDs, admins,
     * and players with no deliverable channel are silent: the caller always
     * shows the same message.
     */
    public function requestForLogin(string $input): void
    {
        $user = $this->playerFromLogin($input);

        if (! $user) {
            return;
        }

        $email = PlayerContact::usableEmail($user->contact_email);

        if ($email) {
            $token = bin2hex(random_bytes(32));
            $minutes = (int) config('nuvra.verification_ttl.email');
            $this->store($user, 'email', strtolower($token), $minutes);

            $url = rtrim((string) config('app.url'), '/').'/reset-password?token='.$token;

            try {
                Mail::to($email)->send(new PlayerPasswordResetLink($url, $minutes));
            } catch (\Throwable $e) {
                report($e);
            }

            return;
        }

        $phone = PlayerContact::usablePhone($user->phone);

        if ($phone && $this->sms->enabled()) {
            $code = (string) random_int(100000, 999999);
            $minutes = (int) config('nuvra.verification_ttl.sms');
            $this->store($user, 'sms', $code, $minutes);

            try {
                $this->sms->send($phone, "NUVRA password reset code: {$code}. It expires in {$minutes} minutes.");
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    /**
     * @return array{code: string, expires_at: \Illuminate\Support\Carbon}
     */
    public function issueAdminCode(User $player): array
    {
        $canonical = $this->makeActivationCode();
        $minutes = (int) config('nuvra.verification_ttl.admin');
        $expiresAt = $this->store($player, 'admin', $canonical, $minutes);

        return [
            'code' => substr($canonical, 0, 4).'-'.substr($canonical, 4, 4),
            'expires_at' => $expiresAt,
        ];
    }

    public function resetWithSecret(?string $token, ?string $login, ?string $code, string $password): bool
    {
        return DB::transaction(function () use ($token, $login, $code, $password) {
            $record = $this->lockMatchingCode($token, $login, $code);

            if (! $record) {
                return false;
            }

            $user = $record->user;

            if (! $user || $user->role !== 'player') {
                return false;
            }

            $user->forceFill([
                'password' => $password,
                'password_reset_required' => false,
                'remember_token' => Str::random(60),
            ])->save();

            $user->tokens()->delete();

            $record->forceFill(['consumed_at' => now()])->save();

            return true;
        });
    }

    public function playerFromLogin(string $input): ?User
    {
        $user = PlayerLocator::find($input);

        if (! $user || $user->role !== 'player') {
            return null;
        }

        return $user;
    }

    public function hasDeliveryChannel(User $user): bool
    {
        if (PlayerContact::canReceiveEmail($user)) {
            return true;
        }

        return PlayerContact::canReceiveSms($user) && $this->sms->enabled();
    }

    private function lockMatchingCode(?string $token, ?string $login, ?string $code): ?PlayerVerificationCode
    {
        if (filled($token)) {
            return PlayerVerificationCode::query()
                ->where('code_hash', $this->hash(strtolower(trim($token))))
                ->whereNull('consumed_at')
                ->where('expires_at', '>', now())
                ->lockForUpdate()
                ->first();
        }

        if (! filled($login) || ! filled($code)) {
            return null;
        }

        $user = $this->playerFromLogin($login);

        if (! $user) {
            return null;
        }

        $canonical = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? '');

        if ($canonical === '') {
            return null;
        }

        return PlayerVerificationCode::query()
            ->where('user_id', $user->id)
            ->where('code_hash', $this->hash($canonical))
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->lockForUpdate()
            ->first();
    }

    private function store(User $user, string $channel, string $canonical, int $minutes): \Illuminate\Support\Carbon
    {
        PlayerVerificationCode::query()
            ->where('user_id', $user->id)
            ->where('channel', $channel)
            ->whereNull('consumed_at')
            ->delete();

        $expiresAt = now()->addMinutes($minutes);

        PlayerVerificationCode::create([
            'user_id' => $user->id,
            'channel' => $channel,
            'code_hash' => $this->hash($canonical),
            'expires_at' => $expiresAt,
        ]);

        return $expiresAt;
    }

    private function hash(string $canonical): string
    {
        return hash('sha256', $canonical);
    }

    private function makeActivationCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $last = strlen($alphabet) - 1;
        $code = '';

        for ($i = 0; $i < 8; $i++) {
            $code .= $alphabet[random_int(0, $last)];
        }

        return $code;
    }
}
