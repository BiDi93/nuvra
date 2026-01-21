<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    // COACH: Get Payment Status for ALL players for a specific month
    public function getTeamPayments($coachId, $monthYear)
    {
        // Get all players for this coach
        $players = DB::table('players')->where('coach_id', $coachId)->get();

        // Map through players and check if they have paid for that month
        $rosterStatus = $players->map(function($player) use ($monthYear) {
            $payment = DB::table('payments')
                ->where('player_id', $player->id)
                ->where('month_year', $monthYear)
                ->first();

            return [
                'id' => $player->id,
                'name' => $player->name,
                'profile_image' => $player->profile_image,
                'status' => $payment ? 'Paid' : 'Unpaid',
                'amount' => $payment ? $payment->amount : 0,
                'date_paid' => $payment ? $payment->created_at : null,
            ];
        });

        return response()->json($rosterStatus);
    }

    // PLAYER: Get My Payment History
    public function getMyPayments($playerId)
    {
        $payments = DB::table('payments')
            ->where('player_id', $playerId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($payments);
    }

    // PLAYER: Make a Payment (MOCK GATEWAY)
    public function makePayment(Request $request)
    {
        $validated = $request->validate([
            'player_id' => 'required|exists:players,id',
            'month_year' => 'required|string',
            'amount' => 'required|numeric'
        ]);

        // Check if already paid to prevent double charge
        $exists = DB::table('payments')
            ->where('player_id', $validated['player_id'])
            ->where('month_year', $validated['month_year'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Already paid for this month!'], 400);
        }

        // SIMULATE SUCCESSFUL PAYMENT
        DB::table('payments')->insert([
            'player_id' => $validated['player_id'],
            'month_year' => $validated['month_year'],
            'amount' => $validated['amount'],
            'status' => 'completed',
            'transaction_id' => 'TXN-' . strtoupper(uniqid()), // Fake ID
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Payment Successful! ✅']);
    }
}