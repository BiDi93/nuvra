<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');

            DB::statement("CREATE TABLE IF NOT EXISTS performances_clean (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                user_id INTEGER,
                match_id INTEGER NOT NULL,
                goals INTEGER NOT NULL DEFAULT 0,
                assists INTEGER NOT NULL DEFAULT 0,
                minutes_played INTEGER NOT NULL DEFAULT 0,
                rating NUMERIC,
                cleansheet TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );");

            if (Schema::hasTable('performances')) {
                DB::statement("INSERT INTO performances_clean (
                    id, user_id, match_id, goals, assists, minutes_played, rating, cleansheet, created_at, updated_at
                ) SELECT 
                    id, user_id, match_id, goals, assists, minutes_played, rating, cleansheet, created_at, updated_at
                FROM performances;");

                DB::statement("DROP TABLE performances;");
            }

            DB::statement("ALTER TABLE performances_clean RENAME TO performances;");
            DB::statement('PRAGMA foreign_keys = ON;');
        }
    }

    public function down(): void
    {
    }
};
