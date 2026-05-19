<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Coach;
use App\Models\Player;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test a user can register successfully.
     */
    public function test_user_can_register_as_player(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test Player',
            'email' => 'test@nuvrasports.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'player'
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'token',
                     'user_id'
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@nuvrasports.com',
            'role' => 'player'
        ]);
    }

    /**
     * Test registration fails with duplicate email.
     */
    public function test_registration_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'duplicate@nuvrasports.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'New Player',
            'email' => 'duplicate@nuvrasports.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test player can submit an onboarding application.
     */
    public function test_player_can_submit_onboarding_application(): void
    {
        // 1. Create a user and a coach/team
        $user = User::factory()->create(['role' => 'player']);
        $coach = Coach::create([
            'name' => 'Coach Carter',
            'email' => 'carter@nuvrasports.com',
            'team_name' => 'Richmond Oilers',
            'password' => bcrypt('password')
        ]);

        // 2. Submit application
        $response = $this->postJson('/api/player/onboarding', [
            'user_id' => $user->id,
            'coach_id' => $coach->id,
            'position' => 'Forward',
            'date_of_birth' => '2010-05-12',
            'jersey_number' => 10
        ]);

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Application submitted successfully!']);

        $this->assertDatabaseHas('players', [
            'user_id' => $user->id,
            'coach_id' => $coach->id,
            'status' => 'pending'
        ]);
    }
}
