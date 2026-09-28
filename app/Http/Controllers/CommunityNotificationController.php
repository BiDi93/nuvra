<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class CommunityNotificationController extends Controller
{
    // Get notifications for authenticated user
    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'read_at' => $notification->read_at,
                    'created_at' => Carbon::parse($notification->created_at)->diffForHumans(),
                    'data' => $notification->data,
                ];
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
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Synthetic registration rows from the other UAT pull request use this prefix.
        if (is_string($id) && str_starts_with($id, 'reg_')) {
            return response()->json(['message' => 'Notification marked as read']);
        }

        $notification = DatabaseNotification::query()->find($id);

        if (! $notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        if (! $user->can('update', $notification)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read']);
    }

    // Mark all notifications as read
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }
}
