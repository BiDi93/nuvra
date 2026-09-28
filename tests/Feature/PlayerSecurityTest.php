<?php

namespace Tests\Feature;

use App\Contracts\SmsSender;
use App\Mail\PlayerPasswordResetLink;
use App\Mail\ContactEmailChanged;
use App\Models\ContactEmailChange;
use App\Models\FootballMatch;
use App\Models\PlayerVerificationCode;
use App\Models\Tournament;
use App\Models\User;
use App\Support\AuthMessages;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class PlayerSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_errors_do_not_reveal_whether_an_id_exists(): void
    {
        $this->player('82');

        $unknown = $this->postJson('/api/community/login', [
            'vellar_id' => '99999',
            'password' => $this->sharedPassword(),
        ]);
        $this->travel(2)->seconds();
        $known = $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'not-the-password',
        ]);

        $unknown->assertStatus(401);
        $known->assertStatus(401);
        $this->assertSame(AuthMessages::LOGIN_FAILED, $unknown->json('message'));
        $this->assertSame($unknown->json('message'), $known->json('message'));
    }

    public function test_shared_password_still_works_until_the_manual_command(): void
    {
        $this->player('82');

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => $this->sharedPassword(),
        ])->assertOk()->assertJsonStructure(['token']);
    }

    public function test_player_marked_for_reset_cannot_sign_in_even_with_the_right_password(): void
    {
        $player = $this->player('82');
        $player->forceFill(['password_reset_required' => true])->save();

        config([
            'nuvra.backoff.login.base' => 30,
            'nuvra.backoff.login.cap' => 30,
            'nuvra.backoff.login.free' => 0,
        ]);

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => $this->sharedPassword(),
        ])->assertStatus(403)
            ->assertJson([
                'message' => AuthMessages::SET_PASSWORD,
                'password_reset_required' => true,
            ])
            ->assertJsonMissing(['token']);

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => $this->sharedPassword(),
        ])->assertStatus(429);
    }

    public function test_login_backoff_grows_and_then_expires(): void
    {
        config([
            'nuvra.backoff.login.base' => 1,
            'nuvra.backoff.login.cap' => 8,
            'nuvra.backoff.login.free' => 0,
        ]);

        $this->player('82');

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $firstWait = $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'wrong-password',
        ]);
        $firstWait->assertStatus(429)->assertJson(['message' => AuthMessages::TOO_MANY]);
        $firstRetry = (int) $firstWait->headers->get('Retry-After');
        $this->assertGreaterThanOrEqual(1, $firstRetry);

        $this->travel($firstRetry)->seconds();

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $secondWait = $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'wrong-password',
        ]);
        $secondWait->assertStatus(429);
        $this->assertGreaterThan($firstRetry, (int) $secondWait->headers->get('Retry-After'));
    }

    public function test_login_backoff_applies_per_ip_across_ids(): void
    {
        config([
            'nuvra.backoff.login.base' => 2,
            'nuvra.backoff.login.cap' => 8,
            'nuvra.backoff.login.free' => 0,
        ]);

        $this->postJson('/api/community/login', [
            'vellar_id' => '501',
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $this->postJson('/api/community/login', [
            'vellar_id' => '502',
            'password' => 'wrong-password',
        ])->assertStatus(429);

        $this->travel(2)->seconds();

        $this->postJson('/api/community/login', [
            'vellar_id' => '503',
            'password' => 'wrong-password',
        ])->assertStatus(401);
    }

    public function test_registration_rejects_the_shared_default_password(): void
    {
        $this->postJson('/api/community/register', [
            'name' => 'New Player',
            'password' => $this->sharedPassword(),
            'password_confirmation' => $this->sharedPassword(),
        ])->assertStatus(422);
    }

    public function test_password_cannot_be_set_without_a_verification_secret(): void
    {
        $this->player('82');

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'password' => 'a-new-password',
            'password_confirmation' => 'a-new-password',
        ])->assertStatus(422)->assertJson(['message' => AuthMessages::RESET_FAILED]);

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => $this->sharedPassword(),
        ])->assertOk();
    }

    public function test_reset_request_is_generic_and_sends_nothing_without_a_channel(): void
    {
        Mail::fake();
        $this->player('82', ['phone' => '0123456789']);

        $known = $this->postJson('/api/community/password/request', ['vellar_id' => '82']);
        $this->travel(2)->seconds();
        $unknown = $this->postJson('/api/community/password/request', ['vellar_id' => '40404']);

        $known->assertOk();
        $unknown->assertOk();
        $this->assertSame(AuthMessages::RESET_SENT, $known->json('message'));
        $this->assertSame($known->json('message'), $unknown->json('message'));
        Mail::assertNothingSent();
        $this->assertDatabaseCount('player_verification_codes', 0);
    }

    public function test_recovery_email_link_sets_a_password_once(): void
    {
        Mail::fake();
        $player = $this->player('82');
        $player->forceFill(['contact_email' => 'player@example.com'])->save();
        $oldToken = $player->createToken('session')->plainTextToken;

        $this->postJson('/api/community/password/request', ['vellar_id' => '82'])->assertOk();

        $token = null;
        Mail::assertSent(PlayerPasswordResetLink::class, function (PlayerPasswordResetLink $mail) use (&$token) {
            parse_str((string) parse_url($mail->resetUrl, PHP_URL_QUERY), $query);
            $token = $query['token'] ?? null;

            return $mail->hasTo('player@example.com') && filled($token);
        });

        $this->postJson('/api/community/password/reset', [
            'token' => $token,
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertOk();

        $this->postJson('/api/community/password/reset', [
            'token' => $token,
            'password' => 'another-pass-1',
            'password_confirmation' => 'another-pass-1',
        ])->assertStatus(422);

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => $this->sharedPassword(),
        ])->assertStatus(401);

        $this->travel(2)->seconds();

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'brand-new-pass',
        ])->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$oldToken)
            ->getJson('/api/community/me')
            ->assertStatus(401);
    }

    public function test_sms_code_sets_a_password_when_sms_is_enabled(): void
    {
        $sms = new RecordingSmsSender;
        $this->app->instance(SmsSender::class, $sms);
        $this->player('82', ['phone' => '012-345 6789']);

        $this->postJson('/api/community/password/request', ['vellar_id' => 'VELLAR 82'])->assertOk();

        $this->assertCount(1, $sms->messages);
        $this->assertSame('0123456789', $sms->messages[0]['to']);
        preg_match('/\b(\d{6})\b/', $sms->messages[0]['message'], $matches);
        $this->assertNotEmpty($matches[1] ?? null);

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => $matches[1],
            'password' => 'from-sms-code',
            'password_confirmation' => 'from-sms-code',
        ])->assertOk();

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'from-sms-code',
        ])->assertOk();
    }

    public function test_reset_attempts_use_backoff_instead_of_a_hard_lock(): void
    {
        config([
            'nuvra.backoff.password_reset.base' => 1,
            'nuvra.backoff.password_reset.cap' => 8,
            'nuvra.backoff.password_reset.free' => 0,
        ]);
        $this->player('82');

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => 'AAAA-BBBB',
            'password' => 'a-new-password',
            'password_confirmation' => 'a-new-password',
        ])->assertStatus(422);

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => 'AAAA-BBBB',
            'password' => 'a-new-password',
            'password_confirmation' => 'a-new-password',
        ])->assertStatus(429);

        $this->travel(2)->seconds();

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => 'AAAA-BBBB',
            'password' => 'a-new-password',
            'password_confirmation' => 'a-new-password',
        ])->assertStatus(422);
    }

    public function test_admin_activation_code_is_single_use_and_hidden_from_players(): void
    {
        $player = $this->player('82', ['phone' => null]);
        $admin = $this->admin();

        $this->actingAs($player, 'sanctum')
            ->postJson("/api/community/admin/players/{$player->id}/activation-code")
            ->assertStatus(403);

        $issued = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/community/admin/players/{$player->id}/activation-code")
            ->assertOk();

        $code = $issued->json('activation_code');
        $this->assertMatchesRegularExpression('/^[A-Z2-9]{4}-[A-Z2-9]{4}$/', $code);

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => $code,
            'password' => $this->sharedPassword(),
            'password_confirmation' => $this->sharedPassword(),
        ])->assertStatus(422);

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => $code,
            'password' => 'activated-pass',
            'password_confirmation' => 'activated-pass',
        ])->assertOk();

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => $code,
            'password' => 'activated-again',
            'password_confirmation' => 'activated-again',
        ])->assertStatus(422);
    }

    public function test_retire_command_is_dry_run_by_default_and_refuses_undeliverable_players(): void
    {
        Mail::fake();
        $shared = $this->player('82', ['phone' => '0123456789']);
        $unique = $this->player('83', ['password' => 'already-unique']);
        $token = $shared->createToken('session')->plainTextToken;

        $this->artisan('players:retire-default-passwords')->assertSuccessful();
        $this->assertTrue(Hash::check($this->sharedPassword(), $shared->fresh()->password));
        Mail::assertNothingSent();

        config(['nuvra.retire_shared_passwords' => false]);
        $this->artisan('players:retire-default-passwords', ['--force' => true])->assertFailed();

        config(['nuvra.retire_shared_passwords' => true]);
        $this->artisan('players:retire-default-passwords', ['--force' => true])->assertFailed();
        $this->assertTrue(Hash::check($this->sharedPassword(), $shared->fresh()->password));
        $this->assertFalse($shared->fresh()->password_reset_required);

        $this->artisan('players:retire-default-passwords', [
            '--force' => true,
            '--allow-undeliverable' => true,
        ])->assertSuccessful();

        $shared->refresh();
        $unique->refresh();
        $this->assertFalse(Hash::check($this->sharedPassword(), $shared->password));
        $this->assertTrue($shared->password_reset_required);
        $this->assertTrue(Hash::check('already-unique', $unique->password));
        $this->assertFalse($unique->password_reset_required);
        Mail::assertNothingSent();

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => $this->sharedPassword(),
        ])->assertStatus(401);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/community/me')
            ->assertStatus(401);

        $this->travel(2)->seconds();

        $this->postJson('/api/community/login', [
            'vellar_id' => '83',
            'password' => 'already-unique',
        ])->assertOk();
    }

    public function test_retire_command_applies_without_the_undeliverable_flag_when_email_exists(): void
    {
        Mail::fake();
        $player = $this->player('82');
        $player->forceFill(['contact_email' => 'player@example.com'])->save();

        config(['nuvra.retire_shared_passwords' => true]);
        $this->artisan('players:retire-default-passwords', ['--force' => true])->assertSuccessful();

        $this->assertTrue($player->fresh()->password_reset_required);
        $this->assertFalse(Hash::check($this->sharedPassword(), $player->fresh()->password));
        Mail::assertNothingSent();
    }

    public function test_player_cannot_view_another_players_private_profile_fields(): void
    {
        $owner = $this->player('82', [
            'phone' => '0123456789',
            'address' => 'Bangi',
            'contact_email' => 'owner@example.com',
        ]);
        $other = $this->player('83');
        $admin = $this->admin();

        $guest = $this->getJson("/api/community/members/{$owner->id}");
        $guest->assertOk();
        $this->assertArrayNotHasKey('phone', $guest->json('user'));
        $this->assertArrayNotHasKey('address', $guest->json('user'));
        $this->assertArrayNotHasKey('contact_email', $guest->json('user'));
        $this->assertArrayNotHasKey('email', $guest->json('user'));

        $this->app['auth']->forgetGuards();
        $asOther = $this->withHeader('Authorization', 'Bearer '.$other->createToken('t')->plainTextToken)
            ->getJson("/api/community/members/{$owner->id}");
        $asOther->assertOk();
        $this->assertArrayNotHasKey('phone', $asOther->json('user'));

        $this->app['auth']->forgetGuards();
        $asSelf = $this->withHeader('Authorization', 'Bearer '.$owner->createToken('t')->plainTextToken)
            ->getJson("/api/community/members/{$owner->id}");
        $asSelf->assertOk()->assertJsonPath('user.phone', '0123456789');

        $this->app['auth']->forgetGuards();
        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/community/members/{$owner->id}")
            ->assertOk()
            ->assertJsonPath('user.contact_email', 'owner@example.com');
    }

    public function test_player_cannot_change_protected_account_fields_from_the_profile_form(): void
    {
        $player = $this->player('82', ['password' => 'unique-pass-1']);

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Renamed',
            'password' => 'stolen-pass',
            'password_reset_required' => true,
            'role' => 'admin',
            'email' => 'attacker@example.com',
            'contact_email' => 'safe@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertOk();

        $player->refresh();
        $this->assertSame('Renamed', $player->name);
        $this->assertSame('player', $player->role);
        $this->assertFalse($player->password_reset_required);
        $this->assertTrue(Hash::check('unique-pass-1', $player->password));
        $this->assertSame('vellar82@vellarleague.com', $player->email);
        $this->assertSame('safe@example.com', $player->contact_email);

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Renamed',
            'contact_email' => 'vellar82@vellarleague.com',
            'current_password' => 'unique-pass-1',
        ])->assertStatus(422);
    }

    public function test_contact_email_change_is_refused_until_the_player_has_their_own_password(): void
    {
        Mail::fake();

        $shared = $this->player('82', ['name' => 'Original']);

        $this->actingAs($shared, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken',
            'contact_email' => 'attacker@example.com',
            'current_password' => $this->sharedPassword(),
        ])->assertForbidden()
            ->assertJsonPath('message', AuthMessages::CONTACT_EMAIL_LOCKED);

        $shared->refresh();
        $this->assertSame('Original', $shared->name);
        $this->assertNull($shared->contact_email);
        $this->assertSame(0, ContactEmailChange::query()->count());
        Mail::assertNothingSent();

        $reset = $this->player('83', [
            'name' => 'Original',
            'password' => 'unique-pass-1',
        ]);
        $reset->forceFill([
            'password_reset_required' => true,
            'password_is_shared' => false,
        ])->save();

        $this->actingAs($reset, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken',
            'contact_email' => 'attacker@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertUnauthorized();

        $reset->refresh();
        $this->assertSame('Original', $reset->name);
        $this->assertNull($reset->contact_email);

        $this->withoutMiddleware(\App\Http\Middleware\ForceVerifiedReset::class);

        $this->actingAs($reset, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken',
            'contact_email' => 'attacker@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertForbidden()
            ->assertJsonPath('message', AuthMessages::CONTACT_EMAIL_LOCKED);

        $reset->refresh();
        $this->assertSame('Original', $reset->name);
        $this->assertNull($reset->contact_email);
        Mail::assertNothingSent();
    }

    public function test_contact_email_change_requires_the_current_password_and_notifies_a_real_address(): void
    {
        Mail::fake();

        $player = $this->player('82', [
            'name' => 'Original',
            'password' => 'unique-pass-1',
            'contact_email' => 'old.player@example.com',
        ]);
        $player->forceFill(['password_is_shared' => false])->save();

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Should Stay',
            'contact_email' => 'new.player@example.com',
            'current_password' => 'wrong-password',
        ])->assertStatus(422);

        $player->refresh();
        $this->assertSame('Original', $player->name);
        $this->assertSame('old.player@example.com', $player->contact_email);
        $this->assertSame(0, ContactEmailChange::query()->count());
        Mail::assertNothingSent();

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'unique-pass-1',
        ])->assertStatus(429);

        $this->travel(2)->seconds();

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Renamed',
            'phone' => '0123456789',
            'contact_email' => '  New.Player@Example.com ',
            'current_password' => 'unique-pass-1',
        ])->assertOk();

        $player->refresh();
        $this->assertSame('Renamed', $player->name);
        $this->assertSame('0123456789', $player->phone);
        $this->assertSame('new.player@example.com', $player->contact_email);
        $this->assertSame('player', $player->contact_email_source);

        $audit = ContactEmailChange::query()->first();
        $this->assertNotNull($audit);
        $this->assertSame($player->id, $audit->player_id);
        $this->assertNotNull($audit->created_at);
        $this->assertNotSame('', (string) $audit->ip_address);
        $this->assertStringContainsString('*', $audit->old_email_masked);
        $this->assertStringContainsString('*', $audit->new_email_masked);
        $this->assertStringNotContainsString('old.player@example.com', $audit->old_email_masked);
        $this->assertStringNotContainsString('new.player@example.com', $audit->new_email_masked);

        Mail::assertSent(ContactEmailChanged::class, function (ContactEmailChanged $mail) {
            $html = $mail->render();

            return $mail->hasTo('old.player@example.com')
                && ! str_contains($html, 'http')
                && ! str_contains(strtolower($html), 'token');
        });
    }

    public function test_contact_email_change_does_not_notify_a_placeholder_address(): void
    {
        Mail::fake();

        $player = $this->player('82', [
            'password' => 'unique-pass-1',
            'contact_email' => 'vellar82@vellarleague.com',
        ]);
        $player->forceFill([
            'password_is_shared' => false,
            'contact_email_source' => 'player',
        ])->save();

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Renamed',
            'contact_email' => 'real.player@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertOk();

        $this->assertSame('real.player@example.com', $player->fresh()->contact_email);
        $this->assertSame(1, ContactEmailChange::query()->count());
        Mail::assertNothingSent();
    }

    public function test_taken_and_unknown_recovery_emails_cannot_be_told_apart(): void
    {
        $admin = $this->admin();
        $admin->forceFill(['email' => 'Desk@Example.com'])->save();
        $adminEmail = 'desk@example.com';
        $player = $this->player('82', [
            'name' => 'Original',
            'password' => 'unique-pass-1',
        ]);
        $player->forceFill(['password_is_shared' => false])->save();

        $taken = $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken Over',
            'contact_email' => $adminEmail,
            'current_password' => 'wrong-password',
        ]);
        $this->travel(2)->seconds();
        $notTaken = $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken Over',
            'contact_email' => 'unused.person@example.com',
            'current_password' => 'wrong-password',
        ]);

        $taken->assertStatus(422);
        $this->assertSame($taken->status(), $notTaken->status());
        $this->assertSame($taken->getContent(), $notTaken->getContent());
        $this->assertStringNotContainsString('already in use', $taken->getContent());
        $this->assertStringNotContainsString($adminEmail, $taken->getContent());
        $this->assertStringNotContainsString('unused.person@example.com', $notTaken->getContent());

        $this->travel(2)->seconds();

        $takenWithPassword = $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken Over',
            'contact_email' => $adminEmail,
            'current_password' => 'unique-pass-1',
        ]);
        $otherRejection = $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken Over',
            'contact_email' => 'vellar82@vellarleague.com',
            'current_password' => 'unique-pass-1',
        ]);

        $takenWithPassword->assertStatus(422);
        $this->assertSame($takenWithPassword->status(), $otherRejection->status());
        $this->assertSame($takenWithPassword->getContent(), $otherRejection->getContent());
        $this->assertSame(AuthMessages::CONTACT_EMAIL_REJECTED, $takenWithPassword->json('message'));
        $this->assertStringNotContainsString('already in use', $takenWithPassword->getContent());
        $this->assertStringNotContainsString($adminEmail, $takenWithPassword->getContent());

        $player->refresh();
        $this->assertSame('Original', $player->name);
        $this->assertNull($player->contact_email);
    }

    public function test_a_failed_recovery_email_notice_does_not_undo_the_change(): void
    {
        $logged = [];
        Log::listen(function ($event) use (&$logged) {
            $logged[] = $event->level.':'.$event->message;
        });

        $pending = \Mockery::mock();
        $pending->shouldReceive('send')->once()->andThrow(new RuntimeException('smtp failed for old.player@example.com'));
        Mail::shouldReceive('to')->once()->andReturn($pending);

        $player = $this->player('82', [
            'name' => 'Original',
            'password' => 'unique-pass-1',
            'contact_email' => 'old.player@example.com',
        ]);
        $player->forceFill(['password_is_shared' => false])->save();

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Renamed',
            'contact_email' => 'new.player@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertOk()
            ->assertJsonPath('user.contact_email', 'new.player@example.com');

        $player->refresh();
        $this->assertSame('new.player@example.com', $player->contact_email);
        $this->assertSame('Renamed', $player->name);
        $this->assertSame(1, ContactEmailChange::query()->count());

        $lines = implode("\n", $logged);
        $this->assertStringContainsString('The recovery-email change notice could not be sent.', $lines);
        $this->assertStringNotContainsString('old.player@example.com', $lines);
        $this->assertStringNotContainsString('new.player@example.com', $lines);
        $this->assertStringNotContainsString('http', $lines);
        $this->assertStringNotContainsString('token', strtolower($lines));
    }

    public function test_other_profile_fields_update_without_a_recovery_email_change(): void
    {
        Mail::fake();

        $player = $this->player('82', [
            'name' => 'Original',
            'password' => 'unique-pass-1',
            'contact_email' => 'keep@example.com',
        ]);
        $player->forceFill(['password_is_shared' => false])->save();

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Renamed',
            'phone' => '0123999888',
            'position' => 'GK',
        ])->assertOk();

        $player->refresh();
        $this->assertSame('Renamed', $player->name);
        $this->assertSame('0123999888', $player->phone);
        $this->assertSame('GK', $player->position);
        $this->assertSame('keep@example.com', $player->contact_email);
        $this->assertSame(0, ContactEmailChange::query()->count());
        Mail::assertNothingSent();

        $admin = $this->admin();
        $this->actingAs($admin, 'sanctum')->putJson("/api/community/admin/players/{$player->id}/stats", [
            'contact_email' => 'attacker@example.com',
            'position' => 'ST',
        ])->assertOk();

        $this->assertSame('keep@example.com', $player->fresh()->contact_email);

        $this->postJson('/api/community/register', [
            'name' => 'Brand New',
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
            'contact_email' => 'attacker@example.com',
        ])->assertCreated();

        $created = User::query()->where('name', 'Brand New')->first();
        $this->assertNotNull($created);
        $this->assertNull($created->contact_email);
    }

    public function test_clear_untrusted_contact_emails_prints_counts_and_keeps_admin_imports(): void
    {
        $playerSet = $this->player('82', ['contact_email' => 'player.set@example.com']);
        $playerSet->forceFill(['contact_email_source' => 'player'])->save();
        $unknown = $this->player('83', ['contact_email' => 'unknown.set@example.com']);
        $adminSet = $this->player('84', ['contact_email' => 'admin.set@example.com']);
        $adminSet->forceFill(['contact_email_source' => 'admin'])->save();

        $this->artisan('players:clear-untrusted-contact-emails')
            ->expectsOutputToContain('Set by an admin process: 1')
            ->expectsOutputToContain('Set by the player: 1')
            ->expectsOutputToContain('Set before this deploy: 1')
            ->doesntExpectOutputToContain('@')
            ->assertSuccessful();

        $this->assertSame('player.set@example.com', $playerSet->fresh()->contact_email);

        $this->artisan('players:clear-untrusted-contact-emails', ['--force' => true])
            ->expectsOutputToContain('Cleared 1')
            ->doesntExpectOutputToContain('@')
            ->assertSuccessful();

        $this->assertSame('player.set@example.com', $playerSet->fresh()->contact_email);
        $this->assertNull($unknown->fresh()->contact_email);
        $this->assertSame('admin.set@example.com', $adminSet->fresh()->contact_email);
    }

    public function test_contact_email_stays_locked_until_the_shared_password_variable_is_set(): void
    {
        $shared = $this->sharedPassword();
        $unique = $this->player('82', [
            'name' => 'Original',
            'password' => 'unique-pass-1',
        ]);
        $unique->forceFill([
            'password_is_shared' => false,
            'password_is_shared_verified' => true,
        ])->save();

        config(['nuvra.shared_player_password' => null]);

        $this->actingAs($unique, 'sanctum')
            ->getJson('/api/community/profile')
            ->assertOk()
            ->assertJsonPath('user.contact_email_locked', true);

        $this->actingAs($unique, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Renamed',
            'phone' => '0123000111',
        ])->assertOk();

        $unique->refresh();
        $this->assertSame('Renamed', $unique->name);
        $this->assertSame('0123000111', $unique->phone);

        $this->actingAs($unique, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken',
            'contact_email' => 'attacker@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertForbidden()
            ->assertJsonPath('message', AuthMessages::CONTACT_EMAIL_LOCKED);

        $unique->refresh();
        $this->assertSame('Renamed', $unique->name);
        $this->assertNull($unique->contact_email);

        config(['nuvra.shared_player_password' => $shared]);

        $onShared = $this->player('83', ['name' => 'Shared']);
        config(['nuvra.shared_player_password' => null]);

        $this->postJson('/api/community/login', [
            'vellar_id' => '83',
            'password' => $shared,
        ])->assertOk();

        $onShared->refresh();
        $this->assertNull($onShared->sharedPasswordState());

        $onShared->forceFill([
            'password_is_shared' => false,
            'password_is_shared_verified' => null,
        ])->save();

        config(['nuvra.shared_player_password' => $shared]);

        $this->actingAs($onShared, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken',
            'contact_email' => 'attacker@example.com',
            'current_password' => $shared,
        ])->assertForbidden();

        $onShared->refresh();
        $this->assertSame('Shared', $onShared->name);
        $this->assertNull($onShared->contact_email);
        $this->assertTrue($onShared->sharedPasswordState());
        $this->assertTrue(\App\Support\SharedPassword::checkIsVerified($onShared));
    }

    public function test_repair_command_refuses_to_run_when_the_shared_password_variable_is_unset(): void
    {
        $shared = $this->sharedPassword();
        $player = $this->player('82', ['contact_email' => 'bypass.window@example.com']);
        $player->forceFill([
            'password_is_shared' => false,
            'password_is_shared_verified' => null,
            'contact_email_source' => 'player',
        ])->save();
        $this->recoveryEmailChange($player, '2026-01-01 00:00:00');

        config(['nuvra.shared_player_password' => null]);

        try {
            $this->artisan('players:repair-unset-shared-password', ['--force' => true])
                ->expectsOutputToContain('NUVRA_SHARED_DEFAULT_PASSWORD is unset')
                ->doesntExpectOutputToContain('@')
                ->doesntExpectOutputToContain($shared)
                ->assertFailed();
        } finally {
            config(['nuvra.shared_player_password' => $shared]);
        }

        $player->refresh();
        $this->assertFalse($player->sharedPasswordState());
        $this->assertSame('bypass.window@example.com', $player->contact_email);
        $this->assertSame('player', $player->contact_email_source);
    }

    public function test_repair_command_stops_when_no_player_still_uses_the_shared_password(): void
    {
        $player = $this->player('82', [
            'password' => 'unique-pass-1',
            'contact_email' => 'own.password@example.com',
        ]);
        $player->forceFill([
            'password_is_shared' => false,
            'password_is_shared_verified' => true,
            'contact_email_source' => 'player',
        ])->save();
        $this->recoveryEmailChange($player, '2026-01-01 00:00:00');

        $this->artisan('players:repair-unset-shared-password', ['--force' => true])
            ->expectsOutputToContain('Players still on the shared default password: 0')
            ->expectsOutputToContain('Nothing was changed.')
            ->doesntExpectOutputToContain('@')
            ->assertFailed();

        $player->refresh();
        $this->assertFalse($player->sharedPasswordState());
        $this->assertTrue(\App\Support\SharedPassword::checkIsVerified($player));
        $this->assertSame('own.password@example.com', $player->contact_email);
    }

    public function test_repair_command_resets_stale_flags_and_clears_only_the_unset_window(): void
    {
        $shared = $this->sharedPassword();

        $stale = $this->player('82', ['contact_email' => 'stale.flag@example.com']);
        $stale->forceFill([
            'password_is_shared' => false,
            'password_is_shared_verified' => null,
            'contact_email_source' => 'player',
        ])->save();
        $this->recoveryEmailChange($stale, '2026-01-01 00:00:00');

        $later = $this->player('83', [
            'password' => 'unique-pass-1',
            'contact_email' => 'after.window@example.com',
        ]);
        $later->forceFill([
            'password_is_shared' => false,
            'password_is_shared_verified' => true,
            'contact_email_source' => 'player',
        ])->save();
        $this->recoveryEmailChange($later, '2026-01-03 00:00:00');

        $inWindow = $this->player('84', [
            'password' => 'unique-pass-2',
            'contact_email' => 'inside.window@example.com',
        ]);
        $inWindow->forceFill([
            'password_is_shared' => false,
            'password_is_shared_verified' => true,
            'contact_email_source' => 'player',
        ])->save();
        $this->recoveryEmailChange($inWindow, '2026-01-01 12:00:00');

        $admin = $this->admin();
        $admin->forceFill([
            'password' => $shared,
            'password_is_shared' => false,
            'password_is_shared_verified' => null,
        ])->save();

        $options = ['--before' => '2026-01-02 00:00:00'];

        $this->artisan('players:repair-unset-shared-password', $options)
            ->expectsOutputToContain('Players still on the shared default password: 1')
            ->expectsOutputToContain('Shared-password flags to reset: 1')
            ->expectsOutputToContain('Recovery emails to clear: 2')
            ->expectsOutputToContain('No accounts were changed.')
            ->doesntExpectOutputToContain('@')
            ->doesntExpectOutputToContain($shared)
            ->assertSuccessful();

        $this->assertFalse($stale->fresh()->sharedPasswordState());
        $this->assertSame('stale.flag@example.com', $stale->fresh()->contact_email);

        $this->artisan('players:repair-unset-shared-password', $options + ['--force' => true])
            ->expectsOutputToContain('Reset 1 shared-password flag(s).')
            ->expectsOutputToContain('Cleared 2 recovery email(s).')
            ->doesntExpectOutputToContain('@')
            ->doesntExpectOutputToContain($shared)
            ->assertSuccessful();

        $stale->refresh();
        $this->assertNull($stale->sharedPasswordState());
        $this->assertFalse(\App\Support\SharedPassword::checkIsVerified($stale));
        $this->assertNull($stale->contact_email);
        $this->assertNull($stale->contact_email_source);

        $later->refresh();
        $this->assertFalse($later->sharedPasswordState());
        $this->assertTrue(\App\Support\SharedPassword::checkIsVerified($later));
        $this->assertSame('after.window@example.com', $later->contact_email);
        $this->assertSame('player', $later->contact_email_source);

        $inWindow->refresh();
        $this->assertFalse($inWindow->sharedPasswordState());
        $this->assertTrue(\App\Support\SharedPassword::checkIsVerified($inWindow));
        $this->assertNull($inWindow->contact_email);
        $this->assertNull($inWindow->contact_email_source);

        $admin->refresh();
        $this->assertFalse($admin->sharedPasswordState());
        $this->assertTrue(Hash::check($shared, $admin->password));
    }

    public function test_contact_email_changes_are_capped_at_five_a_day(): void
    {
        Cache::flush();

        $admin = $this->admin();
        $admin->forceFill(['email' => 'Desk@Example.com'])->save();

        $player = $this->player('82', [
            'name' => 'Original',
            'password' => 'unique-pass-1',
        ]);
        $player->forceFill([
            'password_is_shared' => false,
            'password_is_shared_verified' => true,
        ])->save();

        for ($attempt = 0; $attempt < 4; $attempt++) {
            $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
                'name' => 'Original',
                'contact_email' => 'vellar82@vellarleague.com',
                'current_password' => 'unique-pass-1',
            ])->assertStatus(422)
                ->assertJsonPath('message', AuthMessages::CONTACT_EMAIL_REJECTED);
        }

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Original',
            'contact_email' => 'first.change@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertOk();

        $this->assertSame('first.change@example.com', $player->fresh()->contact_email);

        $taken = $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Original',
            'contact_email' => 'Desk@Example.com',
            'current_password' => 'unique-pass-1',
        ]);
        $free = $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Original',
            'contact_email' => 'second.change@example.com',
            'current_password' => 'unique-pass-1',
        ]);

        $taken->assertStatus(422);
        $this->assertSame($taken->status(), $free->status());
        $this->assertSame($taken->getContent(), $free->getContent());
        $this->assertSame(AuthMessages::CONTACT_EMAIL_REJECTED, $taken->json('message'));
        $this->assertStringNotContainsString('Desk@Example.com', $taken->getContent());
        $this->assertStringNotContainsString('desk@example.com', strtolower($taken->getContent()));
        $this->assertStringNotContainsString('second.change@example.com', $free->getContent());
        $this->assertSame('first.change@example.com', $player->fresh()->contact_email);

        Cache::flush();
    }

    public function test_player_cannot_read_or_mark_another_players_notification(): void
    {
        $owner = $this->player('82');
        $other = $this->player('83');
        $id = (string) Str::uuid();

        DB::table('notifications')->insert([
            'id' => $id,
            'type' => 'App\\Notifications\\BookingStatusUpdated',
            'notifiable_type' => User::class,
            'notifiable_id' => $other->id,
            'data' => json_encode(['message' => 'private booking']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/community/notifications')
            ->assertOk()
            ->assertJson(['notifications' => [], 'unread_count' => 0]);

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/community/notifications/{$id}/read")
            ->assertStatus(403);

        $this->assertNull(DB::table('notifications')->where('id', $id)->value('read_at'));
    }

    public function test_player_cannot_open_admin_payment_analytics_or_pending_players(): void
    {
        $player = $this->player('82', ['phone' => '0123456789']);
        $admin = $this->admin();

        $this->actingAs($player, 'sanctum')
            ->getJson('/api/community/analytics')
            ->assertStatus(403);

        $this->actingAs($player, 'sanctum')
            ->getJson('/api/community/admin/pending-players')
            ->assertStatus(403);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/community/analytics')
            ->assertOk()
            ->assertJsonStructure(['stats']);
    }

    public function test_player_cannot_change_match_scores_or_another_players_performances(): void
    {
        $player = $this->player('82');
        $admin = $this->admin();
        $match = $this->matchFor($admin);

        $this->actingAs($player, 'sanctum')
            ->patchJson("/api/community/matches/{$match->id}/score", [
                'home_score' => 9,
                'away_score' => 0,
            ])->assertStatus(403);

        $this->assertNull($match->fresh()->home_score);

        $this->actingAs($player, 'sanctum')
            ->deleteJson("/api/community/matches/{$match->id}")
            ->assertStatus(403);

        $this->actingAs($player, 'sanctum')
            ->postJson("/api/community/matches/{$match->id}/performances", [
                'performances' => [[
                    'user_id' => $admin->id,
                    'goals' => 5,
                    'assists' => 1,
                    'rating' => 9,
                    'cleansheet' => false,
                    'minutes_played' => 90,
                ]],
            ])->assertStatus(403);

        $this->assertDatabaseCount('performances', 0);
    }

    public function test_legacy_forgot_password_does_not_reveal_accounts_or_mail_placeholders(): void
    {
        Notification::fake();
        $this->player('82');
        $real = User::factory()->create([
            'email' => 'real-person@example.com',
            'role' => 'player',
            'status' => 'active',
            'password' => 'unique-pass-1',
        ]);

        $placeholder = $this->postJson('/api/forgot-password', [
            'email' => 'vellar82@vellarleague.com',
        ]);
        $this->travel(2)->seconds();
        $missing = $this->postJson('/api/forgot-password', [
            'email' => 'nobody@example.com',
        ]);

        $placeholder->assertOk();
        $missing->assertOk();
        $this->assertSame(AuthMessages::FORGOT_GENERIC, $placeholder->json('message'));
        $this->assertSame($placeholder->json('message'), $missing->json('message'));
        Notification::assertNothingSent();

        $this->travel(2)->seconds();

        $this->postJson('/api/forgot-password', [
            'email' => 'real-person@example.com',
        ])->assertOk();

        Notification::assertSentTo($real, ResetPassword::class);
    }

    public function test_check_status_is_rate_limited(): void
    {
        config([
            'nuvra.backoff.check_status.free' => 1,
            'nuvra.backoff.check_status.base' => 30,
            'nuvra.backoff.check_status.cap' => 30,
        ]);

        $this->postJson('/api/community/check-status', ['vellar_id' => '82'])->assertOk();
        $this->postJson('/api/community/check-status', ['vellar_id' => '83'])->assertOk();
        $this->postJson('/api/community/check-status', ['vellar_id' => '84'])->assertStatus(429);
    }

    public function test_check_status_does_not_reveal_whether_an_id_exists(): void
    {
        $player = $this->player('82', ['name' => 'Hidden Name', 'status' => 'pending']);
        $token = 'registration-status-token';
        $player->forceFill(['status_token' => hash('sha256', $token)])->save();

        $known = $this->postJson('/api/community/check-status', ['vellar_id' => '82']);
        $this->travel(2)->seconds();
        $missing = $this->getJson('/api/community/check-status?vellar_id=999999');

        $known->assertOk();
        $missing->assertOk();
        $this->assertSame(AuthMessages::STATUS_PRIVATE, $known->json('message'));
        $this->assertSame($known->json(), $missing->json());
        $this->assertArrayNotHasKey('name', $known->json());

        $this->travel(2)->seconds();
        $this->postJson('/api/community/check-status', [
            'vellar_id' => '82',
            'status_token' => $token,
        ])->assertOk()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('name', 'Hidden Name');
    }

    public function test_email_reset_path_rejects_a_six_digit_code_and_limits_by_ip(): void
    {
        config([
            'nuvra.backoff.password_reset.base' => 60,
            'nuvra.backoff.password_reset.cap' => 60,
            'nuvra.backoff.password_reset.free' => 0,
        ]);

        $player = $this->player('82');
        PlayerVerificationCode::create([
            'user_id' => $player->id,
            'channel' => 'sms',
            'code_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(15),
        ]);

        $this->postJson('/api/community/password/reset', [
            'token' => '123456',
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertStatus(422)->assertJson(['message' => AuthMessages::RESET_FAILED]);

        $this->postJson('/api/community/password/reset', [
            'token' => '654321',
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertStatus(429);

        $this->assertNull(PlayerVerificationCode::query()->value('consumed_at'));

        $this->travel(61)->seconds();

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => '123456',
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertOk();
    }

    public function test_reset_request_names_the_configured_activation_contact_only(): void
    {
        $this->player('82', ['contact_email' => 'player@example.com']);
        Mail::fake();

        $plain = $this->postJson('/api/community/password/request', ['vellar_id' => '82']);
        $plain->assertOk()->assertJson(['message' => AuthMessages::RESET_SENT]);
        $this->assertStringNotContainsString('Contact:', $plain->getContent());

        config(['nuvra.activation_contact' => 'League desk']);
        $this->travel(2)->seconds();

        $this->postJson('/api/community/password/request', ['vellar_id' => '82'])
            ->assertOk()
            ->assertJson(['message' => AuthMessages::RESET_SENT.' Contact: League desk']);
    }

    public function test_spoofed_forwarded_for_from_an_untrusted_address_is_ignored(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.8'])
            ->withHeader('X-Forwarded-For', '198.51.100.9')
            ->withHeader('CF-Connecting-IP', '198.51.100.9')
            ->get('/up')
            ->assertOk();

        $this->assertSame('203.0.113.8', request()->ip());

        $this->withServerVariables(['REMOTE_ADDR' => '104.16.1.1'])
            ->withHeader('X-Forwarded-For', '198.51.100.9')
            ->withHeader('CF-Connecting-IP', '198.51.100.20')
            ->get('/up')
            ->assertOk();

        $this->assertSame('198.51.100.20', request()->ip());
    }

    public function test_unset_shared_password_does_not_match_and_does_not_write(): void
    {
        $player = $this->player('82', ['password' => 'unique-pass-1']);
        $before = $player->password;

        config(['nuvra.shared_player_password' => null]);

        $this->assertFalse(\App\Support\SharedPassword::same('unique-pass-1'));
        $this->artisan('players:retire-default-passwords')
            ->expectsOutputToContain('NUVRA_SHARED_DEFAULT_PASSWORD is unset')
            ->assertFailed();
        $this->artisan('players:retire-default-passwords', ['--force' => true])
            ->expectsOutputToContain('NUVRA_SHARED_DEFAULT_PASSWORD is unset')
            ->assertFailed();
        $this->assertSame($before, $player->fresh()->password);
        $this->assertFalse($player->fresh()->password_reset_required);

        $count = \App\Models\User::query()->count();

        try {
            app(\App\Support\TestPlayers::class)->create(['you@example.com'], null, 'qa_cli');
            $this->fail('A test player was created without NUVRA_SHARED_DEFAULT_PASSWORD.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('NUVRA_SHARED_DEFAULT_PASSWORD', $e->getMessage());
        }

        $this->assertSame($count, \App\Models\User::query()->count());
    }

    public function test_invalid_password_configuration_fails_closed(): void
    {
        $logged = [];
        Log::listen(function ($event) use (&$logged) {
            $logged[] = $event->level.':'.$event->message;
        });

        $player = $this->player('82', ['password' => 'unique-pass-1']);
        $admin = $this->admin();
        $before = $player->password;

        $this->artisan('players:contact-audit')
            ->expectsOutputToContain('Players on a known weak password:')
            ->doesntExpectOutputToContain('not checked')
            ->assertSuccessful();

        config([
            'nuvra.shared_player_password' => null,
            'nuvra.retire_shared_passwords' => true,
            'nuvra.weak_passwords' => [],
            'nuvra.weak_passwords_set' => false,
            'nuvra.force_admin_password_change' => true,
        ]);

        $this->artisan('players:retire-default-passwords')
            ->expectsOutputToContain('setup is invalid')
            ->assertFailed();
        $this->artisan('players:retire-default-passwords', ['--force' => true])->assertFailed();
        $this->assertSame($before, $player->fresh()->password);
        $this->assertNull($player->fresh()->sharedPasswordState());

        $login = $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'unique-pass-1',
        ])->assertStatus(503);
        $this->assertSame(AuthMessages::PASSWORD_CHECKS_UNCONFIGURED, $login->json('message'));
        $this->assertArrayNotHasKey('token', $login->json());
        $this->assertNull($player->fresh()->sharedPasswordState());

        $adminLogin = $this->postJson('/api/community/login', [
            'vellar_id' => $admin->email,
            'password' => 'admin-unique-pass',
        ])->assertStatus(503);
        $this->assertArrayNotHasKey('token', $adminLogin->json());

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $token = $player->createToken('session')->plainTextToken;
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/community/me')
            ->assertStatus(503)
            ->assertJsonPath('message', AuthMessages::PASSWORD_CHECKS_UNCONFIGURED);

        $adminToken = $admin->createToken('session')->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/community/analytics')
            ->assertStatus(503);

        $this->artisan('players:contact-audit')
            ->expectsOutputToContain('Players still on the shared default password: not checked')
            ->expectsOutputToContain('Players on a known weak password: not checked')
            ->expectsOutputToContain('Admin accounts on a known weak password: not checked')
            ->assertFailed();

        $this->assertTrue(collect($logged)->contains(fn ($line) => str_contains($line, 'error:') && str_contains($line, 'NUVRA_SHARED_DEFAULT_PASSWORD')));
        $this->assertTrue(collect($logged)->contains(fn ($line) => str_contains($line, 'error:') && str_contains($line, 'NUVRA_WEAK_PASSWORDS')));
    }

    public function test_password_rules_reject_the_configured_shared_default(): void
    {
        config([
            'nuvra.force_admin_password_change' => true,
            'nuvra.shared_player_password' => 'Correct-Horse-9',
        ]);

        $this->postJson('/api/community/register', [
            'name' => 'New Player',
            'password' => 'Correct-Horse-9',
            'password_confirmation' => 'Correct-Horse-9',
        ])->assertStatus(422);

        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'role' => 'admin',
            'status' => 'active',
            'password' => $this->weakPassword(),
        ]);

        $forced = $this->postJson('/api/community/login', [
            'vellar_id' => 'admin@example.com',
            'password' => $this->weakPassword(),
        ])->assertOk();

        $this->withToken($forced->json('token'))
            ->postJson('/api/community/admin/password', [
                'current_password' => $this->weakPassword(),
                'password' => 'Correct-Horse-9',
                'password_confirmation' => 'Correct-Horse-9',
            ])->assertStatus(422);

        $this->assertTrue(Hash::check($this->weakPassword(), $admin->fresh()->password));
    }

    private function recoveryEmailChange(User $player, string $at): void
    {
        $change = ContactEmailChange::query()->create([
            'player_id' => $player->id,
            'old_email_masked' => '(none)',
            'new_email_masked' => 'a***@example.com',
            'ip_address' => '127.0.0.1',
        ]);
        $change->forceFill(['created_at' => $at])->save();
    }

    private function player(string $number, array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'name' => 'Player '.$number,
            'email' => 'vellar'.$number.'@vellarleague.com',
            'vellar_id' => 'VELLAR '.$number,
            'role' => 'player',
            'status' => 'active',
            'password' => $this->sharedPassword(),
            'phone' => null,
        ], $overrides));
    }

    private function admin(): User
    {
        return User::factory()->create([
            'name' => 'League Admin',
            'email' => 'admin-'.Str::random(6).'@example.com',
            'role' => 'admin',
            'status' => 'active',
            'password' => 'admin-unique-pass',
        ]);
    }

    private function matchFor(User $organizer): FootballMatch
    {
        $tournament = Tournament::create([
            'organizer_id' => $organizer->id,
            'name' => 'Security Cup',
            'format' => 'league',
            'venue' => 'Test Arena',
        ]);

        return FootballMatch::create([
            'tournament_id' => $tournament->id,
            'organizer_id' => $organizer->id,
            'gameweek' => 'Matchweek 1',
            'home_team_name' => 'Team A',
            'away_team_name' => 'Team B',
            'match_date' => now()->toDateString(),
            'match_time' => '20:00:00',
            'venue' => 'Test Arena',
            'status' => 'scheduled',
        ]);
    }
}

class RecordingSmsSender implements SmsSender
{
    public array $messages = [];

    public function enabled(): bool
    {
        return true;
    }

    public function send(string $phoneDigits, string $message): void
    {
        $this->messages[] = ['to' => $phoneDigits, 'message' => $message];
    }
}
