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
            'role' => 'player'
        ]);

        // 2. Create an Organizer (Club Owner)
        $this->owner = User::factory()->create([
            'email' => 'owner@nuvrasports.com',
            'password' => bcrypt('password'),
            'role' => 'club_owner'
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
        // Seed a match using Eloquent FootballMatch Model (matches table)
        FootballMatch::create([
            'club_owner_id' => $this->owner->id,
            'title'         => 'Friday Night Football',
            'venue'         => 'Nuvra Arena',
            'match_date'    => now()->addDays(2)->toDateString(),
            'match_time'    => '20:00:00',
            'price'         => 10,
            'total_slots'   => 20,
            'status'        => 'open',
            'team_a_name'   => 'Team A',
            'team_b_name'   => 'Team B',
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
        $game = FootballMatch::create([
            'club_owner_id' => $this->owner->id,
            'title'         => 'Open Pitch',
            'venue'         => 'Nuvra Arena',
            'match_date'    => now()->addDays(1)->toDateString(),
            'match_time'    => '20:00:00',
            'price'         => 0, // Free game auto-confirms
            'total_slots'   => 10,
            'status'        => 'open',
            'team_a_name'   => 'Team A',
            'team_b_name'   => 'Team B',
        ]);

        $response = $this->actingAs($this->user)
                         ->postJson("/api/community/games/{$game->id}/join");

        $response->assertStatus(200)
                 ->assertJson(['status' => 'confirmed']);

        $this->assertDatabaseHas('match_player', [
            'match_id' => $game->id,
            'user_id' => $this->user->id,
            'status' => 'confirmed'
        ]);
    }

    /**
     * Test uploading a club logo.
     */
    public function test_can_upload_club_logo(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('komu_fc.png');

        $response = $this->actingAs($this->user)
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
     * Test receiving notifications on booking updates.
     */
    public function test_receives_notification_on_booking_approval(): void
    {
        // 1. Create a paid match
        $game = FootballMatch::create([
            'club_owner_id' => $this->owner->id,
            'title'         => 'Champions Friendly',
            'venue'         => 'Nuvra Arena',
            'match_date'    => now()->addDays(3)->toDateString(),
            'match_time'    => '20:00:00',
            'price'         => 20.00,
            'total_slots'   => 10,
            'status'        => 'open',
            'team_a_name'   => 'Team A',
            'team_b_name'   => 'Team B',
        ]);

        // 2. Player joins (starts as pending since price > 0)
        $this->actingAs($this->user)
             ->postJson("/api/community/games/{$game->id}/join");

        $bookingId = DB::table('match_player')
            ->where('match_id', $game->id)
            ->where('user_id', $this->user->id)
            ->value('id');

        // 3. Organizer approves booking
        $response = $this->actingAs($this->owner)
                         ->patchJson("/api/community/bookings/{$bookingId}/approve");

        $response->assertStatus(200);

        // 4. Verify player has notification in database
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->user->id,
            'type' => 'App\Notifications\BookingStatusUpdated'
        ]);

        // 5. Test reading notifications API
        $notifResponse = $this->actingAs($this->user)
                              ->getJson('/api/community/notifications');
        
        $notifResponse->assertStatus(200)
                     ->assertJsonCount(1, 'notifications')
                     ->assertJsonPath('unread_count', 1);

        $notifId = $notifResponse->json('notifications.0.id');

        // 6. Test marking notification as read
        $readResponse = $this->actingAs($this->user)
                             ->postJson("/api/community/notifications/{$notifId}/read");
        
        $readResponse->assertStatus(200);

        // Verify count is now 0
        $this->actingAs($this->user)
             ->getJson('/api/community/notifications')
             ->assertJsonPath('unread_count', 0);
    }
}
