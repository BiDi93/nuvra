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

            // FIXED LOGIC:
            // Status is 'Paid' ONLY if record exists AND status is 'completed'
            // Otherwise, it is 'Unpaid' (even if a pending record exists)
            $isPaid = $payment && $payment->status === 'completed';

            return [
                'id' => $player->id,
                'name' => $player->name,
                'profile_image' => $player->profile_image,
                'status' => $isPaid ? 'Paid' : 'Unpaid', // <--- This dictates the Green/Red pill
                'amount' => $isPaid ? $payment->amount : 0,
                'date_paid' => $isPaid ? $payment->created_at : null,
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

   
// PLAYER: Make a Payment (SMARTER VERSION)
    public function makePayment(Request $request)
    {
        $validated = $request->validate([
            'player_id' => 'required|exists:players,id',
            'month_year' => 'required|string',
            'amount' => 'required|numeric'
        ]);

        //  Find if ANY record exists for this month
        $existingPayment = DB::table('payments')
            ->where('player_id', $validated['player_id'])
            ->where('month_year', $validated['month_year'])
            ->first();

        // SCENARIO A: Already Paid -> Block it
        if ($existingPayment && $existingPayment->status === 'completed') {
            return response()->json(['message' => 'Already paid for this month!'], 400);
        }

        // SCENARIO B: Exists but Unpaid -> UPDATE it
        if ($existingPayment) {
            DB::table('payments')
                ->where('id', $existingPayment->id)
                ->update([
                    'status' => 'completed',
                    'amount' => $validated['amount'],
                    'transaction_id' => 'TXN-' . strtoupper(uniqid()), // New Receipt ID
                    'updated_at' => now(),
                ]);
        } 
        // SCENARIO C: New Record -> INSERT it
        else {
            DB::table('payments')->insert([
                'player_id' => $validated['player_id'],
                'month_year' => $validated['month_year'],
                'amount' => $validated['amount'],
                'status' => 'completed',
                'transaction_id' => 'TXN-' . strtoupper(uniqid()),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Payment Successful! ✅']);
    }
}