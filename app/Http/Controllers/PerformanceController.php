<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PerformanceController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validation
        $validated = $request->validate([
            'player_id' => 'required|exists:players,id',
            'match_date' => 'required|date',
            'opponent_name' => 'required|string',
            'minutes_played' => 'required|integer|min:0|max:120',
            'goals' => 'required|integer|min:0',
            'assists' => 'required|integer|min:0',
            'rating' => 'required|numeric|min:1|max:10',
        ]);

        // 2. Save to Database
        DB::table('performances')->insert([
            'player_id' => $validated['player_id'],
            'match_date' => $validated['match_date'],
            'opponent_name' => $validated['opponent_name'],
            'minutes_played' => $validated['minutes_played'],
            'goals' => $validated['goals'],
            'assists' => $validated['assists'],
            'rating' => $validated['rating'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Stats Saved!'], 201);
    }
}