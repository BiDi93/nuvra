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

    /**
     * Test VellarMasterbaseStatsSeeder successfully populates statistics.
     */
    public function test_vellar_masterbase_stats_seeder_loads_statistics(): void
    {
        $this->artisan('db:seed', ['--class' => 'Database\Seeders\VellarMasterbaseStatsSeeder'])
             ->assertSuccessful();

        $player = User::where('vellar_id', 'VELLAR 112')->first();
        if ($player) {
            $this->assertEquals(10, $player->stat_goals);
            $this->assertGreaterThan(0, $player->stat_matches);
            $this->assertGreaterThan(0, (float)$player->stat_rating);

            // Verify Recent Games history is populated
            $profileRes = $this->getJson("/api/community/members/{$player->id}");
            $profileRes->assertStatus(200);
            $this->assertNotEmpty($profileRes->json('history'));
            $this->assertArrayHasKey('title', $profileRes->json('history')[0]);
            $this->assertArrayHasKey('rating', $profileRes->json('history')[0]);
        }
    }

    /**
     * Test player can update their own basic information.
     */
    public function test_player_can_update_own_basic_information(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson('/api/community/profile', [
                             'name'      => 'Ahmad Updated Player',
                             'phone'     => '0198887777',
                             'position'  => 'Midfielder',
                             'club_name' => 'Cyberjaya United',
                             'address'   => 'Cyberjaya, Selangor',
                         ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'message' => 'Profile updated successfully.',
                     'user' => [
                         'id'        => $this->user->id,
                         'name'      => 'Ahmad Updated Player',
                         'phone'     => '0198887777',
                         'position'  => 'Midfielder',
                         'club_name' => 'Cyberjaya United',
                         'address'   => 'Cyberjaya, Selangor',
                     ]
                 ]);

        $this->user->refresh();
        $this->assertEquals('Ahmad Updated Player', $this->user->name);
        $this->assertEquals('0198887777', $this->user->phone);
        $this->assertEquals('Midfielder', $this->user->position);
        $this->assertEquals('Cyberjaya United', $this->user->club_name);
        $this->assertEquals('Cyberjaya, Selangor', $this->user->address);
    }

    /**
     * Test player cannot modify game statistics or vellar_id via profile update.
     */
    public function test_player_cannot_modify_game_statistics_via_profile_update(): void
    {
        // Set baseline stats on user first
        $this->user->update([
            'stat_matches'      => 5,
            'stat_goals'        => 3,
            'stat_assists'      => 2,
            'stat_rating'       => 7.0,
            'stat_clean_sheets' => 1,
            'vellar_id'         => 'VELLAR 100',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson('/api/community/profile', [
                             'name'              => 'Sneaky Player',
                             'stat_matches'      => 999,
                             'stat_goals'        => 500,
                             'stat_assists'      => 200,
                             'stat_rating'       => 9.9,
                             'stat_clean_sheets' => 50,
                             'vellar_id'         => 'VELLAR 001',
                             'role'              => 'admin',
                         ]);

        $response->assertStatus(200);

        $this->user->refresh();
        $this->assertEquals('Sneaky Player', $this->user->name);
        // Assert stats and restricted fields remained completely untouched
        $this->assertEquals(5, $this->user->stat_matches);
        $this->assertEquals(3, $this->user->stat_goals);
        $this->assertEquals(2, $this->user->stat_assists);
        $this->assertEquals(7.0, (float)$this->user->stat_rating);
        $this->assertEquals(1, $this->user->stat_clean_sheets);
        $this->assertEquals('VELLAR 100', $this->user->vellar_id);
        $this->assertEquals('player', $this->user->role);
    }
}
