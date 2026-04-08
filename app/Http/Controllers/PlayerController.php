<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

//Import Models
use App\Models\User;
use App\Models\Player;
use App\Models\Coach;
use App\Models\Attribute;
use App\Models\Performance;
use App\Models\Match;

class PlayerController extends Controller
{
    //
    public function index()
    {
        $players = Player::all();
        return response()->json($players);
    }

    public function update(Request $request, $id)
    {
        $player = Player::find($id);

        if (!$player) {
            return response()->json(['message' => 'Player not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
            'password' => 'nullable|string|min:6|confirmed', // confirmed looks for password_confirmation field
        ]);

        $player->name = $validated['name'];

        // Handle Password Update (Only if provided)
        if ($request->filled('password')) {
            // Note: If Player is linked to User, we should update User password too.
            // For now, we update player password field if it exists.
            $player->password = Hash::make($validated['password']);
        }

        // Handle Image Upload
        if ($request->hasFile('profile_image')) {
            // Delete old image if it exists and isn't a default one
            if ($player->profile_image && file_exists(public_path($player->profile_image))) {
                 // unlink(public_path($player->profile_image)); 
            }

            $path = $request->file('profile_image')->store('players', 'public');
            $player->profile_image = '/storage/' . $path;
        }

        // COACH-ONLY: Jersey Number Update
        if ($request->has('jersey_number')) {
            $user = $request->user();
            if (!$user || $user->role !== 'coach') {
                return response()->json(['message' => 'Only coaches can update player attributes.'], 403);
            }

            $request->validate([
                'jersey_number' => 'nullable|integer'
            ]);

            $player->jersey_number = $request->input('jersey_number');
        }

        $player->save();

        return response()->json([
            'message' => 'Profile updated successfully!',
            'profile_image' => $player->profile_image
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

        Attribute::updateOrCreate(
            ['player_id' => $id],
            $validated
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

        $player = Player::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'position' => $validated['position'],
            'jersey_number' => $validated['jersey_number'],
            'strong_foot' => $validated['strong_foot'],
            'height_cm' => $validated['height_cm'],
            // 'password' => Hash::make('welcome123'), // If players have passwords separate from Users
        ]);

        return response()->json(['message' => 'Player Scouted!', 'id' => $player->id], 201);
    }

    public function show($id)
    {
        $player = Player::with(['attributes', 'performances.match'])->find($id);
        if (!$player) return response()->json(['message' => 'Not found'], 404);

        $history = $player->performances->map(function ($perf) {
            return array_merge($perf->toArray(), [
                'opponent_name' => $perf->match->opponent_name,
                'match_date' => $perf->match->match_date,
                'venue' => $perf->match->venue,
                'league_name' => $perf->match->league_name,
            ]);
        });

        $attributes = $player->attributes ?: [
            'pace' => 50, 'shooting' => 50, 'passing' => 50, 
            'dribbling' => 50, 'defending' => 50, 'physical' => 50
        ];

        $avgRating = $player->performances->avg('rating') ?: 0;

        return response()->json([
            'profile' => $player,
            'stats' => [
                'total_matches' => $player->performances->count(),
                'total_goals' => $player->performances->sum('goals'),
                'average_rating' => round($avgRating, 1)
            ],
            'attributes' => $attributes,
            'history' => $history
        ]);
    }

    // Get Full Profile for Logged-In User
    public function me(Request $request)
    {
        $user = $request->user();
        $player = Player::with(['attributes', 'performances.match'])->where('user_id', $user->id)->first();

        // Fallback to email if user_id is not yet linked (for existing data)
        if (!$player) {
            $player = Player::with(['attributes', 'performances.match'])->where('email', $user->email)->first();
        }

        if (!$player) {
            return response()->json(['message' => 'Player profile not found'], 404);
        }

        $history = $player->performances->map(function ($perf) {
            return array_merge($perf->toArray(), [
                'opponent_name' => $perf->match->opponent_name,
                'match_date' => $perf->match->match_date,
                'venue' => $perf->match->venue,
                'league_name' => $perf->match->league_name,
            ]);
        });

        $attributes = $player->attributes ?: [
            'pace' => 50, 'shooting' => 50, 'passing' => 50, 
            'dribbling' => 50, 'defending' => 50, 'physical' => 50
        ];

        $avgRating = $player->performances->avg('rating') ?: 0;

        return response()->json([
            'profile' => $player,
            'stats' => [
                'total_matches' => $player->performances->count(),
                'total_goals' => $player->performances->sum('goals'),
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

    // Unified login using standard Auth
    if (!auth()->attempt($request->only('email', 'password'))) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    $user = auth()->user();
    $token = $user->createToken('auth_token')->plainTextToken;

    $response = [
        'message' => 'Login successful',
        'token' => $token,
        'role' => $user->role,
        'user_id' => $user->id,
    ];

    // Add player-specific info if needed
    if ($user->role === 'player') {
        $playerRecord = $user->player;
        $response['status'] = $playerRecord ? $playerRecord->status : 'active';
    } else {
        $response['status'] = 'active';
    }

    return response()->json($response);
}

    // Get Teammates function
    public function getTeammates($id)
    {
        $currentPlayer = Player::find($id);

        if (!$currentPlayer || !$currentPlayer->coach_id) {
            return response()->json(['error' => 'You are not assigned to a team yet.'], 404);
        }

        $coach = $currentPlayer->coach;

        $teammates = Player::where('coach_id', $currentPlayer->coach_id)
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
        $teams = Coach::select('id', 'team_name', 'name as coach_name')->get();
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

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
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
        $players = Player::where('coach_id', $coachId)->get();
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

        $user = User::find($validated['user_id']);
        
        $existingPlayer = Player::where('email', $user->email)->first();
        
        if ($existingPlayer) {
            return response()->json(['message' => 'Application already pending or approved!'], 400);
        }

        Player::create([
            'user_id' => $user->id,
            'coach_id' => $validated['coach_id'],
            'name' => $user->name,
            'email' => $user->email,
            'profile_image' => $user->avatar,
            'position' => $validated['position'],
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Application submitted successfully!']);
    }
}

