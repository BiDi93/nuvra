<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Player;
use App\Models\Coach;
use App\Models\Attribute;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $player;
    protected $coach;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a Coach and a Team
        $this->coach = Coach::create([
            'name' => 'Coach Carter',
            'email' => 'carter@nuvrasports.com',
            'team_name' => 'Richmond Oilers',
            'password' => bcrypt('password')
        ]);

        // Create a User and a Player profile
        $this->user = User::factory()->create([
            'email' => 'player@nuvrasports.com',
            'password' => bcrypt('password'),
            'role' => 'player'
        ]);

        $this->player = Player::create([
            'user_id' => $this->user->id,
            'coach_id' => $this->coach->id,
            'name' => 'Test Player',
            'email' => 'player@nuvrasports.com',
            'position' => 'Midfielder',
            'status' => 'active'
        ]);
    }

    /**
     * Test player can login and get a token.
     */
    public function test_player_can_login(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'player@nuvrasports.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'role', 'user_id']);
    }

    /**
     * Test player can fetch their own profile.
     */
    public function test_player_can_fetch_own_profile(): void
    {
        $response = $this->actingAs($this->user)
                         ->getJson('/api/player/me');

        $response->assertStatus(200)
                 ->assertJsonPath('profile.name', 'Test Player')
                 ->assertJsonPath('profile.email', 'player@nuvrasports.com');
    }

    /**
     * Test player can update their own name.
     */
    public function test_player_can_update_profile_name(): void
    {
        $response = $this->actingAs($this->user)
                         ->postJson("/api/player/{$this->player->id}/update", [
                             'name' => 'Updated Name'
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('players', [
            'id' => $this->player->id,
            'name' => 'Updated Name'
        ]);
    }

    /**
     * SECURITY TEST: Player should NOT be able to update jersey number (Coach only).
     */
    public function test_player_cannot_update_jersey_number(): void
    {
        $response = $this->actingAs($this->user)
                         ->postJson("/api/player/{$this->player->id}/update", [
                             'name' => 'Test Player',
                             'jersey_number' => 99
                         ]);

        $response->assertStatus(403);
    }

    /**
     * SECURITY FINDING TEST: Can a player update their own attributes?
     * (We suspect this might be missing a role check in the controller)
     */
    public function test_player_updating_attributes_security_check(): void
    {
        $response = $this->actingAs($this->user)
                         ->postJson("/api/player/{$this->player->id}/attributes", [
                             'pace' => 99,
                             'shooting' => 99,
                             'passing' => 99,
                             'dribbling' => 99,
                             'defending' => 99,
                             'physical' => 99,
                         ]);

        // This SHOULD be 403, but it currently returns 200.
        $response->assertStatus(403);
    }
}
