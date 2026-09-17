<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');

            // Update role values first by removing CHECK constraint via recreation or raw table update
            DB::statement("CREATE TABLE users_temp (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                name VARCHAR NOT NULL,
                email VARCHAR NOT NULL,
                email_verified_at DATETIME,
                password VARCHAR NOT NULL,
                remember_token VARCHAR,
                created_at DATETIME,
                updated_at DATETIME,
                google_id VARCHAR,
                avatar VARCHAR,
                role VARCHAR CHECK (role IN ('player', 'admin')) NOT NULL DEFAULT 'player',
                phone VARCHAR,
                qr_code_path VARCHAR,
                address VARCHAR,
                club_name VARCHAR,
                established_at DATE,
                location VARCHAR,
                club_logo VARCHAR,
                vellar_id VARCHAR,
                position VARCHAR,
                status VARCHAR DEFAULT 'active'
            );");

            // Copy data and map roles
            DB::statement("INSERT INTO users_temp (
                id, name, email, email_verified_at, password, remember_token, created_at, updated_at,
                google_id, avatar, role, phone, qr_code_path, address, club_name, established_at,
                location, club_logo, vellar_id, position, status
            ) SELECT 
                id, name, email, email_verified_at, password, remember_token, created_at, updated_at,
                google_id, avatar,
                CASE 
                    WHEN role IN ('club_owner', 'community_admin', 'admin') THEN 'admin'
                    ELSE 'player'
                END,
                phone, qr_code_path, address, club_name, established_at,
                location, club_logo, vellar_id, position, status
            FROM users;");

            DB::statement("DROP TABLE users;");
            DB::statement("ALTER TABLE users_temp RENAME TO users;");
            DB::statement("CREATE UNIQUE INDEX users_email_unique ON users (email);");
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            // MySQL / PostgreSQL
            DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'player'");
            DB::table('users')->whereIn('role', ['club_owner', 'community_admin'])->update(['role' => 'admin']);
            DB::table('users')->whereIn('role', ['coach', 'community_player'])->update(['role' => 'player']);
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('player', 'admin') NOT NULL DEFAULT 'player'");
        }

        // Rename club_owner_id to organizer_id in matches table
        if (Schema::hasColumn('matches', 'club_owner_id')) {
            Schema::table('matches', function (Blueprint $table) {
                $table->renameColumn('club_owner_id', 'organizer_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('matches', 'organizer_id')) {
            Schema::table('matches', function (Blueprint $table) {
                $table->renameColumn('organizer_id', 'club_owner_id');
            });
        }
    }
};
