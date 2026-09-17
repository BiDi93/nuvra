<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\FootballMatch;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TournamentTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_tournaments()
    {
        $response = $this->getJson('/api/community/tournaments');
        $response->assertStatus(200);
    }

    public function test_can_get_tournament_details_with_standings()
    {
        $tournament = Tournament::create([
            'name' => 'Test Cup',
            'format' => 'league',
            'venue' => 'Test Arena',
        ]);

        $response = $this->getJson("/api/community/tournaments/{$tournament->id}");
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'tournament',
                     'teams',
                     'gameweeks',
                     'standings'
                 ]);
    }

    public function test_organizer_can_update_score()
    {
        $organizer = User::create([
            'name' => 'Organizer',
            'email' => 'org@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $tournament = Tournament::create([
            'organizer_id' => $organizer->id,
            'name' => 'Test Cup',
            'format' => 'league',
            'venue' => 'Test Arena',
        ]);

        $match = FootballMatch::create([
            'tournament_id'  => $tournament->id,
            'organizer_id'   => $organizer->id,
            'gameweek'       => 'Matchweek 1',
            'home_team_name' => 'Team A',
            'away_team_name' => 'Team B',
            'match_date'     => now()->toDateString(),
            'match_time'     => '20:00:00',
            'venue'          => 'Test Arena',
            'status'         => 'scheduled',
        ]);

        $response = $this->actingAs($organizer, 'sanctum')->patchJson("/api/community/matches/{$match->id}/score", [
            'home_score' => 2,
            'away_score' => 1,
            'status' => 'completed'
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'home_score' => 2,
                     'away_score' => 1,
                     'status' => 'completed'
                 ]);
    }
}
