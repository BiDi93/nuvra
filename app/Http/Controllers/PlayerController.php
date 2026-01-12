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
    // Get Teammates function
    public function getTeammates($id)
    {
        // 1. Find the current player to get their coach_id
        $currentPlayer = DB::table('players')->where('id', $id)->first();

        if (!$currentPlayer || !$currentPlayer->coach_id) {
            return response()->json(['error' => 'You are not assigned to a team yet.'], 404);
        }

        // 2. Find the Coach/Club details
        $coach = DB::table('coaches')->where('id', $currentPlayer->coach_id)->first();

        // 3. Find all players with the same coach_id
        $teammates = DB::table('players')
            ->where('coach_id', $currentPlayer->coach_id)
            ->select('id', 'name', 'position', 'jersey_number', 'profile_image', 'height_cm')
            ->get();

        return response()->json([
            'club_name' => $coach->team_name,
            'coach_name' => $coach->name,
            'teammates' => $teammates
        ]);
    }

    public function getTeams()
    {
        $teams = DB::table('coaches')->select('id', 'team_name', 'name as coach_name')->get();
        return response()->json($teams);
    }

    // 2. PUBLIC: Handle Sign Up
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:players',
            'password' => 'required|string|min:6',
            'age' => 'required|integer',
            'address' => 'required|string',
            'position' => 'required|string',
            'coach_id' => 'required|integer', // The team they want to join
            // 'profile_image' => 'image|nullable' // We will skip real file upload for now to keep it simple
        ]);

        $id = DB::table('players')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'age' => $validated['age'],
            'address' => $validated['address'],
            'position' => $validated['position'],
            'coach_id' => $validated['coach_id'],
            'status' => 'pending', // <--- IMPORTANT: They cannot login yet
            'created_at' => now(), 'updated_at' => now()
        ]);

        // Create empty attributes so the charts don't crash later
        DB::table('attributes')->insert(['player_id' => $id]);

        return response()->json(['message' => 'Application sent! Waiting for Coach approval.']);
    }
}

