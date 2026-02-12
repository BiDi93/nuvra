<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class PerformanceController extends Controller
{
    /**
     * Store a new match and performance record.
     * This method is designed to be called from the revamped "Record Stats" page.
     * It creates a match and a performance entry in a single transaction.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Match Details
            'coach_id' => 'required|exists:coaches,id',
            'opponent_name' => 'required|string|max:255',
            'match_date' => 'required|date',
            'category' => 'nullable|string|max:255',
            'league_name' => 'nullable|string|max:255',
            'event_name' => 'nullable|string|max:255',
            'venue' => 'nullable|string|max:255',

            // Performance Details
            'player_id' => 'required|exists:players,id',
            'minutes_played' => 'required|integer|min:0',
            'goals' => 'required|integer|min:0',
            'assists' => 'required|integer|min:0',
            'rating' => 'required|numeric|min:0|max:10',
            'cleansheet' => 'required|boolean',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                // Step 1: Create or find the match
                // This prevents creating duplicate matches for the same game
                $match = DB::table('matches')->updateOrInsert(
                    [
                        'coach_id' => $validated['coach_id'],
                        'opponent_name' => $validated['opponent_name'],
                        'match_date' => $validated['match_date'],
                    ],
                    [
                        'category' => $validated['category'],
                        'league_name' => $validated['league_name'],
                        'event_name' => $validated['event_name'],
                        'venue' => $validated['venue'] ?? 'None', // Default to 'None'
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
                
                // Retrieve the ID of the inserted/updated match
                // Since updateOrInsert doesn't return the model/id, we need to fetch it.
                $matchId = DB::table('matches')->where([
                    'coach_id' => $validated['coach_id'],
                    'opponent_name' => $validated['opponent_name'],
                    'match_date' => $validated['match_date'],
                ])->value('id');


                // Step 2: Create or update the performance record for the player in that match
                DB::table('performances')->updateOrInsert(
                    [
                        'player_id' => $validated['player_id'],
                        'match_id' => $matchId,
                    ],
                    [
                        'minutes_played' => $validated['minutes_played'],
                        'goals' => $validated['goals'],
                        'assists' => $validated['assists'],
                        'rating' => $validated['rating'],
                        'cleansheet' => $validated['cleansheet'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            });

            return response()->json(['message' => 'Stats saved successfully!']);

        } catch (Throwable $e) {
            Log::error('Error saving performance: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred while saving the stats.'], 500);
        }
    }
}