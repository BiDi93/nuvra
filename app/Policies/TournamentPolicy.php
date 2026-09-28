<?php

namespace App\Policies;

use App\Models\Tournament;
use App\Models\User;

class TournamentPolicy
{
    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Teams and fixtures. A current admin may manage a tournament. A former
     * organizer who was demoted to player still has organizer_id on old rows
     * and is refused.
     */
    public function manage(User $user, Tournament $tournament): bool
    {
        if ($user->role !== 'admin') {
            return false;
        }

        if ((int) $tournament->organizer_id === (int) $user->id) {
            return true;
        }

        return $user->role === 'admin';
    }
}
