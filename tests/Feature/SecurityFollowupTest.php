<?php

namespace Tests\Feature;

use App\Models\FootballMatch;
use App\Models\Tournament;
use App\Models\User;
use App\Support\WeakPassword;
use Database\Seeders\CommunitySeeder;
use Database\Seeders\PlayerDummySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class SecurityFollowupTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_members_are_approved_players_only(): void
    {
        $approved = User::factory()->create([
            'name' => 'Approved Player',
            'role' => 'player',
            'status' => 'active',
        ]);
        $pending = User::factory()->create([
            'name' => 'Pending Player',
            'role' => 'player',
            'status' => 'pending',
        ]);
        $admin = User::factory()->create([
            'name' => 'League Admin',
            'role' => 'admin',
            'status' => 'active',
            'password' => 'Admin-Unique-1',
        ]);

        $ids = collect($this->getJson('/api/community/members')->assertOk()->json())->pluck('id');

        $this->assertTrue($ids->contains($approved->id));
        $this->assertFalse($ids->contains($pending->id));
        $this->assertFalse($ids->contains($admin->id));

        $this->getJson("/api/community/members/{$pending->id}")->assertNotFound();
        $this->getJson("/api/community/members/{$admin->id}")->assertNotFound();

        $this->actingAs($approved, 'sanctum')
            ->getJson("/api/community/members/{$admin->id}")
            ->assertNotFound();

        $this->actingAs($pending, 'sanctum')
            ->getJson("/api/community/members/{$pending->id}")
            ->assertOk()
            ->assertJsonPath('user.name', 'Pending Player');

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/community/members/{$pending->id}")
            ->assertOk()
            ->assertJsonPath('user.name', 'Pending Player');
    }

    public function test_demoted_former_organizer_cannot_edit_old_matches(): void
    {
        $former = User::factory()->create([
            'name' => 'Former Organizer',
            'role' => 'player',
            'status' => 'active',
            'password' => 'unique-pass-1',
        ]);
        $admin = User::factory()->create([
            'name' => 'Current Admin',
            'role' => 'admin',
            'status' => 'active',
            'password' => 'Admin-Unique-1',
        ]);

        $tournament = Tournament::create([
            'organizer_id' => $former->id,
            'name' => 'Old Cup',
            'format' => 'league',
            'venue' => 'Arena',
        ]);
        $match = FootballMatch::create([
            'tournament_id' => $tournament->id,
            'organizer_id' => $former->id,
            'gameweek' => 'Matchweek 1',
            'home_team_name' => 'Team A',
            'away_team_name' => 'Team B',
            'match_date' => now()->toDateString(),
            'match_time' => '20:00:00',
            'venue' => 'Arena',
            'status' => 'scheduled',
        ]);

        $this->actingAs($former, 'sanctum')
            ->patchJson("/api/community/matches/{$match->id}/score", [
                'home_score' => 3,
                'away_score' => 0,
            ])->assertForbidden();

        $this->actingAs($former, 'sanctum')
            ->deleteJson("/api/community/matches/{$match->id}")
            ->assertForbidden();

        $this->actingAs($former, 'sanctum')
            ->postJson("/api/community/tournaments/{$tournament->id}/fixtures", [
                'gameweek' => 'Matchweek 2',
                'home_team_name' => 'Team C',
                'away_team_name' => 'Team D',
                'match_date' => now()->toDateString(),
                'match_time' => '21:00:00',
            ])->assertForbidden();

        $this->assertNull($match->fresh()->home_score);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/community/matches/{$match->id}/score", [
                'home_score' => 1,
                'away_score' => 1,
            ])->assertOk();
    }

    public function test_announcements_use_the_sanctum_user_instead_of_a_plaintext_token(): void
    {
        $admin = User::factory()->create([
            'name' => 'Notice Admin',
            'role' => 'admin',
            'status' => 'active',
            'password' => 'Admin-Unique-1',
        ]);
        $player = User::factory()->create([
            'role' => 'player',
            'status' => 'active',
        ]);

        $this->withToken('plaintext-remember-token')
            ->postJson('/api/community/announcements', [
                'title' => 'Should fail',
                'body' => 'No community_users lookup.',
            ])->assertUnauthorized();

        $this->actingAs($player, 'sanctum')
            ->postJson('/api/community/announcements', [
                'title' => 'Player notice',
                'body' => 'Not allowed.',
            ])->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/community/announcements', [
                'title' => 'Match week',
                'body' => 'See the board.',
            ])->assertCreated();

        $this->assertDatabaseHas('community_announcements', [
            'title' => 'Match week',
            'created_by' => $admin->id,
        ]);

        $this->getJson('/api/community/announcements')
            ->assertOk()
            ->assertJsonFragment([
                'title' => 'Match week',
                'author_name' => 'Notice Admin',
            ]);

        $id = (int) \Illuminate\Support\Facades\DB::table('community_announcements')->value('id');

        $this->actingAs($player, 'sanctum')
            ->deleteJson("/api/community/announcements/{$id}")
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/community/announcements/{$id}")
            ->assertOk();
    }

    public function test_demo_seeders_skip_admins_and_known_weak_passwords(): void
    {
        $this->seed(PlayerDummySeeder::class);

        $this->assertSame(0, User::query()->where('role', 'admin')->count());
        $this->assertGreaterThan(0, User::query()->count());
        User::query()->each(function (User $user) {
            $this->assertFalse(WeakPassword::matchesStored($user));
        });

        $this->seed(CommunitySeeder::class);

        $this->assertSame(0, User::query()->where('role', 'admin')->count());
        User::query()->each(function (User $user) {
            $this->assertFalse(WeakPassword::matchesStored($user));
        });
    }

    public function test_demo_seeders_refuse_to_run_in_production(): void
    {
        User::factory()->create(['email' => 'keep@example.com']);
        $count = User::query()->count();
        $this->app['env'] = 'production';

        foreach ([CommunitySeeder::class, PlayerDummySeeder::class] as $seeder) {
            try {
                $this->artisan('db:seed', [
                    '--class' => $seeder,
                    '--force' => true,
                ]);
                $this->fail($seeder.' ran in production.');
            } catch (RuntimeException $e) {
                $this->assertStringContainsString('APP_ENV=production', $e->getMessage());
            }
        }

        $this->assertSame($count, User::query()->count());
        $this->assertDatabaseHas('users', ['email' => 'keep@example.com']);
    }

    public function test_gitignore_keeps_exports_and_env_files_out_except_the_example(): void
    {
        $ignore = file_get_contents(base_path('.gitignore'));

        $this->assertStringContainsString('*.xlsx', $ignore);
        $this->assertStringContainsString('*.csv', $ignore);
        $this->assertStringContainsString('nuvra_db-*', $ignore);
        $this->assertStringContainsString('.env.*', $ignore);
        $this->assertStringContainsString('!.env.example', $ignore);
        $this->assertFileExists(base_path('.env.example'));
    }
}
