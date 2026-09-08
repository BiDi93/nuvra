<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Tournament extends Model
{
    use HasFactory;

    protected $table = 'tournaments';

    protected $fillable = [
        'organizer_id',
        'name',
        'slug',
        'description',
        'format',
        'season',
        'venue',
        'banner',
        'status',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($tournament) {
            if (empty($tournament->slug)) {
                $tournament->slug = Str::slug($tournament->name) . '-' . Str::random(5);
            }
        });
    }

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function teams()
    {
        return $this->hasMany(TournamentTeam::class, 'tournament_id');
    }

    public function matches()
    {
        return $this->hasMany(FootballMatch::class, 'tournament_id');
    }
}
