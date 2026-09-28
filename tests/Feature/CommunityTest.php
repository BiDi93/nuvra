<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
            'password' => bcrypt($this->sharedPassword()),
            'role' => 'player',
            'status' => 'active',
        ]);

        // 2. Create an Admin (Organizer)
        $this->owner = User::factory()->create([
            'email' => 'admin@nuvrasports.com',
            'password' => 'Admin-Unique-1',
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
            'name' => 'New Community User',
            'phone' => '0123456789',
            'position' => 'Forward',
            'password' => 'register-pass-1',
            'password_confirmation' => 'register-pass-1',
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
            'password' => $this->sharedPassword(),
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
                'club_logo' => $file,
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
                'total_goals' => 8,
                'total_assists' => 5,
                'avg_rating' => 7.8,
                'clean_sheets' => 2,
                'position' => 'Striker',
                'vellar_id' => 'VEL-999',
                'club_name' => 'Amigos FC',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Player statistics updated successfully.',
                'stats' => [
                    'total_matches' => 12,
                    'total_goals' => 8,
                    'total_assists' => 5,
                    'avg_rating' => 7.8,
                    'clean_sheets' => 2,
                ],
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
                    'total_goals' => 8,
                    'total_assists' => 5,
                    'avg_rating' => 7.8,
                    'clean_sheets' => 2,
                ],
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
                'total_goals' => 15,
            ]);

        $response->assertStatus(403);
    }

    public function test_masterbase_seeders_read_an_external_fixture_and_fail_when_it_is_missing(): void
    {
        config(['nuvra.masterbase_path' => sys_get_temp_dir().'/nuvra-masterbase-missing.xlsx']);

        foreach ([
            'Database\Seeders\VellarMasterbaseStatsSeeder',
            'Database\Seeders\TournamentMasterbaseSeeder',
        ] as $seeder) {
            try {
                $this->artisan('db:seed', ['--class' => $seeder]);
                $this->fail($seeder.' should stop when the workbook is missing.');
            } catch (\RuntimeException $exception) {
                $this->assertStringContainsString('NUVRA_MASTERBASE_PATH', $exception->getMessage());
            }
        }

        $this->assertSame(2, User::query()->count());

        $inside = storage_path('app/nuvra-masterbase-inside.xlsx');
        $this->writeMasterbaseFixture($inside);
        config(['nuvra.masterbase_path' => $inside]);

        try {
            $this->artisan('db:seed', ['--class' => 'Database\Seeders\VellarMasterbaseStatsSeeder']);
            $this->fail('A workbook inside the repository must be refused.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('outside the repository', $exception->getMessage());
        } finally {
            @unlink($inside);
        }

        $path = sys_get_temp_dir().'/nuvra-masterbase-fixture.xlsx';
        $this->writeMasterbaseFixture($path);
        config(['nuvra.masterbase_path' => $path]);

        User::factory()->create([
            'name' => 'Fixture Player',
            'email' => 'vellar9001@vellarleague.com',
            'vellar_id' => 'VELLAR 9001',
            'role' => 'player',
            'status' => 'active',
            'club_name' => 'FAKE FC',
            'phone' => null,
        ]);

        $this->artisan('db:seed', ['--class' => 'Database\Seeders\VellarMasterbaseStatsSeeder'])->assertSuccessful();

        $player = User::where('vellar_id', 'VELLAR 9001')->first();
        $this->assertNotNull($player);
        $this->assertSame(3, (int) $player->stat_goals);
        $this->assertSame(1, (int) $player->stat_assists);
        $this->assertSame('Fixture Player', $player->name);
        @unlink($path);
    }

    private function writeMasterbaseFixture(string $path): void
    {
        $shared = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <si><t>FAKE FC</t></si>
  <si><t>Fixture Player</t></si>
  <si><t>VELLAR 9001</t></si>
</sst>
XML;
        $sheet = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="2">
      <c r="A2" t="s"><v>0</v></c>
      <c r="B2" t="s"><v>1</v></c>
      <c r="C2" t="s"><v>2</v></c>
      <c r="D2"><v>3</v></c>
      <c r="E2"><v>1</v></c>
      <c r="F2"><v>0</v></c>
    </row>
  </sheetData>
</worksheet>
XML;

        $zip = new \ZipArchive;
        $zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        $zip->addFromString('xl/sharedStrings.xml', $shared);
        $zip->addFromString('xl/worksheets/sheet2.xml', $sheet);
        $zip->close();
    }

    public function test_deploy_workflows_migrate_and_do_not_seed(): void
    {
        foreach (['.github/workflows/uat-deploy.yml', '.github/workflows/deploy.yml'] as $file) {
            $contents = file_get_contents(base_path($file));
            $this->assertIsString($contents);
            $this->assertStringContainsString('php artisan migrate --force', $contents);
            $this->assertStringNotContainsString('db:seed', $contents);
            $this->assertStringNotContainsString('MASTERBASE', $contents);
        }
    }

    /**
     * Test player can update their own basic information.
     */
    public function test_player_can_update_own_basic_information(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/community/profile', [
                'name' => 'Ahmad Updated Player',
                'phone' => '0198887777',
                'position' => 'Midfielder',
                'club_name' => 'Cyberjaya United',
                'address' => 'Cyberjaya, Selangor',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully.',
                'user' => [
                    'id' => $this->user->id,
                    'name' => 'Ahmad Updated Player',
                    'phone' => '0198887777',
                    'position' => 'Midfielder',
                    'club_name' => 'Cyberjaya United',
                    'address' => 'Cyberjaya, Selangor',
                ],
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
            'stat_matches' => 5,
            'stat_goals' => 3,
            'stat_assists' => 2,
            'stat_rating' => 7.0,
            'stat_clean_sheets' => 1,
            'vellar_id' => 'VELLAR 100',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/community/profile', [
                'name' => 'Sneaky Player',
                'stat_matches' => 999,
                'stat_goals' => 500,
                'stat_assists' => 200,
                'stat_rating' => 9.9,
                'stat_clean_sheets' => 50,
                'vellar_id' => 'VELLAR 001',
                'role' => 'admin',
            ]);

        $response->assertStatus(200);

        $this->user->refresh();
        $this->assertEquals('Sneaky Player', $this->user->name);
        // Assert stats and restricted fields remained completely untouched
        $this->assertEquals(5, $this->user->stat_matches);
        $this->assertEquals(3, $this->user->stat_goals);
        $this->assertEquals(2, $this->user->stat_assists);
        $this->assertEquals(7.0, (float) $this->user->stat_rating);
        $this->assertEquals(1, $this->user->stat_clean_sheets);
        $this->assertEquals('VELLAR 100', $this->user->vellar_id);
        $this->assertEquals('player', $this->user->role);
    }
}
