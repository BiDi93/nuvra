<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CommunityNotificationController extends Controller
{
    // Get notifications for authenticated user
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'read_at' => $notification->read_at,
                    'created_at' => Carbon::parse($notification->created_at)->diffForHumans(),
                    'sort_at' => Carbon::parse($notification->created_at)->toIso8601String(),
                    'data' => $notification->data,
                ];
            });

        // Analytics builds this same registration feed on the fly. The bell used
        // to read only the notifications table, which nothing writes to, so
        // organizers saw an empty popover next to a populated Analytics list.
        if ($user->role === 'admin') {
            $registrations = DB::table('users')
                ->where('role', 'player')
                ->orderByDesc('created_at')
                ->limit(8)
                ->get(['id', 'name', 'created_at'])
                ->map(function ($player) {
                    return [
                        'id' => 'reg_' . $player->id,
                        'read_at' => $player->created_at,
                        'created_at' => Carbon::parse($player->created_at)->diffForHumans(),
                        'sort_at' => Carbon::parse($player->created_at)->toIso8601String(),
                        'data' => [
                            'type' => 'registered',
                            'status' => 'registered',
                            'message' => "New player registered: {$player->name}",
                            'player_id' => $player->id,
                        ],
                    ];
                });

            $notifications = $notifications->concat($registrations);
        }

        $notifications = $notifications
            ->sortByDesc('sort_at')
            ->take(20)
            ->values()
            ->map(function ($notification) {
                unset($notification['sort_at']);
                return $notification;
            });

        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    // Mark specific notification as read
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        if (is_string($id) && str_starts_with($id, 'reg_')) {
            return response()->json(['message' => 'Notification marked as read']);
        }

        $notification = $user->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
            return response()->json(['message' => 'Notification marked as read']);
        }

        return response()->json(['message' => 'Notification not found'], 404);
    }

    // Mark all notifications as read
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $user->unreadNotifications->markAsRead();
        return response()->json(['message' => 'All notifications marked as read']);
    }
}
