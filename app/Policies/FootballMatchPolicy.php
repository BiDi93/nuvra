<?php

namespace App\Policies;

use App\Models\FootballMatch;
use App\Models\User;

class FootballMatchPolicy
{
    /**
     * Score, delete, and performance edits. A current admin may edit a
     * fixture. A missing tournament does not skip the check. organizer_id is
     * historical: a former organizer demoted to player still has that id on
     * old matches and is refused.
     */
    public function manage(User $user, FootballMatch $match): bool
    {
        if ($user->role !== 'admin') {
            return false;
        }

        if ((int) $match->organizer_id === (int) $user->id) {
            return true;
        }

        $tournament = $match->tournament;

        if ($tournament && (int) $tournament->organizer_id === (int) $user->id) {
            return true;
        }

        return $user->role === 'admin';
    }
}
