<?php

namespace Tests\Feature;

use App\Mail\PlayerPasswordResetLink;
use App\Models\PlayerCodeAudit;
use App\Models\PlayerVerificationCode;
use App\Models\User;
use App\Support\AuthMessages;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AcceptanceCriteriaTest extends TestCase
{
    use RefreshDatabase;

    public function test_codes_expire_in_fifteen_minutes_are_hashed_and_a_new_code_replaces_older_ones(): void
    {
        $player = $this->player('82');
        $admin = $this->admin();

        $first = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/community/admin/players/{$player->id}/activation-code")
            ->assertOk();

        $firstCode = $first->json('activation_code');
        $stored = PlayerVerificationCode::query()->first();
        $this->assertNotNull($stored);
        $this->assertSame(64, strlen($stored->code_hash));
        $this->assertStringNotContainsString($firstCode, $stored->code_hash);
        $this->assertTrue($stored->expires_at->between(now()->addMinutes(14), now()->addMinutes(16)));

        $this->travel(2)->seconds();

        $second = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/community/admin/players/{$player->id}/activation-code")
            ->assertOk();
        $secondCode = $second->json('activation_code');
        $this->assertNotSame($firstCode, $secondCode);
        $this->assertSame(1, PlayerVerificationCode::query()->whereNull('consumed_at')->count());

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => $firstCode,
            'password' => 'older-code-pass',
            'password_confirmation' => 'older-code-pass',
        ])->assertStatus(422);

        $this->travel(2)->seconds();

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => $secondCode,
            'password' => 'newer-code-pass',
            'password_confirmation' => 'newer-code-pass',
        ])->assertOk();

        $this->travel(2)->seconds();
        $player->forceFill(['contact_email' => 'player@example.com'])->save();
        Mail::fake();
        $admin->tokens()->delete();

        $issued = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/community/admin/players/{$player->id}/activation-code")
            ->assertOk()
            ->json('activation_code');

        $this->travel(2)->seconds();
        $this->postJson('/api/community/password/request', ['vellar_id' => '82'])->assertOk();
        Mail::assertSent(PlayerPasswordResetLink::class);

        $this->travel(2)->seconds();
        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '82',
            'code' => $issued,
            'password' => 'replaced-again-1',
            'password_confirmation' => 'replaced-again-1',
        ])->assertStatus(422);

        $fresh = $this->player('83');
        $adminCode = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/community/admin/players/{$fresh->id}/activation-code")
            ->assertOk()
            ->json('activation_code');

        $this->travel(16)->minutes();

        $this->postJson('/api/community/password/reset', [
            'vellar_id' => '83',
            'code' => $adminCode,
            'password' => 'too-late-pass',
            'password_confirmation' => 'too-late-pass',
        ])->assertStatus(422)->assertJson(['message' => AuthMessages::RESET_FAILED]);
    }

    public function test_reset_mail_is_limited_per_destination_without_changing_the_response(): void
    {
        Mail::fake();
        config([
            'nuvra.backoff.password_request.base' => 1,
            'nuvra.backoff.password_request.cap' => 1,
            'nuvra.backoff.reset_destination.base' => 300,
            'nuvra.backoff.reset_destination.cap' => 300,
        ]);

        $player = $this->player('82');
        $player->forceFill(['contact_email' => 'player@example.com'])->save();

        $known = $this->postJson('/api/community/password/request', ['vellar_id' => '82']);
        $this->travel(2)->seconds();
        $again = $this->postJson('/api/community/password/request', ['vellar_id' => '82']);
        $this->travel(2)->seconds();
        $unknown = $this->postJson('/api/community/password/request', ['vellar_id' => '40404']);

        $known->assertOk();
        $again->assertOk();
        $unknown->assertOk();
        $this->assertSame($known->json('message'), $again->json('message'));
        $this->assertSame($known->json('message'), $unknown->json('message'));
        $this->assertStringNotContainsString('player@example.com', $known->getContent());
        $this->assertStringNotContainsString('player@example.com', $unknown->getContent());
        Mail::assertSent(PlayerPasswordResetLink::class, 1);
    }

    public function test_retirement_flag_forces_shared_password_accounts_to_reset(): void
    {
        $player = $this->player('82');
        $token = $player->createToken('session')->plainTextToken;
        $remember = $player->remember_token;

        config(['nuvra.retire_shared_passwords' => false]);
        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'password',
        ])->assertOk();

        config(['nuvra.retire_shared_passwords' => true]);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/community/me')
            ->assertStatus(401)
            ->assertJson(['message' => AuthMessages::RESET_REQUIRED]);

        $this->assertNotSame($remember, $player->fresh()->remember_token);
        $this->assertTrue($player->fresh()->password_reset_required);

        $this->travel(2)->seconds();
        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => 'password',
        ])->assertStatus(401)->assertJson(['message' => AuthMessages::LOGIN_FAILED]);
    }

    public function test_admin_activation_is_audited_and_does_not_reveal_the_password(): void
    {
        $player = $this->player('82', ['password' => 'unique-pass-1']);
        $admin = $this->admin();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/community/admin/players/{$player->id}/activation-code")
            ->assertOk();

        $this->assertArrayNotHasKey('password', $response->json());
        $this->assertTrue(Hash::check('unique-pass-1', $player->fresh()->password));

        $audit = PlayerCodeAudit::query()->first();
        $this->assertNotNull($audit);
        $this->assertSame($admin->id, $audit->admin_id);
        $this->assertSame($player->id, $audit->player_id);
        $this->assertSame('admin_api', $audit->source);
        $this->assertNotNull($audit->issued_at);
        $this->assertStringNotContainsString((string) $response->json('activation_code'), json_encode($audit->toArray()));
    }

    public function test_test_player_commands_create_and_delete_only_flagged_accounts(): void
    {
        Mail::fake();
        $real = $this->player('82');

        $this->artisan('nuvra:create-test-players', [
            'contacts' => ['you@example.com'],
        ])->assertSuccessful();

        $tests = User::query()->where('is_test_account', true)->orderBy('id')->get();
        $this->assertCount(1, $tests);
        $this->assertSame('you@example.com', $tests[0]->contact_email);
        $this->assertNull($tests[0]->phone);
        $this->assertSame('NUVRA TEST PLAYER 900001', $tests[0]->name);
        $this->assertTrue(Hash::check('password', $tests[0]->password));
        Mail::assertNothingSent();

        $this->postJson('/api/community/login', [
            'vellar_id' => '900001',
            'password' => 'password',
        ])->assertOk();

        $this->artisan('nuvra:delete-test-players')->assertSuccessful();

        $this->assertSame(0, User::query()->where('is_test_account', true)->count());
        $this->assertNotNull($real->fresh());
        Mail::assertNothingSent();
    }

    public function test_admin_on_a_weak_password_can_still_sign_in_while_the_force_flag_is_off(): void
    {
        config([
            'nuvra.retire_shared_passwords' => false,
            'nuvra.force_admin_password_change' => false,
        ]);

        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'role' => 'admin',
            'status' => 'active',
            'password' => 'password',
        ]);

        $response = $this->postJson('/api/community/login', [
            'vellar_id' => 'admin@example.com',
            'password' => 'password',
        ])->assertOk();

        $this->assertArrayNotHasKey('password_change_required', $response->json());
        $this->withToken($response->json('token'))->getJson('/api/community/analytics')->assertOk();
        $this->assertFalse($admin->fresh()->password_reset_required);
    }

    public function test_admin_on_a_weak_password_must_change_it_before_anything_else(): void
    {
        config([
            'nuvra.retire_shared_passwords' => false,
            'nuvra.force_admin_password_change' => true,
        ]);

        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'role' => 'admin',
            'status' => 'active',
            'password' => 'Nuvra2026!',
        ]);

        $unknown = $this->postJson('/api/community/login', [
            'vellar_id' => 'missing-admin@example.com',
            'password' => 'Nuvra2026!',
        ]);
        $this->travel(2)->seconds();
        $wrong = $this->postJson('/api/community/login', [
            'vellar_id' => 'admin@example.com',
            'password' => 'not-the-password',
        ]);

        $unknown->assertUnauthorized();
        $wrong->assertUnauthorized();
        $this->assertSame(AuthMessages::LOGIN_FAILED, $unknown->json('message'));
        $this->assertSame($unknown->json('message'), $wrong->json('message'));
        $this->assertArrayNotHasKey('password_change_required', $unknown->json());
        $this->assertArrayNotHasKey('password_change_required', $wrong->json());

        $this->travel(3)->seconds();
        $forced = $this->postJson('/api/community/login', [
            'vellar_id' => 'admin@example.com',
            'password' => 'Nuvra2026!',
        ])->assertOk();
        $forced->assertJsonPath('password_change_required', true);
        $limited = $forced->json('token');

        $this->withToken($limited)
            ->getJson('/api/community/analytics')
            ->assertForbidden()
            ->assertJsonPath('password_change_required', true);

        $this->withToken($limited)
            ->postJson('/api/community/admin/password', [
                'current_password' => 'Nuvra2026!',
                'password' => 'short',
                'password_confirmation' => 'short',
            ])->assertStatus(422);

        $changed = $this->withToken($limited)
            ->postJson('/api/community/admin/password', [
                'current_password' => 'Nuvra2026!',
                'password' => 'Correct-Horse-9',
                'password_confirmation' => 'Correct-Horse-9',
            ])->assertOk();

        $stored = \Laravel\Sanctum\PersonalAccessToken::query()->first();
        $plain = explode('|', (string) $limited, 2)[1] ?? '';
        $this->assertNotNull($stored);
        $this->assertSame('community_token', $stored->name);
        $this->assertFalse(hash_equals($stored->token, hash('sha256', $plain)));

        $this->app['auth']->forgetGuards();
        $this->withToken($limited)->getJson('/api/community/analytics')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($changed->json('token'))->getJson('/api/community/analytics')->assertOk();

        $admin->refresh();
        $this->assertFalse($admin->password_reset_required);
        $this->assertFalse($admin->sharedPasswordState());
        $this->assertTrue(Hash::check('Correct-Horse-9', $admin->password));
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
            'email' => 'admin-'.bin2hex(random_bytes(3)).'@example.com',
            'role' => 'admin',
            'status' => 'active',
            'password' => 'admin-unique-pass',
        ]);
    }
}
