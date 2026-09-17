<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\FootballMatch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $owner;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a regular Player
        $this->user = User::factory()->create([
            'email' => 'community@nuvrasports.com',
            'password' => bcrypt('password'),
            'role' => 'player',
            'status' => 'active',
        ]);

        // 2. Create an Admin (Organizer)
        $this->owner = User::factory()->create([
            'email' => 'admin@nuvrasports.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);
    }

    /**
     * Test community registration.
     */
    public function test_community_registration(): void
    {
        $response = $this->postJson('/api/community/register', [
            'name'                  => 'New Community User',
            'phone'                 => '0123456789',
            'position'              => 'Forward',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['message', 'vellar_id']);
    }

    /**
     * Test community login.
     */
    public function test_community_login(): void
    {
        $response = $this->postJson('/api/community/login', [
            'vellar_id' => 'community@nuvrasports.com',
            'password'  => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'user']);
    }

    /**
     * Test uploading a club logo.
     */
    public function test_can_upload_club_logo(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('komu_fc.png');

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/community/profile/logo', [
                             'club_logo' => $file
                         ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'club_logo']);

        $this->user->refresh();
        $this->assertNotNull($this->user->club_logo);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $this->user->club_logo));
    }

    /**
     * Test admin can modify player statistics.
     */
    public function test_admin_can_modify_player_statistics(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
                         ->putJson("/api/community/admin/players/{$this->user->id}/stats", [
                             'total_matches' => 12,
                             'total_goals'   => 8,
                             'total_assists' => 5,
                             'avg_rating'    => 7.8,
                             'clean_sheets'  => 2,
                             'position'      => 'Striker',
                             'vellar_id'     => 'VEL-999',
                             'club_name'     => 'Amigos FC',
                         ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'message' => 'Player statistics updated successfully.',
                     'stats' => [
                         'total_matches' => 12,
                         'total_goals'   => 8,
                         'total_assists' => 5,
                         'avg_rating'    => 7.8,
                         'clean_sheets'  => 2,
                     ]
                 ]);

        // Verify public member profile returns the updated statistics
        $profileRes = $this->getJson("/api/community/members/{$this->user->id}");
        $profileRes->assertStatus(200)
                   ->assertJson([
                       'user' => [
                           'id' => $this->user->id,
                           'position' => 'Striker',
                           'vellar_id' => 'VEL-999',
                           'club_name' => 'Amigos FC',
                       ],
                       'stats' => [
                           'total_matches' => 12,
                           'total_goals'   => 8,
                           'total_assists' => 5,
                           'avg_rating'    => 7.8,
                           'clean_sheets'  => 2,
                       ]
                   ]);
    }

    /**
     * Test regular player cannot modify player statistics.
     */
    public function test_regular_player_cannot_modify_player_statistics(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson("/api/community/admin/players/{$this->user->id}/stats", [
                             'total_matches' => 20,
                             'total_goals'   => 15,
                         ]);

        $response->assertStatus(403);
    }
}
