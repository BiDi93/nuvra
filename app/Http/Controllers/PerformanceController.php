<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;
use App\Models\Match as MatchRecord;
use App\Models\Performance;

class PerformanceController extends Controller
{
    /**
     * Store a new match and performance record.
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
            $match = MatchRecord::updateOrCreate(
                [
                    'coach_id' => $validated['coach_id'],
                    'opponent_name' => $validated['opponent_name'],
                    'match_date' => $validated['match_date'],
                ],
                [
                    'category' => $validated['category'],
                    'league_name' => $validated['league_name'],
                    'event_name' => $validated['event_name'],
                    'venue' => $validated['venue'] ?? 'None',
                ]
            );

            Performance::updateOrCreate(
                [
                    'player_id' => $validated['player_id'],
                    'match_id' => $match->id,
                ],
                [
                    'minutes_played' => $validated['minutes_played'],
                    'goals' => $validated['goals'],
                    'assists' => $validated['assists'],
                    'rating' => $validated['rating'],
                    'cleansheet' => $validated['cleansheet'],
                ]
            );

            return response()->json(['message' => 'Stats saved successfully!']);

        } catch (Throwable $e) {
            Log::error('Error saving performance: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred while saving the stats.'], 500);
        }
    }

    public function getMatches($coachId)
    {
        $matches = MatchRecord::where('coach_id', $coachId)->get();
        return response()->json($matches);
    }
}
