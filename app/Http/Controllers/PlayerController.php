<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PlayerController extends Controller
{
    //
    public function index()
    {
    // SELECT * FROM players
    $players = DB::table('players')->get();
    return response()->json($players);
    }
public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:players,email',
            'position' => 'required|string',
            'jersey_number' => 'required|integer',
            'strong_foot' => 'required|in:left,right,both',
            'height_cm' => 'required|integer',
        ]);

        $id = DB::table('players')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'position' => $validated['position'],
            'jersey_number' => $validated['jersey_number'],
            'strong_foot' => $validated['strong_foot'],
            'height_cm' => $validated['height_cm'],
            'password' => Hash::make('welcome123'), 
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Player Scouted!', 'id' => $id], 201);
    }

    public function show($id)
    {
    // Get the Playerrrr
    $player = DB::table('players')->where('id', $id)->first();
    if (!$player) return response()->json(['message' => 'Not found'], 404);

    // Get their History
    $history = DB::table('performances')
                 ->where('player_id', $id)
                 ->orderBy('match_date', 'desc')
                 ->get();


   

    //Get attributes
    $attributes = DB::table('attributes')->where('player_id', $id)->first();

    if (!$attributes) {
        // If no attributes found, set default values
        $attributes = [
            'pace' => 50,
            'shooting' => 50,
            'passing' => 50,
            'dribbling' => 50,
            'defending' => 50,
            'physical' => 50,
        ];
    } 

    //Calculate Average Rating (The "Analytics" part)
     $avgRating = $history->avg('rating');

    // 4. Send it all back
    return response()->json([
        'profile' => $player,
        'stats' => [
            'total_matches' => $history->count(),
            'total_goals' => $history->sum('goals'),
            'average_rating' => round($avgRating, 1)
        ],
        'attributes' => $attributes,
        'history' => $history
    ]);

    }

   public function login(Request $request)
    {
        // Validate Email format instead of ID number
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Find Player by EMAIL
        $player = DB::table('players')->where('email', $request->email)->first();

        // Check password
        if (!$player || !Hash::check($request->password, $player->password)) {
            return response()->json(['message' => 'Invalid Email or Password'], 401);
        }

        return response()->json([
            'message' => 'Login successful',
            'player_id' => $player->id,
            'name' => $player->name,
            'profile_image' => $player->profile_image
        ]);
    }
}
