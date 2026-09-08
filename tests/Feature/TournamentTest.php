<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\FootballMatch;

class TournamentTest extends TestCase
{
    public function test_can_list_tournaments()
    {
        $response = $this->getJson('/api/community/tournaments');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'name', 'format', 'venue', 'teams_count', 'matches_count']
                 ]);
    }

    public function test_can_get_tournament_details_with_standings()
    {
        $tournament = Tournament::first();
        if (!$tournament) {
            $tournament = Tournament::create([
                'name' => 'Test Cup',
                'format' => 'league',
                'venue' => 'Test Arena',
            ]);
        }

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
        $organizer = User::where('role', 'club_owner')->first();
        if (!$organizer) {
            $organizer = User::create([
                'name' => 'Organizer',
                'email' => 'org@test.com',
                'password' => bcrypt('password'),
                'role' => 'club_owner'
            ]);
        }

        $match = FootballMatch::first();
        if ($match) {
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
}
