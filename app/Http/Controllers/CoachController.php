<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Coach;
use App\Models\Player;
use App\Models\Attribute;
use App\Models\User;

class CoachController extends Controller
{
    // COACH LOGIN (Unified with Sanctum)
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!auth()->attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid Credentials'], 401);
        }

        $user = auth()->user();
        
        if ($user->role !== 'coach') {
            return response()->json(['message' => 'Unauthorized. Only coaches can login here.'], 403);
        }

        $coach = $user->coach;
        $token = $user->createToken('coach_token')->plainTextToken;

        return response()->json([
            'id' => $coach->id,
            'name' => $coach->name,
            'team_name' => $coach->team_name,
            'token' => $token,
            'message' => 'Welcome Coach!'
        ]);
    }

    // GET MY TEAM (Filter by Coach ID)
    public function getMyTeam($coachId)
    {
        $players = Player::where('coach_id', $coachId)
                    ->where('status', 'active')
                    ->select('id', 'name', 'position', 'jersey_number', 'email', 'profile_image')
                    ->get();

        return response()->json($players);
    }

    // ADD PLAYER (Automatically assign to this Coach)
    public function addPlayer(Request $request, $coachId)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:players',
            'position' => 'required|string',
            'jersey_number' => 'required|integer',
            'height_cm' => 'required|integer',
            'strong_foot' => 'required|string',
        ]);

        $player = Player::create([
            'coach_id' => $coachId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'position' => $validated['position'],
            'jersey_number' => $validated['jersey_number'],
            'height_cm' => $validated['height_cm'],
            'strong_foot' => $validated['strong_foot'],
            'status' => 'active',
        ]);

        // Create default attributes
        Attribute::create(['player_id' => $player->id]);

        return response()->json(['message' => 'Player added to your squad!', 'id' => $player->id]);
    }


    public function getPendingRequests($coachId)
    {
        $requests = Player::where('coach_id', $coachId)
            ->where('status', 'pending')
            ->get();
            
        return response()->json($requests);
    }

    //  Approve or Decline
    public function handleRequest(Request $request, $coachId, $playerId)
    {
        $action = $request->input('action'); // 'approve' or 'decline'
        $player = Player::find($playerId);

        if (!$player) {
            return response()->json(['message' => 'Player not found'], 404);
        }

        if ($action === 'approve') {
            $player->status = 'active';
            $player->save();
            return response()->json(['message' => 'Player Approved!']);
        } else {
            // If declined, we just delete their application
            $player->delete();
            // Attributes will be deleted via cascade if set up in migration, 
            // but let's be explicit if needed or rely on cascade.
            return response()->json(['message' => 'Player Declined.']);
        }
    }
}
