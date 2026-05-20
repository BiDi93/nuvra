<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FootballMatch extends Model
{
    use HasFactory;

    protected $table = 'matches';

    protected $fillable = [
        'club_owner_id',
        'title',
        'description',
        'team_a_name',
        'team_b_name',
        'status',
        'opponent_name',
        'match_date',
        'match_time',
        'venue',
        'price',
        'total_slots',
        'league_type',
        'category',
        'league_name',
        'event_name'
    ];

    /**
     * The Club Owner who created this match.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'club_owner_id');
    }

    /**
     * Players who have joined this match.
     */
    public function players()
    {
        return $this->belongsToMany(User::class, 'match_player')
                    ->withPivot('status')
                    ->withTimestamps();
    }

    public function performances()
    {
        return $this->hasMany(Performance::class, 'match_id');
    }
}
