<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    // 1. Get Events (For Calendar)
    public function index($coachId)
    {
        $events = DB::table('schedules')
            ->where('coach_id', $coachId)
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json($events);
    }

    // 2. Add Event
    public function store(Request $request)
    {
        $validated = $request->validate([
            'coach_id' => 'required|exists:coaches,id',
            'title' => 'required|string',
            'type' => 'required|string',
            'start_time' => 'required|date',
            'location' => 'nullable|string',
        ]);

        DB::table('schedules')->insert([
            'coach_id' => $validated['coach_id'],
            'title' => $validated['title'],
            'type' => $validated['type'],
            'start_time' => $validated['start_time'],
            'location' => $validated['location'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Event Added! 🗓️']);
    }

    // 3. Delete Event
    public function destroy($id)
    {
        DB::table('schedules')->delete($id);
        return response()->json(['message' => 'Event Removed']);
    }
}