<?php

namespace Tests\Feature;

use App\Mail\PlayerPasswordResetLink;
use App\Mail\RegistrationApproved;
use App\Mail\RegistrationAttemptNotice;
use App\Mail\RegistrationConfirmation;
use App\Mail\RegistrationRejected;
use App\Models\PlayerRegistrationAudit;
use App\Models\PlayerVerificationCode;
use App\Models\User;
use App\Support\AuthMessages;
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
        $this->assertStringNotContainsString('vellar', strtolower($response->getContent()));

        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $this->assertNotNull($player);
        $this->assertSame('player', $player->contact_email_source);
        $this->assertSame('pending', $player->status);
        $this->assertNull($player->email_verified_at);
        $this->assertSame('player', $player->role);
        $this->assertMatchesRegularExpression('/\Avellar\d+@vellarleague\.com\z/', $player->email);
        $this->assertNotSame('player@example.com', $player->email);
        $this->assertNotNull($player->email_confirm_token_hash);
        $this->assertNotSame($this->confirmToken(), $player->email_confirm_token_hash);

        Mail::assertSent(RegistrationConfirmation::class, function (RegistrationConfirmation $mail) {
            return $mail->hasTo('player@example.com')
                && str_starts_with($mail->confirmUrl, 'https://uat.nuvrasports.com/email/confirm/')
                && str_starts_with($mail->statusUrl, 'https://uat.nuvrasports.com/waiting-room#t=')
                && ! str_contains($mail->render(), 'New Player');
        });
    }

    public function test_confirmation_link_works_once_and_expires_after_24_hours(): void
    {
        Mail::fake();
        $this->postSignup('player@example.com');
        $token = $this->confirmToken();

        $this->postJson('/api/community/email/confirm', ['token' => $token])
            ->assertOk()
            ->assertExactJson(['status' => 'pending_approval']);

        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $this->assertNotNull($player->email_verified_at);
        $this->assertNull($player->email_confirm_token_hash);

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
        $this->assertNull(User::query()->where('contact_email', 'later@example.com')->value('email_verified_at'));
    }

    public function test_unconfirmed_players_cannot_be_approved_sign_in_or_reset(): void
    {
        Mail::fake();
        $this->postSignup('player@example.com');
        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $admin = $this->admin();
        $number = preg_replace('/\D/', '', (string) $player->vellar_id);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertStatus(422)
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

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/community/admin/approve-player/'.$player->id)
            ->assertOk()
            ->assertJsonMissing(['vellar_id']);

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
        $player = User::query()->where('contact_email', 'player@example.com')->first();
        $admin = $this->admin();
        $statusToken = $this->statusToken();

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

    public function test_a_duplicate_email_gets_the_same_reply_and_creates_nothing(): void
    {
        Mail::fake();

        $first = $this->postSignup('player@example.com', 'First Player');
        $second = $this->postSignup('Player@Example.com', 'Second Player');

        $this->assertSame($first->status(), $second->status());
        $this->assertSame($first->getContent(), $second->getContent());
        $this->assertSame(1, User::query()->where('contact_email', 'player@example.com')->count());
        $this->assertNull(User::query()->where('name', 'Second Player')->first());
        Mail::assertSent(RegistrationConfirmation::class, 1);
        Mail::assertSent(RegistrationAttemptNotice::class, function (RegistrationAttemptNotice $mail) {
            return $mail->hasTo('player@example.com')
                && ! str_contains($mail->render(), 'Second Player')
                && str_starts_with($mail->loginUrl, 'https://uat.nuvrasports.com/');
        });
    }

    public function test_register_and_resend_are_rate_limited_with_the_same_reply(): void
    {
        Mail::fake();
        config([
            'nuvra.registration_limits.register.ip.max' => 1,
            'nuvra.registration_limits.register.email.max' => 5,
            'nuvra.registration_limits.register.daily_ip.max' => 5,
            'nuvra.registration_limits.register.daily_email.max' => 5,
            'nuvra.registration_limits.register.daily.max' => 5,
        ]);

        $allowed = $this->postSignup('one@example.com');
        $limited = $this->postSignup('two@example.com');

        $this->assertSame($allowed->getContent(), $limited->getContent());
        $this->assertSame($allowed->status(), $limited->status());
        $this->assertNull(User::query()->where('contact_email', 'two@example.com')->first());
        Mail::assertSent(RegistrationConfirmation::class, 1);

        config([
            'nuvra.registration_limits.resend.ip.max' => 5,
            'nuvra.registration_limits.resend.email.max' => 1,
            'nuvra.registration_limits.resend.daily_ip.max' => 5,
            'nuvra.registration_limits.resend.daily_email.max' => 1,
            'nuvra.registration_limits.resend.daily.max' => 1,
        ]);

        $firstResend = $this->postJson('/api/community/register/resend', ['email' => 'one@example.com']);
        $secondResend = $this->postJson('/api/community/register/resend', ['email' => 'one@example.com']);
        $firstResend->assertOk()->assertExactJson(['message' => AuthMessages::RESEND_GENERIC]);
        $this->assertSame($firstResend->getContent(), $secondResend->getContent());
        Mail::assertSent(RegistrationConfirmation::class, 2);

        $sent = Mail::sent(RegistrationConfirmation::class);
        $old = $this->tokenFrom($sent[0]->confirmUrl, '#/email/confirm/([0-9a-f]{64})#');
        $new = $this->tokenFrom($sent[1]->confirmUrl, '#/email/confirm/([0-9a-f]{64})#');

        $this->postJson('/api/community/email/confirm', ['token' => $old])
            ->assertExactJson(['status' => 'rejected_or_expired']);
        $this->postJson('/api/community/email/confirm', ['token' => $new])
            ->assertExactJson(['status' => 'pending_approval']);
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
        $player = User::query()->where('contact_email', 'player@example.com')->first();

        $pending = $this->postJson('/api/community/check-status', [
            'status_token' => $token,
            'vellar_id' => $player->vellar_id,
            'email' => 'player@example.com',
        ])->assertOk();
        $this->assertSame(['status' => 'pending_confirmation'], $pending->json());
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
        $this->assertSame('player@example.com', $player->contact_email);
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
        $this->assertCount(4, $rows->pluck('contact_email')->unique());

        foreach (glob($path.'*') ?: [] as $file) {
            @unlink($file);
        }
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
    }

    private function postSignup(string $email, string $name = 'New Player'): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/community/register', [
            'name' => $name,
            'email' => $email,
            'password' => $this->signupPassword(),
            'password_confirmation' => $this->signupPassword(),
        ]);
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
            $found = $this->tokenFrom($mail->confirmUrl, '#/email/confirm/([0-9a-f]{64})#');

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
        $user = User::factory()->create(array_merge([
            'name' => 'Player '.$number,
            'email' => 'vellar'.$number.'@vellarleague.com',
            'vellar_id' => 'VELLAR '.$number,
            'role' => 'player',
            'status' => 'pending',
            'contact_email' => $email,
            'email_verified_at' => null,
        ], $overrides));
        $source = array_key_exists('contact_email_source', $overrides)
            ? $overrides['contact_email_source']
            : 'player';
        $user->forceFill([
            'contact_email_source' => $source,
            'created_at' => $createdAt,
        ])->save();

        return $user->fresh();
    }
}
