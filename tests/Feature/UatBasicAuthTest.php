<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class UatBasicAuthTest extends TestCase
{
    use RefreshDatabase;
    public function test_gate_is_off_when_neither_variable_is_set(): void
    {
        config([
            'nuvra.uat_basic_auth.user' => null,
            'nuvra.uat_basic_auth.password' => null,
        ]);

        $this->get('/up')->assertOk();
        $this->postJson('/api/community/login', [])->assertStatus(422);
    }

    public function test_gate_is_off_when_only_one_variable_is_set(): void
    {
        config([
            'nuvra.uat_basic_auth.user' => 'uat-user',
            'nuvra.uat_basic_auth.password' => '',
        ]);

        $this->postJson('/api/community/login', [])->assertStatus(422);

        config([
            'nuvra.uat_basic_auth.user' => '   ',
            'nuvra.uat_basic_auth.password' => 'uat-secret',
        ]);

        $this->postJson('/api/community/login', [])->assertStatus(422);
    }

    public function test_gate_rejects_missing_and_wrong_credentials_and_accepts_the_right_pair(): void
    {
        config([
            'nuvra.uat_basic_auth.user' => 'uat-user',
            'nuvra.uat_basic_auth.password' => 'uat-secret',
        ]);

        $missing = $this->postJson('/api/community/login', []);
        $missing->assertStatus(401);
        $missing->assertHeader('WWW-Authenticate', 'Basic realm="UAT", charset="UTF-8"');
        $this->assertStringNotContainsString('uat-secret', $missing->getContent());

        $wrong = $this->withServerVariables([
            'PHP_AUTH_USER' => 'uat-user',
            'PHP_AUTH_PW' => 'nope',
        ])->postJson('/api/community/login', []);
        $wrong->assertStatus(401);

        $short = $this->withServerVariables([
            'PHP_AUTH_USER' => 'uat-user',
            'PHP_AUTH_PW' => 'x',
        ])->postJson('/api/community/login', []);
        $short->assertStatus(401);

        $userOnly = $this->withServerVariables([
            'PHP_AUTH_USER' => 'someone-else',
            'PHP_AUTH_PW' => 'uat-secret',
        ])->postJson('/api/community/login', []);
        $userOnly->assertStatus(401);

        $this->withServerVariables([
            'PHP_AUTH_USER' => 'uat-user',
            'PHP_AUTH_PW' => 'uat-secret',
        ])->postJson('/api/community/login', [])->assertStatus(422);
    }

    public function test_failed_gate_does_not_log_the_credentials(): void
    {
        $written = '';
        Log::listen(function ($event) use (&$written) {
            $written .= json_encode([$event->message, $event->context]);
        });

        config([
            'nuvra.uat_basic_auth.user' => 'uat-user',
            'nuvra.uat_basic_auth.password' => 'uat-secret-do-not-log',
        ]);

        $ok = $this->withServerVariables([
            'PHP_AUTH_USER' => 'uat-user',
            'PHP_AUTH_PW' => 'uat-secret-do-not-log',
        ])->postJson('/api/community/login', []);
        $ok->assertStatus(422);
        $this->assertStringNotContainsString('uat-secret-do-not-log', $ok->getContent());

        $rejected = $this->withServerVariables([
            'PHP_AUTH_USER' => 'intruder',
            'PHP_AUTH_PW' => 'guessed-password',
        ])->postJson('/api/community/login', []);
        $rejected->assertStatus(401);
        $this->assertStringNotContainsString('guessed-password', $rejected->getContent());
        $this->assertStringNotContainsString('intruder', $rejected->getContent());

        $this->assertStringNotContainsString('uat-secret-do-not-log', $written);
        $this->assertStringNotContainsString('guessed-password', $written);
        $this->assertStringNotContainsString('intruder', $written);
    }

    public function test_health_check_stays_open_while_the_gate_is_on(): void
    {
        config([
            'nuvra.uat_basic_auth.user' => 'uat-user',
            'nuvra.uat_basic_auth.password' => 'uat-secret',
        ]);

        $this->get('/up')->assertOk();
        $this->get('/')->assertStatus(401);
        $this->postJson('/api/community/login', [])->assertStatus(401);
    }

    public function test_signed_in_api_call_uses_the_gate_cookie_instead_of_basic_auth(): void
    {
        config([
            'nuvra.uat_basic_auth.user' => 'uat-user',
            'nuvra.uat_basic_auth.password' => 'uat-secret',
        ]);

        $player = User::factory()->create([
            'email' => 'vellar900001@vellarleague.com',
            'role' => 'player',
            'status' => 'active',
            'vellar_id' => 'VELLAR 900001',
            'password' => 'unique-pass-1',
        ]);

        $bearer = $player->createToken('community_token')->plainTextToken;

        $this->getJson('/api/community/me', [
            'Authorization' => 'Bearer '.$bearer,
        ])->assertStatus(401);

        $login = $this->withServerVariables([
            'PHP_AUTH_USER' => 'uat-user',
            'PHP_AUTH_PW' => 'uat-secret',
        ])->postJson('/api/community/login', [
            'vellar_id' => '900001',
            'password' => 'unique-pass-1',
        ])->assertOk();

        $token = $login->json('token');
        $gate = $login->getCookie('nuvra_uat_gate', decrypt: false);
        $this->assertNotNull($gate);
        $this->assertTrue($gate->isHttpOnly());
        $this->assertTrue($gate->isSecure());
        $this->assertSame('lax', strtolower((string) $gate->getSameSite()));

        $this->withServerVariables([])->getJson('/api/community/me', [
            'Authorization' => 'Bearer '.$token,
        ])->assertStatus(401);

        $this->withCredentials()
            ->withUnencryptedCookie('nuvra_uat_gate', $gate->getValue())
            ->getJson('/api/community/me', [
                'Authorization' => 'Bearer '.$token,
            ])
            ->assertOk()
            ->assertJsonPath('id', $player->id);
    }
}
