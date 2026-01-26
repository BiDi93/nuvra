<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CoachController extends Controller
{
    // COACH LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $coach = DB::table('coaches')->where('email', $request->email)->first();

        if (!$coach || !Hash::check($request->password, $coach->password)) {
            return response()->json(['message' => 'Invalid Credentials'], 401);
        }

        return response()->json([
            'id' => $coach->id,
            'name' => $coach->name,
            'team_name' => $coach->team_name,
            'message' => 'Welcome Coach!'
        ]);
    }

    // GET MY TEAM (Filter by Coach ID)
public function getMyTeam($coachId)
{
    $players = DB::table('players')
                ->where('coach_id', $coachId)
                ->where('status', 'active') // <--- ADD THIS LINE!
                ->select('id', 'name', 'position', 'jersey_number', 'email', 'profile_image')
                ->get();

    return response()->json($players);
}

    // ADD PLAYER (Automatically assign to this Coach)
    public function addPlayer(Request $request, $coachId)
    {
        // (Use the validation logic you already know, but add coach_id)
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:players',
            'position' => 'required|string',
            'jersey_number' => 'required|integer',
            'height_cm' => 'required|integer',
            'strong_foot' => 'required|string',
        ]);

        $id = DB::table('players')->insertGetId([
            'coach_id' => $coachId, // <--- IMPORTANT: Link to logged-in coach
            'name' => $validated['name'],
            'email' => $validated['email'],
            'position' => $validated['position'],
            'jersey_number' => $validated['jersey_number'],
            'height_cm' => $validated['height_cm'],
            'strong_foot' => $validated['strong_foot'],
            'password' => Hash::make('welcome123'),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // Create default attributes
        DB::table('attributes')->insert(['player_id' => $id]);

        return response()->json(['message' => 'Player added to your squad!', 'id' => $id]);
    }


    public function getPendingRequests($coachId)
    {
        $requests = DB::table('players')
            ->where('coach_id', $coachId)
            ->where('status', 'pending')
            ->get();
            
        return response()->json($requests);
    }

    //  Approve or Decline
    public function handleRequest(Request $request, $coachId, $playerId)
    {
        $action = $request->input('action'); // 'approve' or 'decline'

        if ($action === 'approve') {
            DB::table('players')->where('id', $playerId)->update(['status' => 'active']);
            return response()->json(['message' => 'Player Approved!']);
        } else {
            // If declined, we just delete their application
            DB::table('players')->where('id', $playerId)->delete();
            // Also delete their empty attributes
            DB::table('attributes')->where('player_id', $playerId)->delete();
            return response()->json(['message' => 'Player Declined.']);
        }
    }
}