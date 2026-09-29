<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory,Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'role',
        'qr_code_path',
        'club_logo',
        'address',
        'phone',
        'contact_email',
        'club_name',
        'established_at',
        'location',
        'vellar_id',
        'position',
        'status',
        'stat_matches',
        'stat_goals',
        'stat_assists',
        'stat_rating',
        'stat_clean_sheets',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'status_token',
        'contact_email_source',
        'pending_contact_email',
        'email_confirm_token_hash',
        'password_is_shared_verified',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_confirm_expires_at' => 'datetime',
            'password' => 'hashed',
            'password_reset_required' => 'boolean',
            'is_test_account' => 'boolean',
        ];
    }

    /**
     * Null means this account has not been checked yet. The column is not
     * cast: a boolean cast would turn that null into false.
     */
    /**
     * A self-registered player who has not confirmed the inbox they entered.
     * The address stays in pending_contact_email until then. Imported and
     * already-active accounts are not in this gate.
     */
    public function mustConfirmRegistrationEmail(): bool
    {
        return $this->role === 'player'
            && $this->status === 'pending'
            && $this->email_verified_at === null
            && filled($this->pending_contact_email);
    }

    /**
     * Unconfirmed self-signups older than the configured window are expired
     * as soon as they are read. No scheduler is required.
     */
    public function registrationIsExpired(): bool
    {
        if (! $this->mustConfirmRegistrationEmail() || $this->created_at === null) {
            return false;
        }

        $days = max(1, (int) config('nuvra.registration.expire_days', 7));

        return $this->created_at->lte(now()->subDays($days));
    }

    public function sharedPasswordState(): ?bool
    {
        if (! array_key_exists('password_is_shared', $this->getAttributes())) {
            return null;
        }

        $value = $this->getAttributes()['password_is_shared'];

        if ($value === null) {
            return null;
        }

        return (bool) $value;
    }

    /**
     * Matches created by this user (Organizer)
     */
    public function createdMatches()
    {
        return $this->hasMany(FootballMatch::class, 'organizer_id');
    }

    /**
     * Matches joined by this user (Player)
     */
    public function joinedMatches()
    {
        return $this->belongsToMany(FootballMatch::class, 'match_player', 'user_id', 'match_id')
            ->withPivot('status')
            ->withTimestamps();
    }

    /**
     * Performance records for this user (Player)
     */
    public function performances()
    {
        return $this->hasMany(Performance::class, 'user_id');
    }
}
