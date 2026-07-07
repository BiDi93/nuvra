<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CommunityAnalyticsController extends Controller
{
    public function index()
    {
        $totalGames = DB::table('matches')->count();

        $playersRegistered = DB::table('users')
            ->where('role', 'player')
            ->count();

        $revenueThisMonth = DB::table('match_player')
            ->join('matches', 'match_player.match_id', '=', 'matches.id')
            ->where('match_player.status', 'confirmed')
            ->whereMonth('match_player.updated_at', now()->month)
            ->whereYear('match_player.updated_at', now()->year)
            ->sum('matches.price');

        $recentBookings = DB::table('match_player')
            ->join('matches', 'match_player.match_id', '=', 'matches.id')
            ->join('users', 'match_player.user_id', '=', 'users.id')
            ->select(
                'match_player.id',
                'match_player.status',
                'match_player.created_at',
                'matches.title as game_title',
                'matches.match_date as game_date',
                'users.name as player_name'
            )
            ->orderByDesc('match_player.created_at')
            ->limit(5)
            ->get()
            ->map(function ($b) {
                $gameDate = Carbon::parse($b->game_date);
                $timeStr  = $gameDate->isToday()
                    ? 'Kick-off: ' . $gameDate->format('H:i') . ' Today'
                    : 'Kick-off: ' . $gameDate->format('d M, H:i');

                if ($b->status === 'awaiting_approval') {
                    $icon    = '💳';
                    $message = "Payment submitted by {$b->player_name} for '{$b->game_title}'";
                } elseif ($b->status === 'confirmed') {
                    $icon    = '✅';
                    $message = "Booking confirmed for '{$b->game_title}' — {$b->player_name}";
                } elseif ($b->status === 'rejected') {
                    $icon    = '❌';
                    $message = "Booking rejected for '{$b->game_title}' — {$b->player_name}";
                } else {
                    $icon    = '❌';
                    $message = "Booking status updated to {$b->status} for '{$b->game_title}'";
                }

                return [
                    'id'         => 'booking_' . $b->id,
                    'icon'       => $icon,
                    'message'    => $message,
                    'time'       => $timeStr,
                    'created_at' => $b->created_at,
                ];
            });

        $recentRegistrations = DB::table('users')
            ->where('role', 'player')
            ->select('id', 'name', 'created_at')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get()
            ->map(fn ($u) => [
                'id'         => 'reg_' . $u->id,
                'icon'       => '👤',
                'message'    => "New player registered: {$u->name}",
                'time'       => Carbon::parse($u->created_at)->diffForHumans(),
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
