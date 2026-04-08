<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Match extends Model
{
    use HasFactory;

    protected $fillable = [
        'coach_id',
        'opponent_name',
        'match_date',
        'match_time',
        'venue',
        'league_type',
        'category',
        'league_name',
        'event_name'
    ];

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function performances()
    {
        return $this->hasMany(Performance::class);
    }
}
