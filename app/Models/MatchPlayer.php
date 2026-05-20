<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchPlayer extends Model
{
    use HasFactory;

    protected $table = 'match_player';

    protected $fillable = [
        'match_id',
        'user_id',
        'status',
    ];

    public function match()
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
