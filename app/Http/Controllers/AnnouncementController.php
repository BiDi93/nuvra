<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends Controller
{
    // Fetch Announcements (Used by both Coach & Player)
    public function index($coachId)
    {
        $announcements = DB::table('announcements')
            ->where('coach_id', $coachId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($announcements);
    }

    // Create Announcement (Coach Only)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'coach_id' => 'required|exists:coaches,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        DB::table('announcements')->insert([
            'coach_id' => $validated['coach_id'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Announcement Blasted! 🚀']);
    }
}