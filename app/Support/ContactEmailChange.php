<?php

namespace App\Support;

use App\Mail\ContactEmailChanged;
use App\Models\ContactEmailChange as ContactEmailChangeRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactEmailChange
{
    public static function normalize(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = strtolower(trim($value));

        return $value === '' ? null : $value;
    }

    public static function isChanging(User $user, ?string $next): bool
    {
        return self::normalize($user->contact_email) !== $next;
    }

    /**
     * A player cannot attach a recovery email until the shared-password
     * variable is set, or while they still use that password, or while a
     * reset is still required.
     */
    public static function locked(User $user): bool
    {
        if ($user->role === 'player' && SharedPassword::configuredValue() === null) {
            return true;
        }

        return (bool) $user->password_reset_required || SharedPassword::usesSharedPassword($user);
    }

    public static function atDailyCap(User $user): bool
    {
        return count(self::recentAttempts($user)) >= 5;
    }

    public static function recordAttempt(User $user): void
    {
        $hits = self::recentAttempts($user);
        $hits[] = now()->getTimestamp();
        Cache::put(self::attemptKey($user), $hits, 86400);
    }

    public static function mask(?string $email): string
    {
        $email = self::normalize($email);

        if ($email === null || ! str_contains($email, '@')) {
            return '(none)';
        }

        [$local, $domain] = explode('@', $email, 2);
        $visible = $local === '' ? '*' : substr($local, 0, 1).str_repeat('*', max(1, strlen($local) - 1));

        return $visible.'@'.$domain;
    }

    public static function refuse(Request $request, User $user, ?string $next): ?JsonResponse
    {
        if (! self::isChanging($user, $next)) {
            return null;
        }

        if (self::locked($user)) {
            return response()->json([
                'message' => AuthMessages::CONTACT_EMAIL_LOCKED,
            ], 403);
        }

        $attempts = app(AttemptLimiter::class);
        $identifier = self::loginIdentifier($user);

        if ($denied = AttemptResponse::ifBlocked($attempts, 'login', $identifier, $request->ip())) {
            return $denied;
        }

        $current = $request->input('current_password');

        if (! is_string($current) || $current === '' || ! Hash::check($current, $user->password)) {
            $attempts->hit('login', $identifier, $request->ip());

            return response()->json([
                'message' => 'The current password is incorrect.',
            ], 422);
        }

        return null;
    }

    public static function record(Request $request, User $user, ?string $previous, ?string $next): void
    {
        self::recordAttempt($user);

        ContactEmailChangeRecord::query()->create([
            'player_id' => $user->id,
            'old_email_masked' => self::mask($previous),
            'new_email_masked' => self::mask($next),
            'ip_address' => $request->ip(),
        ]);

        app(AttemptLimiter::class)->clearIdentifier('login', self::loginIdentifier($user));

        $old = PlayerContact::usableEmail($previous);

        if ($old === null) {
            return;
        }

        try {
            Mail::to($old)->send(new ContactEmailChanged);
        } catch (\Throwable) {
            Log::error('The recovery-email change notice could not be sent.');
        }
    }

    /**
     * @return list<int>
     */
    private static function recentAttempts(User $user): array
    {
        $now = now()->getTimestamp();
        $hits = Cache::get(self::attemptKey($user), []);

        if (! is_array($hits)) {
            return [];
        }

        return array_values(array_filter(
            $hits,
            fn ($hit) => is_int($hit) && $hit > $now - 86400
        ));
    }

    private static function attemptKey(User $user): string
    {
        return 'contact-email-change:'.$user->id;
    }

    private static function loginIdentifier(User $user): string
    {
        return PlayerLocator::identifier((string) $user->vellar_id);
    }
}
