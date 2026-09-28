<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;

class DatabaseNotificationPolicy
{
    public function update(User $user, DatabaseNotification $notification): bool
    {
        return $notification->notifiable_type === User::class
            && (int) $notification->notifiable_id === (int) $user->id;
    }
}
