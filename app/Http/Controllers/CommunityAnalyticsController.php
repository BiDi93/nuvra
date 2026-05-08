<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommunityAnalyticsController extends Controller
{
    public function index()
    {
        $totalGames = DB::table('community_games')->count();

        $playersRegistered = DB::table('community_users')
            ->where('role', 'player')
            ->count();

        $revenueThisMonth = DB::table('community_bookings')
            ->join('community_games', 'community_bookings.game_id', '=', 'community_games.id')
            ->where('community_bookings.status', 'confirmed')
            ->whereMonth('community_bookings.updated_at', now()->month)
            ->whereYear('community_bookings.updated_at', now()->year)
            ->sum('community_games.price_per_player');

        $recentBookings = DB::table('community_bookings')
            ->join('community_games', 'community_bookings.game_id', '=', 'community_games.id')
            ->join('community_users', 'community_bookings.community_user_id', '=', 'community_users.id')
            ->select(
                'community_bookings.id',
                'community_bookings.status',
                'community_bookings.created_at',
                'community_games.title as game_title',
                'community_games.game_date',
                'community_users.name as player_name'
            )
            ->orderByDesc('community_bookings.created_at')
            ->limit(5)
            ->get()
            ->map(function ($b) {
                $gameDate = \Carbon\Carbon::parse($b->game_date);
                $timeStr  = $gameDate->isToday()
                    ? 'Kick-off: ' . $gameDate->format('H:i') . ' Today'
                    : 'Kick-off: ' . $gameDate->format('d M, H:i');

                if ($b->status === 'payment_submitted') {
                    $icon    = '💳';
                    $message = "Payment submitted by {$b->player_name} for '{$b->game_title}'";
                } elseif ($b->status === 'confirmed') {
                    $icon    = '✅';
                    $message = "Booking confirmed for '{$b->game_title}' — {$b->player_name}";
                } else {
                    $icon    = '❌';
                    $message = "Booking cancelled for '{$b->game_title}'";
                }

                return [
                    'id'         => 'booking_' . $b->id,
                    'icon'       => $icon,
                    'message'    => $message,
                    'time'       => $timeStr,
                    'created_at' => $b->created_at,
                ];
            });

        $recentRegistrations = DB::table('community_users')
            ->where('role', 'player')
            ->select('id', 'name', 'created_at')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get()
            ->map(fn ($u) => [
                'id'         => 'reg_' . $u->id,
                'icon'       => '👤',
                'message'    => "New player registered: {$u->name}",
                'time'       => \Carbon\Carbon::parse($u->created_at)->diffForHumans(),
                'created_at' => $u->created_at,
            ]);

        $notifications = $recentBookings->concat($recentRegistrations)
            ->sortByDesc('created_at')
            ->take(5)
            ->values();

        return response()->json([
            'stats' => [
                'totalGames'        => $totalGames,
                'playersRegistered' => $playersRegistered,
                'revenueThisMonth'  => number_format($revenueThisMonth, 2),
            ],
            'notifications' => $notifications,
        ]);
    }
}
