<?php

namespace App\Policies;

use App\Models\FootballMatch;
use App\Models\User;

class FootballMatchPolicy
{
    /**
     * Same rule as the fixture check on the security-cleanup branch: an
     * admin, the match organizer, or the tournament organizer. A missing
     * tournament does not skip the check.
     */
    public function manage(User $user, FootballMatch $match): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ((int) $match->organizer_id === (int) $user->id) {
            return true;
        }

        $tournament = $match->tournament;

        return $tournament && (int) $tournament->organizer_id === (int) $user->id;
    }
}
