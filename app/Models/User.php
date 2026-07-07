<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable,HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id', // Ensure this is here too!
        'avatar',    // And this!
        'role',
        'qr_code_path',
        'club_logo',
        'address',
        'club_name',
        'established_at',
        'location',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
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
            'password' => 'hashed',
        ];
    }

    /**
     * Matches created by this user (Club Owner)
     */
    public function createdMatches()
    {
        return $this->hasMany(FootballMatch::class, 'club_owner_id');
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
