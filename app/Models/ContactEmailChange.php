<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactEmailChange extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'player_id',
        'old_email_masked',
        'new_email_masked',
        'ip_address',
    ];

    public function player(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player_id');
    }
}
