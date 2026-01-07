<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlayerSeeder extends Seeder
{
public function run(): void
{
    DB::table('players')->insert([
        [
            'name' => 'Ahmad Ali',
            'position' => 'Striker',
            'jersey_number' => 10,
            'strong_foot' => 'right',
            'height_cm' => 175,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'name' => 'David Tan',
            'position' => 'Goalkeeper',
            'jersey_number' => 1,
            'strong_foot' => 'left',
            'height_cm' => 182,
            'created_at' => now(),
            'updated_at' => now(),
        ]
    ]);
}
}
