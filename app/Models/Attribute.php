<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attribute extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_id',
        'pace',
        'shooting',
        'passing',
        'dribbling',
        'defending',
        'physical'
    ];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }
}
