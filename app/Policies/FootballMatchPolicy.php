<?php

namespace App\Policies;

use App\Models\FootballMatch;
use App\Models\User;

class FootballMatchPolicy
{
    /**
     * Admin, the tournament organizer, or the match organizer when the match
     * has no tournament. A signed-in player cannot change someone else's match.
     */
    public function manage(User $user, FootballMatch $match): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        $tournament = $match->tournament;

        if ($tournament) {
            return (int) $tournament->organizer_id === (int) $user->id;
        }

        return (int) $match->organizer_id === (int) $user->id;
    }
}
