<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewPrivate(User $viewer, User $player): bool
    {
        return $this->owns($viewer, $player) || $viewer->role === 'admin';
    }

    public function update(User $viewer, User $player): bool
    {
        return $this->owns($viewer, $player);
    }

    public function updateStats(User $viewer, User $player): bool
    {
        return $viewer->role === 'admin' && $player->role === 'player';
    }

    public function issueActivationCode(User $viewer, User $player): bool
    {
        return $viewer->role === 'admin' && $player->role === 'player';
    }

    public function reviewRegistration(User $viewer, User $player): bool
    {
        return $viewer->role === 'admin' && $player->role === 'player';
    }

    public function viewAny(User $viewer): bool
    {
        return $viewer->role === 'admin';
    }

    private function owns(User $viewer, User $player): bool
    {
        return (int) $viewer->id === (int) $player->id;
    }
}
