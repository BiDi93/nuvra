<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * FootballMatch model
 * Purpose: Represents tournament fixtures and league matches.
 */
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
        'organizer_id',
        'title',
        'description',
        'team_a_name',
        'team_b_name',
        'status',
        'match_date',
        'match_time',
        'venue',
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

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    // Alias for backward compatibility if needed
    public function owner()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function performances()
    {
        return $this->hasMany(Performance::class, 'match_id');
    }

    public function players()
    {
        return $this->belongsToMany(User::class, 'match_player', 'match_id', 'user_id');
    }
}
