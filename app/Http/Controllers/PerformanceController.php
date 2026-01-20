<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PerformanceController extends Controller
{
    // Fetch Matches for the Dropdown (So coach can pick a game)
    public function getMatches($coachId)
    {
        $matches = DB::table('matches')
            ->where('coach_id', $coachId)
            ->orderBy('match_date', 'desc')
            ->get();
            
        return response()->json($matches);
    }

    // Save Stats (Using match_id instead of typing names)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'player_id' => 'required|exists:players,id',
            'match_id' => 'required|exists:matches,id', // <--- Links to the match we picked
            'minutes_played' => 'required|integer',
            'goals' => 'required|integer',
            'assists' => 'required|integer',
            'rating' => 'required|numeric|min:0|max:10',
        ]);

        // Use updateOrInsert: If we already saved stats for this player+match, just update them.
        DB::table('performances')->updateOrInsert(
            [
                'player_id' => $validated['player_id'], 
                'match_id' => $validated['match_id']
            ],
            [
                'minutes_played' => $validated['minutes_played'],
                'goals' => $validated['goals'],
                'assists' => $validated['assists'],
                'rating' => $validated['rating'],
                'updated_at' => now(),
                // Only set created_at if it's a new record
                'created_at' => DB::raw('IFNULL(created_at, NOW())') 
            ]
        );

        return response()->json(['message' => 'Stats saved successfully!']);
    }
}