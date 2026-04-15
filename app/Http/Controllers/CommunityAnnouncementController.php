<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommunityAnnouncementController extends Controller
{
    private function resolveUser(Request $request)
    {
        $token = $request->bearerToken();
        if (! $token) return null;
        return DB::table('community_users')->where('remember_token', $token)->first();
    }

    // ── GET /community/announcements ──────────────────────────────────────────
    public function index()
    {
        $announcements = DB::table('community_announcements')
            ->join('community_users', 'community_announcements.created_by', '=', 'community_users.id')
            ->select(
                'community_announcements.*',
                'community_users.name as author_name'
            )
            ->orderBy('community_announcements.created_at', 'desc')
            ->get();

        return response()->json($announcements);
    }

    // ── POST /community/announcements — admin only ────────────────────────────
    public function store(Request $request)
    {
        $user = $this->resolveUser($request);

        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $id = DB::table('community_announcements')->insertGetId([
            'title'      => $request->title,
            'body'       => $request->body,
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message'      => 'Announcement posted successfully.',
            'announcement' => DB::table('community_announcements')->where('id', $id)->first(),
        ], 201);
    }

    // ── DELETE /community/announcements/{id} — admin only ────────────────────
    public function destroy(Request $request, $id)
    {
        $user = $this->resolveUser($request);

        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        $deleted = DB::table('community_announcements')->where('id', $id)->delete();

        if (! $deleted) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }

        return response()->json(['message' => 'Announcement deleted.']);
    }
}
