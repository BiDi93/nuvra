<?php

namespace App\Services;

use App\Mail\RegistrationApproved;
use App\Mail\RegistrationAttemptNotice;
use App\Mail\RegistrationConfirmation;
use App\Mail\RegistrationRejected;
use App\Models\PlayerRegistrationAudit;
use App\Models\User;
use App\Support\AuthMessages;
use App\Support\EmailMask;
use App\Support\PlayerContact;
use App\Support\RegistrationLimiter;
use App\Support\SafeMail;
use App\Support\VellarIdAllocator;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PlayerRegistrationService
{
    public function __construct(
        private VellarIdAllocator $ids,
        private RegistrationLimiter $limits,
    ) {}

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:100',
            'password' => ['required', 'string', 'confirmed', new \App\Rules\PlayerPassword, new \App\Rules\NotSharedDefaultPassword],
        ]);

        $email = PlayerContact::usableEmail($request->input('email'));

        if ($email === null) {
            return response()->json([
                'message' => 'Use an email address you can open.',
                'errors' => ['email' => ['Use an email address you can open.']],
            ], 422);
        }

        $passwordHash = Hash::make((string) $request->password);
        $confirmPlain = bin2hex(random_bytes(32));
        $statusPlain = bin2hex(random_bytes(32));
        $confirmHash = hash('sha256', $confirmPlain);
        $statusHash = hash('sha256', $statusPlain);
        $existing = $this->findByInbox($email);
        $this->compareToken($existing?->email_confirm_token_hash, $confirmHash);

        if ($this->limits->blocked('register', $email, $request->ip())) {
            return $this->generic();
        }

        $this->limits->hit('register', $email, $request->ip());

        if ($existing) {
            $this->sendDuplicateNotice($existing);

            return $this->generic();
        }

        try {
            $user = $this->ids->create([
                'name' => $request->string('name')->trim()->toString(),
                'password' => $passwordHash,
                'role' => 'player',
                'status' => 'pending',
                'phone' => filled($request->phone) ? $request->phone : null,
                'position' => filled($request->position) ? $request->position : null,
                'contact_email' => $email,
            ], function (User $user) use ($confirmHash, $statusHash) {
                $user->forceFill([
                    'contact_email_source' => 'player',
                    'email_verified_at' => null,
                    'email_confirm_token_hash' => $confirmHash,
                    'email_confirm_expires_at' => now()->addHours($this->confirmHours()),
                    'status_token' => $statusHash,
                ])->save();
            });
        } catch (QueryException $e) {
            if (! str_contains($e->getMessage(), 'contact_email')) {
                Log::error('Registration could not be stored.');

                return $this->generic();
            }

            $again = $this->findByInbox($email);

            if ($again) {
                $this->sendDuplicateNotice($again);
            }

            return $this->generic();
        }

        $this->sendConfirmation($user, $email, $confirmPlain, $statusPlain);

        return $this->generic();
    }

    public function resend(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|max:255',
        ]);

        $email = PlayerContact::usableEmail($request->input('email'));

        if ($email === null) {
            return response()->json([
                'message' => 'Use an email address you can open.',
                'errors' => ['email' => ['Use an email address you can open.']],
            ], 422);
        }

        $confirmPlain = bin2hex(random_bytes(32));
        $statusPlain = bin2hex(random_bytes(32));
        hash('sha256', $confirmPlain);
        $existing = $this->findByInbox($email);
        $this->compareToken($existing?->email_confirm_token_hash, hash('sha256', $confirmPlain));

        if ($this->limits->blocked('resend', $email, $request->ip())) {
            return $this->resendGeneric();
        }

        $this->limits->hit('resend', $email, $request->ip());

        if (! $existing || ! $existing->mustConfirmRegistrationEmail()) {
            return $this->resendGeneric();
        }

        $existing->forceFill([
            'email_confirm_token_hash' => hash('sha256', $confirmPlain),
            'email_confirm_expires_at' => now()->addHours($this->confirmHours()),
            'status_token' => hash('sha256', $statusPlain),
        ])->save();

        $this->sendConfirmation($existing, $email, $confirmPlain, $statusPlain);

        return $this->resendGeneric();
    }

    /**
     * @return 'pending_approval'|'rejected_or_expired'
     */
    public function confirm(string $token): string
    {
        $token = strtolower(trim($token));
        $digest = hash('sha256', preg_match('/\A[0-9a-f]{64}\z/', $token) ? $token : 'missing-confirmation');

        $confirmed = DB::transaction(function () use ($digest, $token) {
            if (! preg_match('/\A[0-9a-f]{64}\z/', $token)) {
                return false;
            }

            $user = User::query()
                ->where('email_confirm_token_hash', $digest)
                ->lockForUpdate()
                ->first();

            $expires = $user?->email_confirm_expires_at;
            $usable = $user
                && $user->mustConfirmRegistrationEmail()
                && $expires !== null
                && $expires->isFuture()
                && hash_equals((string) $user->email_confirm_token_hash, $digest);

            if (! $usable) {
                return false;
            }

            $user->forceFill([
                'email_verified_at' => now(),
                'email_confirm_token_hash' => null,
                'email_confirm_expires_at' => null,
            ])->save();

            return true;
        });

        return $confirmed ? 'pending_approval' : 'rejected_or_expired';
    }

    public function sendApproval(User $user): void
    {
        $email = PlayerContact::usableEmail($user->contact_email);
        $number = preg_replace('/[^0-9]/', '', (string) $user->vellar_id) ?? '';

        if ($email === null || $number === '') {
            Log::error('Registration approval email skipped.', ['player_id' => $user->id]);

            return;
        }

        SafeMail::now(
            $user->id,
            $email,
            new RegistrationApproved($number, $this->loginUrl()),
            'Registration approval email',
        );
    }

    public function sendRejection(User $user): void
    {
        $email = PlayerContact::usableEmail($user->contact_email);

        if ($email === null) {
            Log::error('Registration rejection email skipped.', ['player_id' => $user->id]);

            return;
        }

        SafeMail::now(
            $user->id,
            $email,
            new RegistrationRejected,
            'Registration rejection email',
        );
    }

    public function writeAudit(User $player, User $admin, string $action): void
    {
        PlayerRegistrationAudit::query()->create([
            'player_id' => $player->id,
            'admin_id' => $admin->id,
            'action' => $action,
            'email_masked' => EmailMask::mask($player->contact_email),
        ]);
    }

    public function publicStatus(User $user): string
    {
        if ($user->status === 'active') {
            return 'approved';
        }

        if ($user->mustConfirmRegistrationEmail()) {
            return 'pending_confirmation';
        }

        if ($user->status === 'pending') {
            return 'pending_approval';
        }

        return 'rejected_or_expired';
    }

    private function sendConfirmation(User $user, string $email, string $confirmPlain, string $statusPlain): void
    {
        $base = $this->baseUrl();

        SafeMail::later(
            $user->id,
            $email,
            new RegistrationConfirmation(
                $base.'/email/confirm/'.$confirmPlain,
                $base.'/waiting-room#t='.$statusPlain,
                $this->confirmHours(),
            ),
            'Registration confirmation email',
        );
    }

    private function sendDuplicateNotice(User $user): void
    {
        $email = PlayerContact::usableEmail($user->contact_email) ?? PlayerContact::usableEmail($user->email);

        if ($email === null) {
            return;
        }

        SafeMail::later(
            $user->id,
            $email,
            new RegistrationAttemptNotice($this->loginUrl()),
            'Registration attempt notice',
        );
    }

    private function findByInbox(string $email): ?User
    {
        return User::query()
            ->where(function ($query) use ($email) {
                $query->whereRaw('lower(contact_email) = ?', [$email])
                    ->orWhereRaw('lower(email) = ?', [$email]);
            })
            ->first();
    }

    private function compareToken(?string $stored, string $presentedHash): void
    {
        hash_equals($stored ?? hash('sha256', 'registration-absent'), $presentedHash);
    }

    private function generic(): JsonResponse
    {
        return response()->json([
            'message' => AuthMessages::REGISTER_GENERIC,
        ]);
    }

    private function resendGeneric(): JsonResponse
    {
        return response()->json([
            'message' => AuthMessages::RESEND_GENERIC,
        ]);
    }

    private function confirmHours(): int
    {
        return max(1, (int) config('nuvra.registration.confirm_hours', 24));
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('app.url'), '/');
    }

    private function loginUrl(): string
    {
        return $this->baseUrl().'/login';
    }
}
