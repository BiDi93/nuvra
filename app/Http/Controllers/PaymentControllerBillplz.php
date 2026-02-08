<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PaymentControllerBillplz extends Controller
{
    // 1. Create the Bill (User clicks "Pay Now")
    public function createBill(Request $request)
    {
        $user = $request->user();
        $amount = 50.00;
        
        // FIX: Use config() instead of env() for Sandbox Check
        $url = config('services.billplz.sandbox') 
            ? 'https://www.billplz-sandbox.com/api/v3/bills' 
            : 'https://www.billplz.com/api/v3/bills';

        // FIX: Use config() for API Key and Collection ID
        $response = Http::withBasicAuth(config('services.billplz.key'), '')
            ->post($url, [
                'collection_id' => config('services.billplz.collection_id'),
                'email'         => $user->email,
                'name'          => $user->name,
                'amount'        => $amount * 100, 
                'callback_url'  => config('app.url') . '/api/payment/callback',
                'redirect_url'  => config('app.url') . '/dashboard/payment',
                'description'   => "Monthly Fees for " . ($request->month ?? 'Unknown Month'),
                'mobile'        => '0123456789' 
            ]);

        if ($response->successful()) {
            return response()->json([
                'url' => $response->json()['url'],
                'id'  => $response->json()['id']
            ]);
        }

        return response()->json(['error' => 'Failed to create bill'], 500);
    }

    // 2. Verify Payment (User returns from Billplz)
    public function verifyPayment(Request $request)
    {
        $billId = $request->bill_id;

        // FIX: Use config() here too! (This was breaking in production)
        $url = config('services.billplz.sandbox')
            ? "https://www.billplz-sandbox.com/api/v3/bills/{$billId}" 
            : "https://www.billplz.com/api/v3/bills/{$billId}";

        // FIX: Use config() for API Key
        $response = Http::withBasicAuth(config('services.billplz.key'), '')->get($url);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['paid'] === true) {
                
                $userEmail = $request->user()->email;
                $player = DB::table('players')->where('email', $userEmail)->first();

                if ($player) {
                    $description = $data['description'];
                    $monthYear = str_replace("Monthly Fees for ", "", $description);

                    DB::table('payments')->updateOrInsert(
                        [
                            'player_id'  => $player->id,
                            'month_year' => $monthYear,
                        ],
                        [
                            'amount'         => $data['amount'] / 100, 
                            'status'         => 'completed',
                            'transaction_id' => $data['id'],
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

    // 3. Get Payment History
    public function getMyPayments($id)
    {
        $payments = DB::table('payments')
            ->where('player_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($payments);
    }
}