<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team; // Import the Model

class TeamController extends Controller
{
    // Get the team details for a specific coach
    public function getCoachTeam($coachId)
    {
        // Find the team where 'head_coach_id' matches the ID passed
        $team = Team::where('head_coach_id', $coachId)->first();

        if (!$team) {
            return response()->json(['name' => 'No Team Assigned'], 200);
        }

        return response()->json($team);
    }
}