<?php

namespace Tests\Feature;

use App\Contracts\SmsSender;
use App\Mail\PlayerPasswordResetLink;
use App\Models\FootballMatch;
use App\Models\Tournament;
use App\Models\User;
use App\Support\AuthMessages;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
            'password' => 'password',
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
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['token']);
    }

    public function test_player_marked_for_reset_cannot_sign_in_even_with_the_right_password(): void
    {
        $player = $this->player('82');
        $player->forceFill(['password_reset_required' => true])->save();

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'password',
        ])->assertStatus(401)->assertJson(['message' => AuthMessages::LOGIN_FAILED]);
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
            'password' => 'password',
            'password_confirmation' => 'password',
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
            'password' => 'password',
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
            'password' => 'password',
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
            'password' => 'password',
            'password_confirmation' => 'password',
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
        $this->assertTrue(Hash::check('password', $shared->fresh()->password));
        Mail::assertNothingSent();

        config(['nuvra.retire_shared_passwords' => false]);
        $this->artisan('players:retire-default-passwords', ['--force' => true])->assertFailed();

        config(['nuvra.retire_shared_passwords' => true]);
        $this->artisan('players:retire-default-passwords', ['--force' => true])->assertFailed();
        $this->assertTrue(Hash::check('password', $shared->fresh()->password));
        $this->assertFalse($shared->fresh()->password_reset_required);

        $this->artisan('players:retire-default-passwords', [
            '--force' => true,
            '--allow-undeliverable' => true,
        ])->assertSuccessful();

        $shared->refresh();
        $unique->refresh();
        $this->assertFalse(Hash::check('password', $shared->password));
        $this->assertTrue($shared->password_reset_required);
        $this->assertTrue(Hash::check('already-unique', $unique->password));
        $this->assertFalse($unique->password_reset_required);
        Mail::assertNothingSent();

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'password',
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
        $this->assertFalse(Hash::check('password', $player->fresh()->password));
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
        ])->assertStatus(422);
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

    private function player(string $number, array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'name' => 'Player '.$number,
            'email' => 'vellar'.$number.'@vellarleague.com',
            'vellar_id' => 'VELLAR '.$number,
            'role' => 'player',
            'status' => 'active',
            'password' => 'password',
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
