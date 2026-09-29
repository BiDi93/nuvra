<?php

namespace Tests\Feature;

use App\Jobs\DeliverRegistrationMail;
use App\Mail\PlayerPasswordResetLink;
use App\Mail\RegistrationAlreadyExists;
use App\Mail\RegistrationApproved;
use App\Mail\RegistrationConfirmation;
use App\Mail\RegistrationRejected;
use App\Models\ContactEmailChange;
use App\Models\PlayerRegistrationAudit;
use App\Models\PlayerVerificationCode;
use App\Models\User;
use App\Support\AuthMessages;
use App\Support\UniqueConstraint;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class PlayerRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.url' => 'https://uat.nuvrasports.com']);
    }

    public function test_register_creates_an_unconfirmed_player_and_hides_the_vellar_id(): void
    {
        Mail::fake();

        $response = $this->postSignup('player@example.com', 'New Player');

        $response->assertOk()->assertExactJson([
            'message' => AuthMessages::REGISTER_GENERIC,
        ]);
        $this->assertResponseHidesVellarId($response);

        $player = User::query()->where('pending_contact_email', 'player@example.com')->first();
        $this->assertNotNull($player);
        $this->assertNull($player->contact_email);
        $this->assertNull($player->contact_email_source);
        $this->assertSame('pending', $player->status);
        $this->assertNull($player->email_verified_at);
        $this->assertSame('player', $player->role);
        $this->assertMatchesRegularExpression('/\Avellar\d+@vellarleague\.com\z/', $player->email);
        $this->assertNotSame('player@example.com', $player->email);
        $token = $this->confirmToken();
        $this->assertSame(64, strlen((string) $player->email_confirm_token_hash));
        $this->assertTrue(hash_equals(hash('sha256', $token), (string) $player->email_confirm_token_hash));
        $this->assertStringNotContainsString($token, $response->getContent());
        $this->assertStringNotContainsString($token, (string) $player->email_confirm_token_hash);

        Mail::assertSent(RegistrationConfirmation::class, function (RegistrationConfirmation $mail) use ($token) {
            return $mail->hasTo('player@example.com')
                && parse_url($mail->confirmUrl, PHP_URL_PATH) === '/email/confirm'
                && parse_url($mail->confirmUrl, PHP_URL_QUERY) === null
                && parse_url($mail->confirmUrl, PHP_URL_FRAGMENT) === 't='.$token
                && str_starts_with($mail->statusUrl, 'https://uat.nuvrasports.com/waiting-room#t=')
                && ! str_contains($mail->render(), 'New Player');
        });
        $this->assertMailWasNotQueued();
    }

    public function test_confirmation_link_works_once_and_expires_after_24_hours(): void
    {
        Mail::fake();
        $this->postSignup('player@example.com');
        $token = $this->confirmToken();

        $confirm = $this->postJson('/api/community/email/confirm', ['token' => $token]);
        $confirm->assertOk()->assertExactJson(['status' => 'pending_approval']);
        $this->assertResponseHidesVellarId($confirm);

        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $this->assertNotNull($player->email_verified_at);
        $this->assertNull($player->email_confirm_token_hash);
        $this->assertNull($player->pending_contact_email);
        $this->assertSame('registration', $player->contact_email_source);

        $this->postJson('/api/community/email/confirm', ['token' => $token])
            ->assertOk()
            ->assertExactJson(['status' => 'rejected_or_expired']);
        $this->assertNotNull($player->fresh()->email_verified_at);

        Mail::fake();
        $this->postSignup('later@example.com', 'Later Player');
        $expired = $this->confirmToken(RegistrationConfirmation::class, 'later@example.com');
        $this->travelTo(now()->addHours(24)->addMinute());

        $this->postJson('/api/community/email/confirm', ['token' => $expired])
            ->assertOk()
            ->assertExactJson(['status' => 'rejected_or_expired']);
        $later = User::query()->where('pending_contact_email', 'later@example.com')->first();
        $this->assertNotNull($later);
        $this->assertNull($later->email_verified_at);
        $this->assertNull($later->contact_email);
        $this->travelBack();
    }

    public function test_unconfirmed_players_cannot_be_approved_sign_in_or_reset(): void
    {
        Mail::fake();
        $this->postSignup('player@example.com');
        $player = User::query()->where('pending_contact_email', 'player@example.com')->first();
        $admin = $this->admin();
        $number = preg_replace('/\D/', '', (string) $player->vellar_id);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertStatus(422)
            ->assertExactJson(['message' => 'This registration is not confirmed yet.'])
            ->assertJsonMissing(['vellar_id']);
        $this->assertSame('pending', $player->fresh()->status);
        Mail::assertNotSent(RegistrationApproved::class);

        $login = $this->postJson('/api/community/login', [
            'vellar_id' => $number,
            'password' => $this->signupPassword(),
        ])->assertStatus(403);
        $this->assertArrayNotHasKey('token', $login->json());
        $this->assertStringNotContainsString((string) $player->vellar_id, $login->getContent());

        $this->postJson('/api/community/password/request', ['vellar_id' => $number])->assertOk();
        Mail::assertNotSent(PlayerPasswordResetLink::class);

        PlayerVerificationCode::create([
            'user_id' => $player->id,
            'channel' => 'email',
            'code_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(15),
        ]);

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => $number,
            'code' => '123456',
            'password' => 'another-pass-1',
            'password_confirmation' => 'another-pass-1',
        ])->assertStatus(422);

        $this->assertTrue(Hash::check($this->signupPassword(), $player->fresh()->password));
    }

    public function test_approval_emails_the_vellar_id_and_writes_an_audit_row(): void
    {
        Mail::fake();
        $this->postSignup('player@example.com', 'New Player');
        $this->postJson('/api/community/email/confirm', ['token' => $this->confirmToken()])->assertOk();
        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $admin = $this->admin();
        $number = preg_replace('/\D/', '', (string) $player->vellar_id);

        $approved = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertOk()
            ->assertJsonPath('email_sent', true)
            ->assertJsonMissing(['vellar_id']);
        $this->assertStringContainsString('Their Vellar ID is emailed to them.', (string) $approved->json('message'));
        $this->assertStringNotContainsString((string) $number, (string) $approved->json('message'));

        $this->assertSame('active', $player->fresh()->status);
        Mail::assertSent(RegistrationApproved::class, function (RegistrationApproved $mail) use ($number) {
            $html = $mail->render();

            return $mail->hasTo('player@example.com')
                && $mail->vellarNumber === $number
                && str_contains($html, $number)
                && ! str_contains($html, 'New Player')
                && str_starts_with($mail->loginUrl, 'https://uat.nuvrasports.com/login');
        });

        $audit = PlayerRegistrationAudit::query()->first();
        $this->assertNotNull($audit);
        $this->assertSame($player->id, $audit->player_id);
        $this->assertSame($admin->id, $audit->admin_id);
        $this->assertSame('approve', $audit->action);
        $this->assertNotNull($audit->created_at);
        $this->assertStringNotContainsString('player@example.com', (string) $audit->email_masked);

        $this->postJson('/api/community/login', [
            'vellar_id' => $number,
            'password' => $this->signupPassword(),
        ])->assertOk();
    }

    public function test_rejection_sends_a_neutral_email_writes_an_audit_row_and_deletes(): void
    {
        Mail::fake();
        $this->postSignup('player@example.com', 'New Player');
        $statusToken = $this->statusToken();
        $this->postJson('/api/community/email/confirm', ['token' => $this->confirmToken()])->assertOk();
        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/community/admin/reject-player/'.$player->id)
            ->assertOk();

        Mail::assertSent(RegistrationRejected::class, function (RegistrationRejected $mail) {
            $html = $mail->render();

            return $mail->hasTo('player@example.com')
                && ! str_contains($html, 'New Player')
                && ! str_contains(strtolower($html), 'vellar');
        });

        $audit = PlayerRegistrationAudit::query()->first();
        $this->assertNotNull($audit);
        $this->assertSame($player->id, $audit->player_id);
        $this->assertSame($admin->id, $audit->admin_id);
        $this->assertSame('reject', $audit->action);
        $this->assertNotNull($audit->created_at);
        $this->assertStringNotContainsString('player@example.com', (string) $audit->email_masked);
        $this->assertDatabaseMissing('users', ['id' => $player->id]);

        $this->postJson('/api/community/check-status', ['status_token' => $statusToken])
            ->assertExactJson(['status' => 'rejected_or_expired']);
    }

    public function test_pending_resignup_refreshes_only_the_token(): void
    {
        Mail::fake();

        $first = $this->postSignup('player@example.com', 'Original Name', ['position' => 'Goalkeeper']);
        $player = User::query()->where('pending_contact_email', 'player@example.com')->first();
        $before = $player->only([
            'id', 'name', 'phone', 'position', 'password', 'email', 'vellar_id',
            'role', 'status', 'pending_contact_email', 'contact_email', 'contact_email_source',
        ]);
        $createdAt = $player->created_at->toJSON();
        $oldHash = $player->email_confirm_token_hash;
        $oldToken = $this->confirmToken();

        $second = $this->postSignup('Player@Example.com', 'Other Name', [
            'position' => 'Forward / Striker',
            'password' => 'another-pass-1',
            'password_confirmation' => 'another-pass-1',
        ]);

        $this->assertSame($first->status(), $second->status());
        $this->assertSame($first->getContent(), $second->getContent());
        $this->assertSame(1, User::query()->where('role', 'player')->count());
        $this->assertNull(User::query()->where('name', 'Other Name')->first());

        $player->refresh();
        $this->assertSame($before, $player->only(array_keys($before)));
        $this->assertSame($createdAt, $player->created_at->toJSON());
        $this->assertNotSame($oldHash, $player->email_confirm_token_hash);
        $this->assertTrue(Hash::check($this->signupPassword(), $player->password));
        $this->assertFalse(Hash::check('another-pass-1', $player->password));

        Mail::assertSent(RegistrationConfirmation::class, 2);
        Mail::assertNotSent(RegistrationAlreadyExists::class);
        $this->assertMailWasNotQueued();

        $sent = Mail::sent(RegistrationConfirmation::class);
        $newToken = $this->tokenFrom($sent[1]->confirmUrl, '~/email/confirm#t=([0-9a-f]{64})~');
        $this->assertNotSame($oldToken, $newToken);
        $this->assertSame(hash('sha256', $newToken), $player->email_confirm_token_hash);

        $this->postJson('/api/community/email/confirm', ['token' => $oldToken])
            ->assertExactJson(['status' => 'rejected_or_expired']);
        $this->postJson('/api/community/email/confirm', ['token' => $newToken])
            ->assertExactJson(['status' => 'pending_approval']);

        $player->refresh();
        $this->assertSame('Original Name', $player->name);
        $this->assertSame('Goalkeeper', $player->position);
        $this->assertSame('player@example.com', $player->contact_email);
        $this->assertSame('registration', $player->contact_email_source);
    }

    public function test_register_replies_match_for_new_pending_and_approved(): void
    {
        Mail::fake();

        $created = $this->postSignup('player@example.com', 'Original Name');
        $pending = $this->postSignup('player@example.com', 'Other Name');
        $this->postJson('/api/community/email/confirm', [
            'token' => $this->tokenFrom(Mail::sent(RegistrationConfirmation::class)[1]->confirmUrl, '~/email/confirm#t=([0-9a-f]{64})~'),
        ])->assertOk();
        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertOk();

        $approved = $this->postSignup('player@example.com', 'Third Name');
        $other = $this->postSignup('other.player@example.com', 'Someone Else');

        $created->assertOk();
        $this->assertSame($created->status(), $pending->status());
        $this->assertSame($created->getContent(), $pending->getContent());
        $this->assertSame($created->status(), $approved->status());
        $this->assertSame($created->getContent(), $approved->getContent());
        $this->assertSame($created->status(), $other->status());
        $this->assertSame($created->getContent(), $other->getContent());
        $this->assertResponseHidesVellarId($approved);

        Mail::assertSent(RegistrationAlreadyExists::class, function (RegistrationAlreadyExists $mail) {
            $html = $mail->render();

            return $mail->hasTo('player@example.com')
                && str_contains($html, 'You already have a NUVRA account')
                && str_contains($html, 'Forgot password')
                && str_starts_with($mail->resetUrl, 'https://uat.nuvrasports.com/login?reset=1')
                && ! str_contains($html, 'Original Name')
                && ! str_contains($html, 'Third Name')
                && ! str_contains(strtolower($html), 'vellar');
        });
        Mail::assertSent(RegistrationAlreadyExists::class, 1);
        Mail::assertSent(RegistrationConfirmation::class, 3);
        $this->assertSame('Original Name', $player->fresh()->name);
        $this->assertNull(User::query()->where('name', 'Third Name')->first());
        $this->assertNotNull(User::query()->where('pending_contact_email', 'other.player@example.com')->first());
        $this->assertMailWasNotQueued();
    }

    public function test_ip_limit_returns_429_and_mail_caps_stay_neutral(): void
    {
        Mail::fake();
        config(['nuvra.registration_limits.register.ip.max' => 1]);

        $allowed = $this->postSignup('one@example.com');
        $allowed->assertOk()->assertExactJson(['message' => AuthMessages::REGISTER_GENERIC]);

        $blockedNew = $this->postSignup('two@example.com');
        $blockedTaken = $this->postSignup('one@example.com');

        $blockedNew->assertStatus(429);
        $blockedTaken->assertStatus(429);
        $this->assertSame($blockedNew->getContent(), $blockedTaken->getContent());
        $this->assertStringNotContainsString('one@example.com', $blockedNew->getContent());
        $this->assertStringNotContainsString('two@example.com', $blockedNew->getContent());
        $this->assertNull(User::query()->where('pending_contact_email', 'two@example.com')->first());
        Mail::assertSent(RegistrationConfirmation::class, 1);
        $this->assertMailWasNotQueued();

        config([
            'nuvra.registration_limits.register.ip.max' => 20,
            'nuvra.registration_limits.resend.ip.max' => 20,
            'nuvra.registration_limits.confirm_mail.per_email.max' => 1,
            'nuvra.registration_limits.confirm_mail.daily.max' => 20,
        ]);

        $hash = User::query()->where('pending_contact_email', 'one@example.com')->value('email_confirm_token_hash');
        $resend = $this->postJson('/api/community/register/resend', ['email' => 'one@example.com']);
        $again = $this->postSignup('one@example.com', 'Different Name');
        $resend->assertOk()->assertExactJson(['message' => AuthMessages::RESEND_GENERIC]);
        $again->assertOk()->assertExactJson(['message' => AuthMessages::REGISTER_GENERIC]);
        $this->assertSame($hash, User::query()->where('pending_contact_email', 'one@example.com')->value('email_confirm_token_hash'));
        $this->assertSame('New Player', User::query()->where('pending_contact_email', 'one@example.com')->value('name'));
        Mail::assertSent(RegistrationConfirmation::class, 1);

        config(['nuvra.registration_limits.confirm_mail.daily.max' => 1]);
        $global = $this->postSignup('three@example.com');
        $this->assertSame($allowed->status(), $global->status());
        $this->assertSame($allowed->getContent(), $global->getContent());
        Mail::assertSent(RegistrationConfirmation::class, 1);
        $this->assertMailWasNotQueued();
    }

    public function test_resend_replaces_the_confirmation_link(): void
    {
        Mail::fake();
        config([
            'nuvra.registration_limits.confirm_mail.per_email.max' => 5,
            'nuvra.registration_limits.confirm_mail.daily.max' => 5,
        ]);

        $this->postSignup('one@example.com');
        $this->postJson('/api/community/register/resend', ['email' => 'one@example.com'])
            ->assertOk()
            ->assertExactJson(['message' => AuthMessages::RESEND_GENERIC]);
        Mail::assertSent(RegistrationConfirmation::class, 2);
        $this->assertMailWasNotQueued();

        $sent = Mail::sent(RegistrationConfirmation::class);
        $old = $this->tokenFrom($sent[0]->confirmUrl, '~/email/confirm#t=([0-9a-f]{64})~');
        $new = $this->tokenFrom($sent[1]->confirmUrl, '~/email/confirm#t=([0-9a-f]{64})~');

        $this->postJson('/api/community/email/confirm', ['token' => $old])
            ->assertExactJson(['status' => 'rejected_or_expired']);
        $this->postJson('/api/community/email/confirm', ['token' => $new])
            ->assertExactJson(['status' => 'pending_approval']);
    }

    public function test_seven_day_expiry_is_applied_when_the_signup_is_read(): void
    {
        Mail::fake();
        config(['nuvra.backoff.check_status.free' => 20]);
        $this->postSignup('old@example.com', 'Old Player');
        $token = $this->confirmToken();
        $status = $this->statusToken();
        $player = User::query()->where('pending_contact_email', 'old@example.com')->first();
        $player->forceFill([
            'created_at' => now()->subDays(8),
            'email_confirm_expires_at' => now()->addHour(),
        ])->save();

        $this->postJson('/api/community/email/confirm', ['token' => $token])
            ->assertOk()
            ->assertExactJson(['status' => 'rejected_or_expired']);
        $player->refresh();
        $this->assertNull($player->contact_email);
        $this->assertNull($player->email_verified_at);
        $this->assertNull($player->contact_email_source);

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertStatus(422)
            ->assertExactJson(['message' => 'This registration has expired. It cannot be approved.']);
        Mail::assertNotSent(RegistrationApproved::class);

        $statusResponse = $this->postJson('/api/community/check-status', ['status_token' => $status]);
        $statusResponse->assertExactJson(['status' => 'rejected_or_expired']);
        $this->assertResponseHidesVellarId($statusResponse);

        $list = $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/community/admin/pending-players')
            ->assertOk();
        $row = collect($list->json('players'))->firstWhere('id', $player->id);
        $this->assertTrue($row['expired']);
        $this->assertFalse($row['email_confirmed']);
        $this->assertStringNotContainsString('old@example.com', $list->getContent());
        $this->assertResponseHidesVellarId($list);

        $this->postJson('/api/community/register/resend', ['email' => 'old@example.com'])
            ->assertOk()
            ->assertExactJson(['message' => AuthMessages::RESEND_GENERIC]);
        Mail::assertSent(RegistrationConfirmation::class, 1);
        $this->assertNull($player->fresh());
        $this->assertNull(User::query()->where('pending_contact_email', 'old@example.com')->first());
    }

    public function test_expired_signup_is_replaced_with_the_new_details(): void
    {
        Mail::fake();
        $first = $this->postSignup('again@example.com', 'Old Name', ['position' => 'Goalkeeper']);
        $this->travel(8)->days();

        $second = $this->postSignup('again@example.com', 'New Name', [
            'position' => 'Forward / Striker',
            'password' => 'another-pass-1',
            'password_confirmation' => 'another-pass-1',
        ]);

        $second->assertOk()->assertExactJson(['message' => AuthMessages::REGISTER_GENERIC]);
        $this->assertSame($first->status(), $second->status());
        $this->assertSame($first->getContent(), $second->getContent());
        $this->assertSame(1, User::query()->where('role', 'player')->count());

        $player = User::query()->where('pending_contact_email', 'again@example.com')->first();
        $this->assertNotNull($player);
        $this->assertSame('New Name', $player->name);
        $this->assertSame('Forward / Striker', $player->position);
        $this->assertTrue(Hash::check('another-pass-1', $player->password));
        $this->assertFalse(Hash::check($this->signupPassword(), $player->password));
        $this->assertNull(User::query()->where('name', 'Old Name')->first());
        Mail::assertSent(RegistrationConfirmation::class, 2);
        $this->assertMailWasNotQueued();
        $this->travelBack();
    }

    public function test_confirmed_registration_email_survives_cleanup_commands(): void
    {
        $confirmed = User::factory()->create([
            'name' => 'Confirmed Player',
            'email' => 'vellar90@vellarleague.com',
            'vellar_id' => 'VELLAR 90',
            'role' => 'player',
            'status' => 'active',
            'contact_email' => 'kept@example.com',
        ]);
        $confirmed->forceFill([
            'contact_email_source' => 'registration',
            'email_verified_at' => now(),
            'pending_contact_email' => null,
        ])->save();

        $playerSet = User::factory()->create([
            'name' => 'Player Set',
            'email' => 'vellar91@vellarleague.com',
            'vellar_id' => 'VELLAR 91',
            'role' => 'player',
            'status' => 'active',
            'password' => 'unique-pass-1',
            'contact_email' => 'player.set@example.com',
        ]);
        $playerSet->forceFill([
            'contact_email_source' => 'player',
            'password_is_shared' => false,
            'password_is_shared_verified' => true,
        ])->save();

        $unsourced = User::factory()->create([
            'name' => 'Unsourced',
            'email' => 'vellar92@vellarleague.com',
            'vellar_id' => 'VELLAR 92',
            'role' => 'player',
            'status' => 'active',
            'contact_email' => 'unsourced@example.com',
        ]);
        $unsourced->forceFill([
            'contact_email_source' => null,
        ])->save();

        $this->recoveryChange($confirmed, '2026-01-01 00:00:00');
        $this->recoveryChange($playerSet, '2026-01-01 00:00:00');

        $this->artisan('players:clear-untrusted-contact-emails', ['--force' => true])
            ->expectsOutputToContain('Set by registration: 1')
            ->expectsOutputToContain('Cleared 1')
            ->doesntExpectOutputToContain('@')
            ->assertSuccessful();

        $this->assertSame('kept@example.com', $confirmed->fresh()->contact_email);
        $this->assertSame('registration', $confirmed->fresh()->contact_email_source);
        $this->assertSame('player.set@example.com', $playerSet->fresh()->contact_email);
        $this->assertNull($unsourced->fresh()->contact_email);

        $this->artisan('players:repair-unset-shared-password', [
            '--force' => true,
            '--before' => '2026-01-02 00:00:00',
        ])
            ->expectsOutputToContain('Cleared 1 recovery email(s).')
            ->doesntExpectOutputToContain('@')
            ->assertSuccessful();

        $confirmed->refresh();
        $this->assertSame('kept@example.com', $confirmed->contact_email);
        $this->assertSame('registration', $confirmed->contact_email_source);
        $this->assertNull($playerSet->fresh()->contact_email);
        $this->assertNull($playerSet->fresh()->contact_email_source);
    }

    public function test_expiry_deletes_only_old_unconfirmed_signups(): void
    {
        $old = $this->makeSignup('old@example.com', '81', now()->subDays(8));
        $recent = $this->makeSignup('recent@example.com', '82', now()->subDays(6));
        $confirmed = $this->makeSignup('confirmed@example.com', '83', now()->subDays(8), [
            'email_verified_at' => now()->subDays(8),
        ]);
        $active = $this->makeSignup('active@example.com', '84', now()->subDays(30), [
            'status' => 'active',
            'email_verified_at' => now()->subDays(30),
        ]);
        $legacy = $this->makeSignup('legacy@example.com', '85', now()->subDays(30), [
            'contact_email_source' => null,
            'email_verified_at' => null,
            'pending_contact_email' => null,
            'contact_email' => 'legacy@example.com',
        ]);

        $this->artisan('players:expire-unconfirmed-signups')
            ->expectsOutputToContain('Unconfirmed sign-ups older than 7 days: 1')
            ->expectsOutputToContain('Dry run')
            ->doesntExpectOutputToContain('@')
            ->assertSuccessful();
        $this->assertNotNull($old->fresh());

        $this->artisan('players:expire-unconfirmed-signups', ['--delete' => true])
            ->expectsOutputToContain('Deleted 1')
            ->doesntExpectOutputToContain('example.com')
            ->assertSuccessful();

        $this->assertNull($old->fresh());
        $this->assertNotNull($recent->fresh());
        $this->assertNotNull($confirmed->fresh());
        $this->assertNotNull($active->fresh());
        $this->assertNotNull($legacy->fresh());
    }

    public function test_expiry_command_is_scheduled(): void
    {
        // The schedule entry only runs if cron invokes schedule:run.
        // Reading a sign-up enforces expiry either way.
        $this->artisan('schedule:list')
            ->expectsOutputToContain('players:expire-unconfirmed-signups')
            ->assertSuccessful();

        $commands = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->map(fn ($event) => (string) $event->command)
            ->implode("\n");

        $this->assertStringContainsString('players:expire-unconfirmed-signups', $commands);
        $this->assertStringContainsString('--delete', $commands);
    }

    public function test_check_status_returns_status_only(): void
    {
        Mail::fake();
        config(['nuvra.backoff.check_status.free' => 20]);
        $this->postSignup('player@example.com', 'Hidden Name');
        $token = $this->statusToken();
        $player = User::query()->where('pending_contact_email', 'player@example.com')->first();

        $pending = $this->postJson('/api/community/check-status', [
            'status_token' => $token,
            'vellar_id' => $player->vellar_id,
            'email' => 'player@example.com',
        ])->assertOk();
        $this->assertSame(['status' => 'pending_confirmation'], $pending->json());
        $this->assertResponseHidesVellarId($pending);
        $this->assertStringNotContainsString('Hidden Name', $pending->getContent());
        $this->assertStringNotContainsString('player@example.com', $pending->getContent());
        $this->assertStringNotContainsString((string) $player->vellar_id, $pending->getContent());

        $unknown = $this->postJson('/api/community/check-status', [
            'status_token' => str_repeat('ab', 32),
        ])->assertOk();
        $this->travel(2)->seconds();
        $missing = $this->postJson('/api/community/check-status', [])->assertOk();
        $this->assertSame(['status' => 'rejected_or_expired'], $unknown->json());
        $this->assertSame($unknown->json(), $missing->json());

        $this->travel(2)->seconds();
        $this->postJson('/api/community/email/confirm', ['token' => $this->confirmToken()])->assertOk();
        $this->postJson('/api/community/check-status', ['status_token' => $token])
            ->assertExactJson(['status' => 'pending_approval']);

        $admin = $this->admin();
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertOk();
        $this->postJson('/api/community/check-status', ['status_token' => $token])
            ->assertExactJson(['status' => 'approved']);
    }

    public function test_duplicate_register_route_does_not_create_an_account(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New Player',
            'email' => 'player@example.com',
            'password' => $this->signupPassword(),
            'password_confirmation' => $this->signupPassword(),
        ]);

        $response->assertStatus(308);
        $this->assertStringContainsString('/api/community/register', (string) $response->headers->get('Location'));
        $this->assertDatabaseCount('users', 0);
    }

    public function test_contact_email_field_alone_does_not_set_the_inbox(): void
    {
        $this->postJson('/api/community/register', [
            'name' => 'New Player',
            'email' => 'player@example.com',
            'contact_email' => 'other@example.com',
            'password' => $this->signupPassword(),
            'password_confirmation' => $this->signupPassword(),
        ])->assertOk();

        $player = User::query()->where('name', 'New Player')->first();
        $this->assertSame('player@example.com', $player->pending_contact_email);
        $this->assertNull($player->contact_email);
        $this->assertNull(User::query()->where('pending_contact_email', 'other@example.com')->first());
        $this->assertNull(User::query()->where('contact_email', 'other@example.com')->first());
    }

    public function test_mail_logs_do_not_include_an_address_token_or_link(): void
    {
        Mail::fake();
        $logged = [];
        Log::listen(function ($event) use (&$logged) {
            $logged[] = $event->message.' '.json_encode($event->context);
        });

        $this->postSignup('player@example.com');
        $confirm = $this->confirmToken();
        $status = $this->statusToken();
        $this->postJson('/api/community/email/confirm', ['token' => $confirm])->assertOk();
        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertOk();

        $this->postSignup('other@example.com');
        $this->postJson('/api/community/email/confirm', [
            'token' => $this->confirmToken(RegistrationConfirmation::class, 'other@example.com'),
        ])->assertOk();
        $other = User::query()->where('contact_email', 'other@example.com')->first();
        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson('/api/community/admin/reject-player/'.$other->id)
            ->assertOk();

        $all = implode("\n", $logged);
        $this->assertStringNotContainsString('player@example.com', $all);
        $this->assertStringNotContainsString('other@example.com', $all);
        $this->assertStringNotContainsString($confirm, $all);
        $this->assertStringNotContainsString($status, $all);
        $this->assertStringNotContainsString('http', strtolower($all));
        $this->assertStringContainsString('player_id', $all);
        $this->assertStringContainsString('Registration confirmation email sent.', $all);
        $this->assertStringContainsString('Registration approval email sent.', $all);
        $this->assertStringContainsString('Registration rejection email sent.', $all);
    }

    public function test_a_failed_send_logs_the_player_id_and_not_the_exception_text(): void
    {
        $logged = [];
        Log::listen(function ($event) use (&$logged) {
            $logged[] = $event->message.' '.json_encode($event->context);
        });

        $pending = \Mockery::mock();
        $pending->shouldReceive('send')->once()->andThrow(new \RuntimeException(
            'smtp failed for player@example.com https://uat.nuvrasports.com/email/confirm/abcdef token'
        ));
        Mail::shouldReceive('to')->once()->andReturn($pending);

        $this->postSignup('player@example.com')->assertOk();

        $all = implode("\n", $logged);
        $this->assertStringContainsString('Registration confirmation email failed.', $all);
        $this->assertStringContainsString('player_id', $all);
        $this->assertStringNotContainsString('player@example.com', $all);
        $this->assertStringNotContainsString('https://', $all);
        $this->assertStringNotContainsString('abcdef', $all);
        $this->assertStringNotContainsString('token', strtolower($all));
    }

    public function test_concurrent_signups_receive_distinct_vellar_ids(): void
    {
        $path = storage_path('framework/vellar-race-'.bin2hex(random_bytes(4)).'.sqlite');
        touch($path);

        config([
            'database.connections.race' => [
                'driver' => 'sqlite',
                'database' => $path,
                'prefix' => '',
                'foreign_key_constraints' => true,
                'busy_timeout' => 5000,
                'journal_mode' => 'wal',
                'transaction_mode' => 'IMMEDIATE',
            ],
        ]);

        $exit = Artisan::call('migrate', ['--database' => 'race', '--force' => true]);
        $this->assertSame(0, $exit, Artisan::output());
        DB::purge('race');

        $processes = [];
        for ($i = 1; $i <= 4; $i++) {
            $env = getenv() ?: [];
            $env['RACE_DB'] = $path;
            $env['RACE_EMAIL'] = "racer{$i}@example.com";
            $env['RACE_NAME'] = 'Racer '.$i;
            $env['RACE_PASSWORD'] = $this->signupPassword();
            $process = new Process([PHP_BINARY, base_path('tests/Support/register_racer.php')], base_path(), $env, null, 30);
            $process->start();
            $processes[] = $process;
        }

        foreach ($processes as $process) {
            $process->wait();
            $this->assertSame(0, $process->getExitCode(), $process->getOutput()."\n".$process->getErrorOutput());
            $this->assertSame('200', $process->getOutput());
        }

        $rows = DB::connection('race')->table('users')->where('role', 'player')->get();
        $this->assertCount(4, $rows);
        $this->assertCount(4, $rows->pluck('vellar_id')->unique());
        $this->assertCount(4, $rows->pluck('email')->unique());
        $this->assertCount(4, $rows->pluck('pending_contact_email')->unique());
        $this->assertTrue($rows->every(fn ($row) => $row->contact_email === null));
        $this->assertTrue($rows->every(fn ($row) => $row->contact_email_source === null));

        foreach (glob($path.'*') ?: [] as $file) {
            @unlink($file);
        }
    }

    public function test_rejecting_an_active_player_is_refused(): void
    {
        Mail::fake();
        $player = User::factory()->create([
            'name' => 'Active Player',
            'email' => 'vellar70@vellarleague.com',
            'vellar_id' => 'VELLAR 70',
            'role' => 'player',
            'status' => 'active',
            'contact_email' => 'active@example.com',
        ]);
        $player->forceFill([
            'contact_email_source' => 'admin',
            'email_verified_at' => now(),
        ])->save();

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson('/api/community/admin/reject-player/'.$player->id)
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Only a pending registration can be rejected.']);

        Mail::assertNothingSent();
        $this->assertSame('active', $player->fresh()->status);
        $this->assertSame(0, PlayerRegistrationAudit::query()->count());
    }

    public function test_rejecting_an_unconfirmed_signup_deletes_it_and_sends_no_mail(): void
    {
        Mail::fake();
        $this->postSignup('pending@example.com', 'Pending Player');
        $player = User::query()->where('pending_contact_email', 'pending@example.com')->first();

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson('/api/community/admin/reject-player/'.$player->id)
            ->assertOk();

        Mail::assertNotSent(RegistrationRejected::class);
        Mail::assertSent(RegistrationConfirmation::class, 1);
        $this->assertDatabaseMissing('users', ['id' => $player->id]);
    }

    public function test_delete_action_removes_an_active_player_without_mail(): void
    {
        Mail::fake();
        $player = User::factory()->create([
            'name' => 'Active Player',
            'email' => 'vellar71@vellarleague.com',
            'vellar_id' => 'VELLAR 71',
            'role' => 'player',
            'status' => 'active',
            'contact_email' => 'active@example.com',
        ]);
        $player->forceFill([
            'contact_email_source' => 'registration',
            'email_verified_at' => now(),
        ])->save();
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/community/admin/players/'.$player->id)
            ->assertOk()
            ->assertJsonMissing(['vellar_id']);

        Mail::assertNothingSent();
        $this->assertDatabaseMissing('users', ['id' => $player->id]);

        $audit = PlayerRegistrationAudit::query()->first();
        $this->assertNotNull($audit);
        $this->assertSame($player->id, $audit->player_id);
        $this->assertSame($admin->id, $audit->admin_id);
        $this->assertSame('delete', $audit->action);
        $this->assertStringNotContainsString('active@example.com', (string) $audit->email_masked);
        $this->assertNotNull($audit->fresh());
    }

    public function test_delete_action_refuses_non_admin_pending_and_admin_targets(): void
    {
        Mail::fake();
        $admin = $this->admin();
        $active = $this->activePlayer('72', 'kept.active@example.com');
        $caller = User::factory()->create([
            'name' => 'Ordinary Player',
            'email' => 'caller@example.com',
            'vellar_id' => 'VELLAR 73',
            'role' => 'player',
            'status' => 'active',
        ]);

        $this->actingAs($caller, 'sanctum')
            ->deleteJson('/api/community/admin/players/'.$active->id)
            ->assertForbidden();
        $this->assertDeleteWasRefused($active);

        $pending = $this->activePlayer('74', 'pending.target@example.com', 'pending');
        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/community/admin/players/'.$pending->id)
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Only an active player can be removed this way.']);
        $this->assertDeleteWasRefused($pending);

        $adminTarget = $this->admin();
        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/community/admin/players/'.$adminTarget->id)
            ->assertForbidden();
        $this->assertDeleteWasRefused($adminTarget);
    }

    public function test_a_failed_player_delete_rolls_back_the_audit_row(): void
    {
        Mail::fake();
        $player = $this->activePlayer('75', 'blocked.delete@example.com');
        User::deleting(function () {
            throw new \RuntimeException('delete blocked');
        });

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson('/api/community/admin/players/'.$player->id)
            ->assertStatus(500);

        $this->assertDeleteWasRefused($player);
    }

    public function test_approval_says_when_the_vellar_id_email_was_not_sent(): void
    {
        Mail::fake();
        $player = User::factory()->create([
            'name' => 'Legacy Pending',
            'email' => 'vellar77@vellarleague.com',
            'vellar_id' => 'VELLAR 77',
            'role' => 'player',
            'status' => 'pending',
            'contact_email' => null,
            'email_verified_at' => now(),
        ]);
        $player->forceFill([
            'contact_email_source' => null,
            'pending_contact_email' => null,
        ])->save();

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertOk()
            ->assertJsonPath('email_sent', false);

        $this->assertStringContainsString('The Vellar ID email was not sent.', (string) $response->json('message'));
        $this->assertStringNotContainsString('emailed to them', strtolower((string) $response->json('message')));
        $this->assertResponseHidesVellarId($response);
        Mail::assertNotSent(RegistrationApproved::class);
        $this->assertSame('active', $player->fresh()->status);
    }

    public function test_approval_reports_a_failed_id_email(): void
    {
        $confirmed = User::factory()->create([
            'name' => 'Confirmed Pending',
            'email' => 'vellar78@vellarleague.com',
            'vellar_id' => 'VELLAR 78',
            'role' => 'player',
            'status' => 'pending',
            'contact_email' => 'confirmed@example.com',
            'email_verified_at' => now(),
        ]);
        $confirmed->forceFill([
            'contact_email_source' => 'registration',
            'pending_contact_email' => null,
        ])->save();

        $pending = \Mockery::mock();
        $pending->shouldReceive('send')->once()->andThrow(new \RuntimeException('smtp failed for confirmed@example.com'));
        Mail::shouldReceive('to')->once()->andReturn($pending);

        $failed = $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$confirmed->id)
            ->assertOk()
            ->assertJsonPath('email_sent', false);

        $this->assertStringContainsString('The Vellar ID email was not sent.', (string) $failed->json('message'));
        $this->assertStringNotContainsString('confirmed@example.com', $failed->getContent());
        $this->assertStringNotContainsString('78', (string) $failed->json('message'));
        $this->assertResponseHidesVellarId($failed);
        $this->assertSame('active', $confirmed->fresh()->status);
    }

    public function test_plus_addressing_shares_the_per_address_cap(): void
    {
        Mail::fake();
        config([
            'nuvra.registration_limits.confirm_mail.per_email.max' => 1,
            'nuvra.registration_limits.confirm_mail.daily.max' => 20,
        ]);

        $this->postSignup('a@example.com', 'First Player')->assertOk();
        $this->postSignup('A+Tag@Example.com', 'Tagged Player')->assertOk();

        $plain = User::query()->where('pending_contact_email', 'a@example.com')->first();
        $tagged = User::query()->where('pending_contact_email', 'a+tag@example.com')->first();
        $this->assertNotNull($plain);
        $this->assertNotNull($tagged);
        $this->assertNotSame($plain->id, $tagged->id);
        $this->assertSame('a+tag@example.com', $tagged->pending_contact_email);
        Mail::assertSent(RegistrationConfirmation::class, 1);
    }

    public function test_site_wide_cap_logs_a_warning_without_an_address(): void
    {
        Mail::fake();
        config([
            'nuvra.registration_limits.confirm_mail.per_email.max' => 5,
            'nuvra.registration_limits.confirm_mail.daily.max' => 1,
        ]);
        $logged = [];
        Log::listen(function ($event) use (&$logged) {
            if ($event->level === 'warning') {
                $logged[] = $event->message.' '.json_encode($event->context);
            }
        });

        $this->postSignup('one@example.com')->assertOk();
        $this->postSignup('two@example.com')->assertOk();

        $all = implode("\n", $logged);
        $this->assertStringContainsString('Registration confirm mail cap reached.', $all);
        $this->assertStringNotContainsString('one@example.com', $all);
        $this->assertStringNotContainsString('two@example.com', $all);
        $this->assertStringNotContainsString('@', $all);
    }

    public function test_inbox_conflict_matches_only_the_unique_inbox_constraint(): void
    {
        $unique = new \PDOException('UNIQUE constraint failed: users.pending_contact_email');
        $unique->errorInfo = ['23000', 19, 'UNIQUE constraint failed: users.pending_contact_email'];
        $inbox = new QueryException(
            'sqlite',
            'update users set contact_email = ?, pending_contact_email = ?',
            ['a@example.com', 'a@example.com'],
            $unique,
        );
        $this->assertTrue(UniqueConstraint::isInbox($inbox));

        $other = new \PDOException('no such column: users.contact_email');
        $other->errorInfo = ['HY000', 1, 'no such column: users.contact_email'];
        $notUnique = new QueryException(
            'sqlite',
            'update users set contact_email = ?, pending_contact_email = ?',
            ['a@example.com', 'a@example.com'],
            $other,
        );
        $this->assertFalse(UniqueConstraint::isInbox($notUnique));
        $this->assertStringContainsString('contact_email', $notUnique->getMessage());
    }

    public function test_frontend_does_not_show_or_store_a_registration_vellar_id(): void
    {
        $files = [
            resource_path('js/Pages/Authentication/AuthPage.jsx'),
            resource_path('js/Pages/Community/CommunityHome.jsx'),
            resource_path('js/Pages/WaitingRoom.jsx'),
            resource_path('js/Pages/Authentication/ConfirmEmail.jsx'),
            resource_path('js/Pages/Community/Admin/AdminPendingPlayers.jsx'),
        ];

        foreach ($files as $file) {
            $source = file_get_contents($file);
            $this->assertDoesNotMatchRegularExpression(
                "/localStorage\\.setItem\\(\\s*['\"]pending_vellar_id/",
                $source,
                $file
            );
            $this->assertDoesNotMatchRegularExpression(
                "/localStorage\\.setItem\\(\\s*['\"]vellar_id/",
                $source,
                $file
            );
            $this->assertStringNotContainsString('Your Vellar ID', $source, $file);
            $this->assertStringNotContainsString('vellar_number', $source, $file);
        }

        $confirm = file_get_contents(resource_path('js/Pages/Authentication/ConfirmEmail.jsx'));
        $this->assertStringContainsString('location.hash', $confirm);
        $this->assertStringNotContainsString('useParams', $confirm);
        $routes = file_get_contents(resource_path('js/app.jsx'));
        $this->assertStringContainsString('path="/email/confirm"', $routes);
        $this->assertStringNotContainsString('/email/confirm/:token', $routes);
        $pending = file_get_contents(resource_path('js/Pages/Community/Admin/AdminPendingPlayers.jsx'));
        $this->assertStringNotContainsString('Their Vellar ID is emailed to them', $pending);
        $this->assertStringContainsString('res.data.message', $pending);

        $members = file_get_contents(resource_path('js/Pages/Community/CommunityMembers.jsx'));
        $this->assertStringContainsString(
            'Permanently remove ${member.name}? This can\'t be undone and deletes their stats and profile. No email is sent.',
            $members
        );
    }

    private function assertDeleteWasRefused(User $target): void
    {
        Mail::assertNothingSent();
        $this->assertNotNull($target->fresh());
        $this->assertSame(0, PlayerRegistrationAudit::query()->count());
    }

    private function activePlayer(string $number, string $email, string $status = 'active'): User
    {
        $player = User::factory()->create([
            'name' => 'Player '.$number,
            'email' => 'vellar'.$number.'@vellarleague.com',
            'vellar_id' => 'VELLAR '.$number,
            'role' => 'player',
            'status' => $status,
            'contact_email' => $email,
        ]);
        $player->forceFill([
            'contact_email_source' => 'registration',
            'email_verified_at' => now(),
            'pending_contact_email' => null,
        ])->save();

        return $player->fresh();
    }

    private function assertResponseHidesVellarId(\Illuminate\Testing\TestResponse $response): void
    {
        $body = strtolower($response->getContent());
        $this->assertDoesNotMatchRegularExpression('/vellar\s*\d+/', $body);
        $this->assertStringNotContainsString('vellar_id', $body);
        $this->assertStringNotContainsString('@vellarleague.com', $body);
    }

    private function assertMailWasNotQueued(): void
    {
        Mail::assertNothingQueued();
        $this->assertSame(0, DB::table('jobs')->count());
        foreach ([
            RegistrationConfirmation::class,
            RegistrationAlreadyExists::class,
            RegistrationApproved::class,
            RegistrationRejected::class,
            DeliverRegistrationMail::class,
        ] as $class) {
            $this->assertNotContains(ShouldQueue::class, class_implements($class));
        }
    }

    private function recoveryChange(User $player, string $at): void
    {
        $change = ContactEmailChange::query()->create([
            'player_id' => $player->id,
            'old_email_masked' => 'a***@example.com',
            'new_email_masked' => 'b***@example.com',
            'ip_address' => '127.0.0.1',
        ]);
        $change->forceFill(['created_at' => $at])->save();
    }

    private function postSignup(string $email, string $name = 'New Player', array $extra = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/community/register', array_merge([
            'name' => $name,
            'email' => $email,
            'password' => $this->signupPassword(),
            'password_confirmation' => $this->signupPassword(),
        ], $extra));
    }

    private function signupPassword(): string
    {
        return 'brand-new-pass';
    }

    private function confirmToken(string $mailable = RegistrationConfirmation::class, ?string $email = null): string
    {
        $found = null;
        Mail::assertSent($mailable, function ($mail) use (&$found, $email) {
            if ($email !== null && ! $mail->hasTo($email)) {
                return false;
            }
            $found = $this->tokenFrom($mail->confirmUrl, '~/email/confirm#t=([0-9a-f]{64})~');

            return $found !== '';
        });

        return (string) $found;
    }

    private function statusToken(): string
    {
        $found = null;
        Mail::assertSent(RegistrationConfirmation::class, function (RegistrationConfirmation $mail) use (&$found) {
            $found = $this->tokenFrom($mail->statusUrl, '~/waiting-room#t=([0-9a-f]{64})~');

            return $found !== '';
        });

        return (string) $found;
    }

    private function tokenFrom(string $url, string $pattern): string
    {
        preg_match($pattern, $url, $matches);

        return $matches[1] ?? '';
    }

    private function admin(): User
    {
        return User::factory()->create([
            'name' => 'League Admin',
            'email' => 'admin-'.bin2hex(random_bytes(3)).'@example.com',
            'role' => 'admin',
            'status' => 'active',
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function makeSignup(string $email, string $number, \Illuminate\Support\Carbon $createdAt, array $overrides = []): User
    {
        $verified = array_key_exists('email_verified_at', $overrides) ? $overrides['email_verified_at'] : null;
        $status = $overrides['status'] ?? 'pending';
        $source = array_key_exists('contact_email_source', $overrides)
            ? $overrides['contact_email_source']
            : ($verified !== null ? 'registration' : null);
        $pending = array_key_exists('pending_contact_email', $overrides)
            ? $overrides['pending_contact_email']
            : ($verified === null && $status === 'pending' && $source === null ? $email : null);
        $contact = array_key_exists('contact_email', $overrides)
            ? $overrides['contact_email']
            : ($pending === null ? $email : null);

        $user = User::factory()->create([
            'name' => 'Player '.$number,
            'email' => 'vellar'.$number.'@vellarleague.com',
            'vellar_id' => 'VELLAR '.$number,
            'role' => 'player',
            'status' => $status,
            'contact_email' => $contact,
            'email_verified_at' => $verified,
        ]);
        $user->forceFill([
            'contact_email_source' => $source,
            'pending_contact_email' => $pending,
            'created_at' => $createdAt,
        ])->save();

        return $user->fresh();
    }
}
