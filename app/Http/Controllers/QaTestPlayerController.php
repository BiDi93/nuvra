<?php

namespace App\Http\Controllers;

use App\Support\QaTools;
use App\Support\TestPlayers;
use Illuminate\Http\Request;
use RuntimeException;

class QaTestPlayerController extends Controller
{
    public function show(Request $request)
    {
        if ($denied = $this->guard($request)) {
            return $denied;
        }

        return response()->json(['enabled' => true]);
    }

    public function store(Request $request, TestPlayers $players)
    {
        if ($denied = $this->guard($request)) {
            return $denied;
        }

        $data = $request->validate([
            'email' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $contacts = [$data['email']];

        if (filled($data['phone'] ?? null)) {
            $contacts[] = $data['phone'];
        }

        try {
            $created = $players->create($contacts, $request->user()->id, 'qa_admin');
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Created '.count($created).' flagged test player(s).',
            'vellar_ids' => array_map(
                fn ($player) => preg_replace('/\D/', '', (string) $player->vellar_id),
                $created
            ),
        ]);
    }

    public function destroy(Request $request, TestPlayers $players)
    {
        if ($denied = $this->guard($request)) {
            return $denied;
        }

        $deleted = $players->deleteFlagged($request->user()->id, 'qa_admin');

        return response()->json([
            'message' => 'Deleted '.$deleted.' flagged test player(s).',
            'deleted' => $deleted,
        ]);
    }

    private function guard(Request $request)
    {
        if (! QaTools::enabled()) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        return null;
    }
}
