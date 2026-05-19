<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\CommunityUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $communityUser;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a unified User
        $this->user = User::factory()->create([
            'email' => 'community@nuvrasports.com',
            'password' => bcrypt('password'),
            'role' => 'community_player'
        ]);

        // 2. Create Community Profile
        $this->communityUser = CommunityUser::create([
            'user_id'  => $this->user->id,
            'name'     => 'Community Tester',
            'email'    => 'community@nuvrasports.com',
            'password' => bcrypt('password'),
            'role'     => 'player',
        ]);
    }

    /**
     * Test community registration.
     */
    public function test_community_registration(): void
    {
        $response = $this->postJson('/api/community/register', [
            'name'     => 'New Community User',
            'email'    => 'newcommunity@nuvrasports.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['token', 'user']);
        
        $this->assertDatabaseHas('users', ['email' => 'newcommunity@nuvrasports.com']);
        $this->assertDatabaseHas('community_users', ['email' => 'newcommunity@nuvrasports.com']);
    }

    /**
     * Test community login.
     */
    public function test_community_login(): void
    {
        $response = $this->postJson('/api/community/login', [
            'email'    => 'community@nuvrasports.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'user']);
    }

    /**
     * Test fetching community games.
     */
    public function test_can_list_community_games(): void
    {
        // Seed a game manually using DB (since there might not be a Model yet or we want to test the Controller's DB usage)
        DB::table('community_games')->insert([
            'title'              => 'Friday Night Football',
            'venue'              => 'Nuvra Arena',
            'game_date'          => now()->addDays(2),
            'max_slots_per_team' => 10,
            'status'             => 'open',
            'created_by'         => $this->communityUser->id,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $response = $this->getJson('/api/community/games');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment(['title' => 'Friday Night Football']);
    }

    /**
     * Test joining a community game.
     */
    public function test_can_join_community_game(): void
    {
        $gameId = DB::table('community_games')->insertGetId([
            'title'              => 'Open Pitch',
            'venue'              => 'Nuvra Arena',
            'game_date'          => now()->addDays(1),
            'max_slots_per_team' => 5,
            'price_per_player'   => 0, // Free game
            'status'             => 'open',
            'created_by'         => $this->communityUser->id,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $response = $this->actingAs($this->user)
                         ->postJson("/api/community/games/{$gameId}/join", [
                             'team_side' => 'team_a'
                         ]);

        $response->assertStatus(201)
                 ->assertJson(['message' => 'Slot booked! See you on the pitch. 🔥']);

        $this->assertDatabaseHas('community_bookings', [
            'game_id' => $gameId,
            'community_user_id' => $this->communityUser->id,
            'team_side' => 'team_a',
            'status' => 'confirmed'
        ]);
    }
}
