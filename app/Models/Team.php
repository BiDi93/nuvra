<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Player;
use App\Models\Match as MatchModel;
    

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'slug',
        'based_location', 
        'established_year', 
        'logo', 
        'primary_color', 
        'head_coach_id',
        'home_venue',
        'social_link'
    ];

    // Relationship: A Team belongs to a Head Coach (User)
    public function headCoach()
    {
        return $this->belongsTo(User::class, 'head_coach_id');
    }

    // Relationship: A Team has many Players
    public function players()
    {
        // Assuming your 'players' table has a 'team_id' column
        return $this->hasMany(Player::class);
    }
    
    // Relationship: A Team plays many Matches
    public function matches()
    {
        // Assuming 'matches' table will eventually have 'team_id'
        return $this->hasMany(MatchModel::class);
    }
}