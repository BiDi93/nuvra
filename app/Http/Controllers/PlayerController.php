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

    public function update(Request $request, $id)
    {
        $player = DB::table('players')->where('id', $id)->first();

        if (!$player) {
            return response()->json(['message' => 'Player not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
            'password' => 'nullable|string|min:6|confirmed', // confirmed looks for password_confirmation field
        ]);

        $updateData = [
            'name' => $validated['name'],
            'updated_at' => now(),
        ];

        // Handle Password Update (Only if provided)
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        // Handle Image Upload
        if ($request->hasFile('profile_image')) {
            // Delete old image if it exists and isn't a default one
            if ($player->profile_image && file_exists(public_path($player->profile_image))) {
                 // Optional: unlink(public_path($player->profile_image)); 
            }

            // Save new image to 'storage/app/public/players'
            $path = $request->file('profile_image')->store('players', 'public');
            
            // Save the PUBLIC URL to the database
            $updateData['profile_image'] = '/storage/' . $path;
        }

        DB::table('players')->where('id', $id)->update($updateData);

        return response()->json([
            'message' => 'Profile updated successfully!',
            'profile_image' => $updateData['profile_image'] ?? $player->profile_image
        ]);
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
        $player = DB::table('players')->where('id', $id)->first();
        if (!$player) return response()->json(['message' => 'Not found'], 404);

        // UPDATED: Join 'performances' with 'matches' to get the details
        $history = DB::table('performances')
                     ->join('matches', 'performances.match_id', '=', 'matches.id')
                     ->where('performances.player_id', $id)
                     ->orderBy('matches.match_date', 'desc')
                     ->select(
                        'performances.*', 
                        'matches.opponent_name', 
                        'matches.match_date', 
                        'matches.venue', 
                        'matches.league_type'
                     )
                     ->get();

        $attributes = DB::table('attributes')->where('player_id', $id)->first();

        // Default attributes if missing
        if (!$attributes) {
            $attributes = [
                'pace' => 50, 'shooting' => 50, 'passing' => 50, 
                'dribbling' => 50, 'defending' => 50, 'physical' => 50
            ];
        }

        $avgRating = $history->avg('rating') ?: 0;

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

    // PUBLIC: Handle Sign Up
    public function register(Request $request)
    {
        // Validate Input
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:players',
            'password' => 'required|string|min:6',
            'age' => 'required|integer',
            'address' => 'required|string',
            'position' => 'required|string',
            'coach_id' => 'required|integer', // The team they want to join
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120' // We will skip real file upload for now to keep it simple
        ]);

        // Handle File Upload
        $imagePath = null;
        if ($request->hasFile('profile_image')) {
            // Stores in storage/app/public/profile_images
            $path = $request->file('profile_image')->store('profile_images', 'public');
            // Creates the URL we can save to DB: /storage/profile_images/filename.jpg
            $imagePath = '/storage/' . $path;
        }

        //Create PLayer

        $id = DB::table('players')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'age' => $validated['age'],
            'address' => $validated['address'],
            'position' => $validated['position'],
            'coach_id' => $validated['coach_id'],
            'status' => 'pending', // 
            'created_at' => now(), 
            'updated_at' => now(),
            'profile_image' => $imagePath // Save image path or null
        ]);

        // Create empty attributes so the charts don't crash later
        DB::table('attributes')->insert(['player_id' => $id]);

        return response()->json(['message' => 'Application sent! Waiting for Coach approval.']);
    }

    // Get all players for a specific coach
    public function getCoachPlayers($coachId)
    {
        $players = DB::table('players')
            ->where('coach_id', $coachId)
            ->get();

        return response()->json($players);
    }
}

