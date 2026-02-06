<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PaymentControllerBillplz extends Controller
{
    public function createBill(Request $request)
    {
        // 1. Get the User & Amount
        $user = $request->user();
        $amount = 50.00; // You can pass this dynamically via $request->amount if needed
        
        // 2. Define Billplz URL (Sandbox vs Production)
        $url = env('BILLPLZ_SANDBOX') 
            ? 'https://www.billplz-sandbox.com/api/v3/bills' 
            : 'https://www.billplz.com/api/v3/bills';

        // 3. Send Request to Billplz
        $response = Http::withBasicAuth(env('BILLPLZ_API_KEY'), '')
            ->post($url, [
                'collection_id' => env('BILLPLZ_COLLECTION_ID'),
                'email'         => $user->email,
                'name'          => $user->name,
                'amount'        => $amount * 100, // ⚠️ Billplz calculates in CENTS (50.00 -> 5000)
                'callback_url'  => 'http://your-ngrok-url/api/payment/callback', // We will setup Ngrok later
                'redirect_url'  => env('APP_URL') . '/dashboard/payment', // Where user goes AFTER paying
                'description'   => "Monthly Fees for " . ($request->month ?? 'Unknown Month'),
                'mobile'        => '0123456789' // Optional: Fetch from user profile if available
            ]);

        // 4. Return the Bill URL to React
        if ($response->successful()) {
            return response()->json([
                'url' => $response->json()['url'],
                'id'  => $response->json()['id']
            ]);
        }

        return response()->json(['error' => 'Failed to create bill'], 500);
    }

public function verifyPayment(Request $request)
    {
        $billId = $request->bill_id;

        // 1. Define URL (Sandbox vs Production)
        $url = env('BILLPLZ_SANDBOX') 
            ? "https://www.billplz-sandbox.com/api/v3/bills/{$billId}" 
            : "https://www.billplz.com/api/v3/bills/{$billId}";

        // 2. Ask Billplz status
        $response = Http::withBasicAuth(env('BILLPLZ_API_KEY'), '')->get($url);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['paid'] === true) {
                
                // A. Find the Player Profile linked to this User
                // We assume the User's email matches the Player's email
                $userEmail = $request->user()->email;
                $player = \DB::table('players')->where('email', $userEmail)->first();

                if ($player) {
                    // B. Extract "February 2026" from "Monthly Fees for February 2026"
                    $description = $data['description'];
                    $monthYear = str_replace("Monthly Fees for ", "", $description);

                    // C. Save to Database (The missing part!)
                    \DB::table('payments')->updateOrInsert(
                        [
                            'player_id'  => $player->id,
                            'month_year' => $monthYear, // Matches "February 2026"
                        ],
                        [
                            'amount'         => $data['amount'] / 100, // Convert 5000 cents -> 50.00
                            'status'         => 'completed',
                            'transaction_id' => $data['id'], // Store Billplz ID (e.g. "inbmmzf4")
                            'created_at'     => now(),
                            'updated_at'     => now(),
                        ]
                    );
                }

                return response()->json(['status' => 'paid', 'message' => 'Payment verified & Saved!']);
            }
            
            return response()->json(['status' => 'pending', 'message' => 'Bill is not paid yet.']);
        }

        return response()->json(['error' => 'Billplz check failed'], 500);
    }

    public function getMyPayments($id)
    {
        // Fetch all payments for this player, ordered by newest first
        $payments = DB::table('payments')
            ->where('player_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($payments);
    }
}