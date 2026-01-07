<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlayerController extends Controller
{
    //
    public function index()
    {
    // SELECT * FROM players
    $players = DB::table('players')->get();
    return response()->json($players);
    }
public function store(Request $request) // Store the player data into database 
    {
        // 1. Validate the incoming data (Security Check)
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'required|string',
            'jersey_number' => 'required|integer',
            'strong_foot' => 'required|in:left,right,both',
            'height_cm' => 'required|integer',
        ]);

        // 2. Insert into Database
        $id = DB::table('players')->insertGetId([
            'name' => $validated['name'],
            'position' => $validated['position'],
            'jersey_number' => $validated['jersey_number'],
            'strong_foot' => $validated['strong_foot'],
            'height_cm' => $validated['height_cm'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Player Scouted!', 'id' => $id], 201);
    }


    public function show($id)
    {
    // 1. Get the Playerrrr
    $player = DB::table('players')->where('id', $id)->first();

    // 2. Get their History
    $history = DB::table('performances')
                 ->where('player_id', $id)
                 ->orderBy('match_date', 'desc')
                 ->get();

    // 3. Calculate Average Rating (The "Analytics" part)
    $avgRating = $history->avg('rating');

    // 4. Send it all back
    return response()->json([
        'profile' => $player,
        'stats' => [
            'total_matches' => $history->count(),
            'total_goals' => $history->sum('goals'),
            'average_rating' => round($avgRating, 1)
        ],
        'history' => $history
    ]);

    }
}
