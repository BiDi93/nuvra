<?php

namespace App\Services;

use App\Contracts\SmsSender;
use App\Mail\PlayerPasswordResetLink;
use App\Models\PlayerCodeAudit;
use App\Models\PlayerVerificationCode;
use App\Models\User;
use App\Support\AttemptLimiter;
use App\Support\PlayerContact;
use App\Support\PlayerLocator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PlayerVerificationService
{
    public function __construct(
        private SmsSender $sms,
        private AttemptLimiter $attempts,
    ) {}

    /**
     * Send a reset secret when a real channel exists. Unknown IDs, admins,
     * and players with no deliverable channel do the same hash work and
     * leave no signal in the response. Mail and SMS run after the response
     * so delivery time does not reveal whether the account exists.
     */
    public function requestForLogin(string $input): void
    {
        $user = $this->playerFromLogin($input);
        $this->hash(bin2hex(random_bytes(16)));

        if (! $user) {
            return;
        }

        $email = PlayerContact::usableEmail($user->contact_email);

        if ($email) {
            $this->sendEmailCode($user, $email);

            return;
        }

        $phone = PlayerContact::usablePhone($user->phone);

        if ($phone && $this->sms->enabled()) {
            $this->sendSmsCode($user, $phone);
        }
    }

    /**
     * @return array{code: string, expires_at: \Illuminate\Support\Carbon}|null
     */
    public function issueAdminCode(User $player, ?int $adminId, string $source): ?array
    {
        $key = 'player:'.$player->id;

        if ($this->attempts->blocked('activation_code', $key, null)) {
            return null;
        }

        $canonical = $this->makeActivationCode();
        $minutes = $this->ttl('admin');
        $expiresAt = $this->store($player, 'admin', $canonical, $minutes);

        PlayerCodeAudit::create([
            'player_id' => $player->id,
            'admin_id' => $adminId,
            'source' => $source,
            'issued_at' => now(),
        ]);

        $this->attempts->hit('activation_code', $key, null);

        return [
            'code' => substr($canonical, 0, 4).'-'.substr($canonical, 4, 4),
            'expires_at' => $expiresAt,
        ];
    }

    public function resetWithEmailToken(string $token, string $password): bool
    {
        $token = strtolower(trim($token));

        if (! preg_match('/\A[0-9a-f]{64}\z/', $token)) {
            return false;
        }

        return DB::transaction(function () use ($token, $password) {
            $record = PlayerVerificationCode::query()
                ->where('channel', 'email')
                ->where('code_hash', $this->hash($token))
                ->whereNull('consumed_at')
                ->where('expires_at', '>', now())
                ->lockForUpdate()
                ->first();

            if (! $record) {
                return false;
            }

            return $this->consume($record, $password);
        });
    }

    public function resetWithSecret(?string $login, ?string $code, string $password): bool
    {
        return DB::transaction(function () use ($login, $code, $password) {
            $record = $this->lockMatchingCode($login, $code);

            if (! $record) {
                return false;
            }

            return $this->consume($record, $password);
        });
    }

    private function consume(PlayerVerificationCode $record, string $password): bool
    {
        $user = $record->user;

        if (! $user || $user->role !== 'player') {
            return false;
        }

        $user->forceFill([
            'password' => $password,
            'password_reset_required' => false,
            'password_is_shared' => false,
            'remember_token' => Str::random(60),
        ])->save();

        $user->tokens()->delete();

        $record->forceFill(['consumed_at' => now()])->save();

        PlayerVerificationCode::query()
            ->where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->delete();

        return true;
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

    private function sendEmailCode(User $user, string $email): void
    {
        $destination = 'email:'.$email;

        if ($this->attempts->blocked('reset_destination', $destination, null)) {
            return;
        }

        $token = bin2hex(random_bytes(32));
        $minutes = $this->ttl('email');
        $this->store($user, 'email', strtolower($token), $minutes);
        $this->attempts->hit('reset_destination', $destination, null);

        $url = rtrim((string) config('app.url'), '/').'/reset-password?token='.$token;

        $sent = false;
        app()->terminating(function () use (&$sent, $email, $url, $minutes) {
            if ($sent) {
                return;
            }
            $sent = true;

            try {
                Mail::to($email)->send(new PlayerPasswordResetLink($url, $minutes));
            } catch (\Throwable $e) {
                report($e);
            }
        });
    }

    private function sendSmsCode(User $user, string $phone): void
    {
        $destination = 'phone:'.$phone;

        if ($this->attempts->blocked('reset_destination', $destination, null)) {
            return;
        }

        $code = (string) random_int(100000, 999999);
        $minutes = $this->ttl('sms');
        $this->store($user, 'sms', $code, $minutes);
        $this->attempts->hit('reset_destination', $destination, null);

        $sent = false;
        app()->terminating(function () use (&$sent, $phone, $code, $minutes) {
            if ($sent) {
                return;
            }
            $sent = true;

            try {
                $this->sms->send($phone, "NUVRA password reset code: {$code}. It expires in {$minutes} minutes.");
            } catch (\Throwable $e) {
                report($e);
            }
        });
    }

    private function lockMatchingCode(?string $login, ?string $code): ?PlayerVerificationCode
    {
        if (! filled($login) || ! filled($code)) {
            return null;
        }

        $user = $this->playerFromLogin($login);
        $canonical = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? '');

        if (! $user) {
            $this->lockHash($canonical !== '' ? $canonical : 'missing', null);

            return null;
        }

        if ($canonical === '') {
            return null;
        }

        return $this->lockHash($canonical, $user->id);
    }

    private function lockHash(string $canonical, ?int $userId): ?PlayerVerificationCode
    {
        $query = PlayerVerificationCode::query()
            ->where('code_hash', $this->hash($canonical))
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now());

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->lockForUpdate()->first();
    }

    private function store(User $user, string $channel, string $canonical, int $minutes): \Illuminate\Support\Carbon
    {
        PlayerVerificationCode::query()
            ->where('user_id', $user->id)
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

    private function ttl(string $channel): int
    {
        return max(1, (int) config("nuvra.verification_ttl.$channel", 15));
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
