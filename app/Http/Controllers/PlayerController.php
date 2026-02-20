<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

//Import User Model
use App\Models\User;

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

    // UPDATE ATTRIBUTES (Coach Edit)
    public function updateAttributes(Request $request, $id)
    {
        $validated = $request->validate([
            'pace' => 'required|integer|min:0|max:100',
            'shooting' => 'required|integer|min:0|max:100',
            'passing' => 'required|integer|min:0|max:100',
            'dribbling' => 'required|integer|min:0|max:100',
            'defending' => 'required|integer|min:0|max:100',
            'physical' => 'required|integer|min:0|max:100',
        ]);

        DB::table('attributes')->updateOrInsert(
            ['player_id' => $id],
            [
                'pace' => $validated['pace'],
                'shooting' => $validated['shooting'],
                'passing' => $validated['passing'],
                'dribbling' => $validated['dribbling'],
                'defending' => $validated['defending'],
                'physical' => $validated['physical'],
                'updated_at' => now()
            ]
        );

        return response()->json(['message' => 'Attributes updated successfully!']);
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
                        'matches.league_name'
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

    // Get Full Profile for Logged-In User
    public function me(Request $request)
    {
        // 1. Get the logged-in user's email from the Token
        $userEmail = $request->user()->email;

        // 2. Find the Player record associated with that email
        $player = DB::table('players')->where('email', $userEmail)->first();

        if (!$player) {
            return response()->json(['message' => 'Player profile not found'], 404);
        }

        $id = $player->id; 

        // 3. Fetch History (Matches joined with Performances)
        $history = DB::table('performances')
                     ->join('matches', 'performances.match_id', '=', 'matches.id')
                     ->where('performances.player_id', $id)
                     ->orderBy('matches.match_date', 'desc')
                     ->select(
                        'performances.*', 
                        'matches.opponent_name', 
                        'matches.match_date', 
                        'matches.venue', 
                        'matches.league_name'
                     )
                     ->get();

        // 4. Fetch Attributes
        $attributes = DB::table('attributes')->where('player_id', $id)->first();

        // Default attributes if missing (prevents frontend crashes)
        if (!$attributes) {
            $attributes = [
                'pace' => 50, 'shooting' => 50, 'passing' => 50, 
                'dribbling' => 50, 'defending' => 50, 'physical' => 50
            ];
        }

        $avgRating = $history->avg('rating') ?: 0;

        // 5. Return the FULL package
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
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // 1. Try to find a PLAYER (in Users table)
        $user = \App\Models\User::where('email', $request->email)->first();

        if ($user && Hash::check($request->password, $user->password)) {
            // It's a Player
            $role = 'player';
            $status = 'active'; 

            // Check specific player status
            $playerRecord = DB::table('players')->where('email', $user->email)->first();
            if ($playerRecord) {
                $status = $playerRecord->status;
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'role' => $role,
                'status' => $status,
                'user_id' => $user->id
            ]);
        }

        // 2. Try to find a COACH (in Coaches table)
        $coach = DB::table('coaches')->where('email', $request->email)->first();

        if ($coach && Hash::check($request->password, $coach->password)) {
            // It's a Coach!
            // NOTE: Since Coach is just a DB record, we can't issue a Sanctum token easily 
            // unless Coach is a Model with HasApiTokens. 
            // For now, we will fake a token or you need to ensure Coach is a Model.
            
            // OPTION A: If you have a Coach model:
            // $coachModel = \App\Models\Coach::find($coach->id);
            // $token = $coachModel->createToken('coach_token')->plainTextToken;

            // OPTION B: For now, just return a dummy token or use session ID
            // Ideally, you should migrate Coaches to the User table later!
            $token = 'coach-session-token-' . $coach->id; 

            return response()->json([
                'message' => 'Coach Login successful',
                'token' => $token,
                'role' => 'coach',
                'status' => 'active',
                'user_id' => $coach->id
            ]);
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'nullable|string|in:player,coach' // 1. Allow 'coach' role
        ]);

        // 2. Create the User with the correct Role
        $role = $request->input('role', 'player'); // Default to player if missing

        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role, // <--- SAVE THE ROLE
            'google_id' => null,
            'avatar' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Account created!',
            'token' => $token,
            'user_id' => $user->id
        ], 201);
    }

    // Get all players for a specific coach
    public function getCoachPlayers($coachId)
    {
        $players = DB::table('players')
            ->where('coach_id', $coachId)
            ->get();

        return response()->json($players);
    }

    // Submit Application (Link User to a Team/Coach)
    public function submitApplication(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'coach_id' => 'required|exists:coaches,id',
            'position' => 'required|string',
            'details' => 'nullable|array' // For age, phone, etc.
        ]);

        // Create the Player Profile (Pending Approval)
        $user = \App\Models\User::find($validated['user_id']);
        
        // Check if player profile already exists
        $existingPlayer = DB::table('players')->where('email', $user->email)->first();
        
        if ($existingPlayer) {
            return response()->json(['message' => 'Application already pending or approved!'], 400);
        }

        DB::table('players')->insert([
            'coach_id' => $validated['coach_id'],
            'name' => $user->name,
            'email' => $user->email,
            'profile_image' => $user->avatar,
            'position' => $validated['position'],
            'status' => 'pending', // Crucial: Start as pending!
            'created_at' => now(),
            'updated_at' => now(),
            // Add other details like age/phone here if you passed them
        ]);

        return response()->json(['message' => 'Application submitted successfully!']);
    }
}

