<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'coach_id',
        'name',
        'email',
        'date_of_birth',
        'position',
        'jersey_number',
        'height_cm',
        'weight_kg',
        'strong_foot',
        'photo_url',
        'status',
        'profile_image'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function performances()
    {
        return $this->hasMany(Performance::class);
    }

    public function attributes()
    {
        return $this->hasOne(Attribute::class);
    }
}
