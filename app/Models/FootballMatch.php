<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FootballMatch extends Model
{
    use HasFactory;

    protected $table = 'matches';

    protected $fillable = [
        'tournament_id',
        'gameweek',
        'home_team_id',
        'away_team_id',
        'home_team_name',
        'away_team_name',
        'home_score',
        'away_score',
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

    public function tournament()
    {
        return $this->belongsTo(Tournament::class, 'tournament_id');
    }

    public function homeTeam()
    {
        return $this->belongsTo(TournamentTeam::class, 'home_team_id');
    }

    public function awayTeam()
    {
        return $this->belongsTo(TournamentTeam::class, 'away_team_id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'club_owner_id');
    }

    public function performances()
    {
        return $this->hasMany(Performance::class, 'match_id');
    }
}
