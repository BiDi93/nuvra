<?php

namespace App\Services;

use App\Mail\RegistrationAlreadyExists;
use App\Mail\RegistrationApproved;
use App\Mail\RegistrationConfirmation;
use App\Mail\RegistrationRejected;
use App\Models\PlayerRegistrationAudit;
use App\Models\User;
use App\Support\AuthMessages;
use App\Support\EmailMask;
use App\Support\PlayerContact;
use App\Support\RegistrationLimiter;
use App\Support\SafeMail;
use App\Support\UniqueConstraint;
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

        if ($this->limits->ipBlocked('register', $request->ip())) {
            return $this->tooMany();
        }

        $this->limits->hitIp('register', $request->ip());

        if ($existing) {
            return $this->answerForExisting(
                $existing,
                $request,
                $email,
                $passwordHash,
                $confirmPlain,
                $statusPlain,
                $confirmHash,
                $statusHash,
            );
        }

        try {
            $user = $this->createSignup($request, $passwordHash, $email, $confirmHash, $statusHash);
        } catch (QueryException $e) {
            if (! $this->isInboxConflict($e)) {
                throw $e;
            }

            $again = $this->findByInbox($email);

            if ($again) {
                return $this->answerForExisting(
                    $again,
                    $request,
                    $email,
                    $passwordHash,
                    $confirmPlain,
                    $statusPlain,
                    $confirmHash,
                    $statusHash,
                );
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
        $existing = $this->findByInbox($email);
        $this->compareToken($existing?->email_confirm_token_hash, hash('sha256', $confirmPlain));

        if ($this->limits->ipBlocked('resend', $request->ip())) {
            return $this->tooMany();
        }

        $this->limits->hitIp('resend', $request->ip());

        if ($existing?->registrationIsExpired()) {
            DB::transaction(function () use ($existing) {
                $locked = User::query()->lockForUpdate()->find($existing->id);

                if ($locked && $locked->registrationIsExpired()) {
                    $locked->delete();
                }
            });

            return $this->resendGeneric();
        }

        if (! $existing || ! $existing->mustConfirmRegistrationEmail()) {
            return $this->resendGeneric();
        }

        if ($this->limits->confirmMailBlocked($email)) {
            return $this->resendGeneric();
        }

        $existing->forceFill([
            'email_confirm_token_hash' => hash('sha256', $confirmPlain),
            'email_confirm_expires_at' => now()->addHours($this->confirmHours()),
            'status_token' => hash('sha256', $statusPlain),
        ])->save();

        $this->limits->hitConfirmMail($email);
        $this->queueConfirmation($existing, $email, $confirmPlain, $statusPlain);

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
            $pending = PlayerContact::usableEmail($user?->pending_contact_email);
            $usable = $user
                && $pending !== null
                && $user->mustConfirmRegistrationEmail()
                && ! $user->registrationIsExpired()
                && $expires !== null
                && $expires->isFuture()
                && hash_equals((string) $user->email_confirm_token_hash, $digest);

            if (! $usable) {
                return false;
            }

            $taken = User::query()
                ->where('id', '!=', $user->id)
                ->whereRaw('lower(contact_email) = ?', [$pending])
                ->exists();

            if ($taken) {
                return false;
            }

            try {
                $user->forceFill([
                    'contact_email' => $pending,
                    'contact_email_source' => 'registration',
                    'pending_contact_email' => null,
                    'email_verified_at' => now(),
                    'email_confirm_token_hash' => null,
                    'email_confirm_expires_at' => null,
                ])->save();
            } catch (QueryException $e) {
                Log::error('Registration confirmation could not be stored.', ['player_id' => $user->id]);

                if (! UniqueConstraint::isInbox($e)) {
                    throw $e;
                }

                return false;
            }

            return true;
        });

        return $confirmed ? 'pending_approval' : 'rejected_or_expired';
    }

    public function sendApproval(User $user): bool
    {
        if ($user->contact_email_source !== 'registration' || $user->email_verified_at === null) {
            Log::error('Registration approval email skipped.', ['player_id' => $user->id]);

            return false;
        }

        $email = PlayerContact::usableEmail($user->contact_email);
        $number = preg_replace('/[^0-9]/', '', (string) $user->vellar_id) ?? '';

        if ($email === null || $number === '') {
            Log::error('Registration approval email skipped.', ['player_id' => $user->id]);

            return false;
        }

        return SafeMail::now(
            $user->id,
            $email,
            new RegistrationApproved($number, $this->loginUrl()),
            'Registration approval email',
        );
    }

    public function sendRejection(User $user): void
    {
        if ($user->contact_email_source !== 'registration' || $user->email_verified_at === null) {
            return;
        }

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
        $email = $player->contact_email ?: $player->pending_contact_email;

        PlayerRegistrationAudit::query()->create([
            'player_id' => $player->id,
            'admin_id' => $admin->id,
            'action' => $action,
            'email_masked' => EmailMask::mask($email),
        ]);
    }

    public function publicStatus(User $user): string
    {
        if ($user->status === 'active') {
            return 'approved';
        }

        if ($user->registrationIsExpired()) {
            return 'rejected_or_expired';
        }

        if ($user->mustConfirmRegistrationEmail()) {
            return 'pending_confirmation';
        }

        if ($user->status === 'pending') {
            return 'pending_approval';
        }

        return 'rejected_or_expired';
    }

    /**
     * A still-open pending signup gets a new link on the same row.
     * An approved player gets only the account notice.
     * An expired unconfirmed row is replaced by the caller, not here.
     */
    private function noticeForExisting(User $user, string $email): void
    {
        if ($user->role === 'player' && $user->status === 'active') {
            $this->sendAlreadyRegistered($user, $email);

            return;
        }

        if ($user->mustConfirmRegistrationEmail() && ! $user->registrationIsExpired()) {
            $this->refreshPendingConfirmation($user, $email);
        }
    }

    private function refreshPendingConfirmation(User $user, string $email): void
    {
        if ($this->limits->confirmMailBlocked($email)) {
            return;
        }

        $confirmPlain = bin2hex(random_bytes(32));
        $statusPlain = bin2hex(random_bytes(32));

        $updated = DB::transaction(function () use ($user, $confirmPlain, $statusPlain) {
            $locked = User::query()->lockForUpdate()->find($user->id);

            if (! $locked || ! $locked->mustConfirmRegistrationEmail() || $locked->registrationIsExpired()) {
                return false;
            }

            $locked->forceFill([
                'email_confirm_token_hash' => hash('sha256', $confirmPlain),
                'email_confirm_expires_at' => now()->addHours($this->confirmHours()),
                'status_token' => hash('sha256', $statusPlain),
            ])->save();

            return true;
        });

        if (! $updated) {
            return;
        }

        $this->limits->hitConfirmMail($email);
        $this->queueConfirmation($user, $email, $confirmPlain, $statusPlain);
    }

    private function sendAlreadyRegistered(User $user, string $email): void
    {
        if ($this->limits->confirmMailBlocked($email)) {
            return;
        }

        $this->limits->hitConfirmMail($email);
        SafeMail::afterResponse(
            $user->id,
            $email,
            new RegistrationAlreadyExists($this->baseUrl().'/login?reset=1'),
            'Registration account notice',
        );
    }

    private function sendConfirmation(User $user, string $email, string $confirmPlain, string $statusPlain): void
    {
        if ($this->limits->confirmMailBlocked($email)) {
            return;
        }

        $this->limits->hitConfirmMail($email);
        $this->queueConfirmation($user, $email, $confirmPlain, $statusPlain);
    }

    private function queueConfirmation(User $user, string $email, string $confirmPlain, string $statusPlain): void
    {
        $base = $this->baseUrl();

        SafeMail::afterResponse(
            $user->id,
            $email,
            new RegistrationConfirmation(
                $base.'/email/confirm#t='.$confirmPlain,
                $base.'/waiting-room#t='.$statusPlain,
                $this->confirmHours(),
            ),
            'Registration confirmation email',
        );
    }

    private function findByInbox(string $email): ?User
    {
        return User::query()
            ->where(function ($query) use ($email) {
                $query->whereRaw('lower(contact_email) = ?', [$email])
                    ->orWhereRaw('lower(pending_contact_email) = ?', [$email])
                    ->orWhereRaw('lower(email) = ?', [$email]);
            })
            ->first();
    }

    private function compareToken(?string $stored, string $presentedHash): void
    {
        hash_equals($stored ?? hash('sha256', 'registration-absent'), $presentedHash);
    }

    private function answerForExisting(
        User $existing,
        Request $request,
        string $email,
        string $passwordHash,
        string $confirmPlain,
        string $statusPlain,
        string $confirmHash,
        string $statusHash,
    ): JsonResponse {
        if (! $existing->registrationIsExpired()) {
            $this->noticeForExisting($existing, $email);

            return $this->generic();
        }

        try {
            $user = $this->replaceExpiredSignup($existing, $email, $request, $passwordHash, $confirmHash, $statusHash);
        } catch (QueryException $e) {
            if (! $this->isInboxConflict($e)) {
                throw $e;
            }

            $user = null;
        }

        if ($user) {
            $this->sendConfirmation($user, $email, $confirmPlain, $statusPlain);

            return $this->generic();
        }

        $again = $this->findByInbox($email);

        if ($again && ! $again->registrationIsExpired()) {
            $this->noticeForExisting($again, $email);
        }

        return $this->generic();
    }

    private function replaceExpiredSignup(
        User $existing,
        string $email,
        Request $request,
        string $passwordHash,
        string $confirmHash,
        string $statusHash,
    ): ?User {
        return DB::transaction(function () use ($existing, $email, $request, $passwordHash, $confirmHash, $statusHash) {
            $locked = User::query()->lockForUpdate()->find($existing->id);

            if ($locked && $locked->registrationIsExpired()) {
                $locked->delete();
            }

            if ($this->findByInbox($email)) {
                return null;
            }

            return $this->createSignup($request, $passwordHash, $email, $confirmHash, $statusHash);
        });
    }

    private function createSignup(
        Request $request,
        string $passwordHash,
        string $email,
        string $confirmHash,
        string $statusHash,
    ): User {
        return $this->ids->create([
            'name' => $request->string('name')->trim()->toString(),
            'password' => $passwordHash,
            'role' => 'player',
            'status' => 'pending',
            'phone' => filled($request->phone) ? $request->phone : null,
            'position' => filled($request->position) ? $request->position : null,
        ], function (User $user) use ($email, $confirmHash, $statusHash) {
            $user->forceFill([
                'pending_contact_email' => $email,
                'contact_email' => null,
                'contact_email_source' => null,
                'email_verified_at' => null,
                'email_confirm_token_hash' => $confirmHash,
                'email_confirm_expires_at' => now()->addHours($this->confirmHours()),
                'status_token' => $statusHash,
            ])->save();
        });
    }

    private function isInboxConflict(QueryException $e): bool
    {
        return UniqueConstraint::isInbox($e);
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

    private function tooMany(): JsonResponse
    {
        return response()->json([
            'message' => 'Too many attempts.',
        ], 429);
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
