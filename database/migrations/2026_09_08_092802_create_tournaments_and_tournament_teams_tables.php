<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create tournaments table
        if (!Schema::hasTable('tournaments')) {
            Schema::create('tournaments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organizer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('name');
                $table->string('slug')->nullable()->unique();
                $table->text('description')->nullable();
                $table->string('format')->default('league'); // league, knockout, group_knockout
                $table->string('season')->nullable();
                $table->string('venue')->nullable();
                $table->string('banner')->nullable();
                $table->string('status')->default('active'); // draft, active, completed
                $table->timestamps();
            });
        }

        // 2. Create tournament_teams table
        if (!Schema::hasTable('tournament_teams')) {
            Schema::create('tournament_teams', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tournament_id')->constrained('tournaments')->cascadeOnDelete();
                $table->string('name');
                $table->string('logo')->nullable();
                $table->string('group_name')->nullable();
                $table->timestamps();
            });
        }

        // 3. Rebuild matches table cleanly to remove legacy coach_id foreign key constraint in SQLite
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');

            DB::statement("CREATE TABLE IF NOT EXISTS matches_temp (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                tournament_id INTEGER,
                gameweek VARCHAR,
                home_team_id INTEGER,
                away_team_id INTEGER,
                home_team_name VARCHAR,
                away_team_name VARCHAR,
                home_score INTEGER,
                away_score INTEGER,
                club_owner_id INTEGER,
                title VARCHAR,
                description TEXT,
                team_a_name VARCHAR,
                team_b_name VARCHAR,
                status VARCHAR NOT NULL DEFAULT 'open',
                opponent_name VARCHAR,
                match_date DATE NOT NULL,
                match_time TIME,
                venue VARCHAR NOT NULL DEFAULT 'Home',
                price NUMERIC NOT NULL DEFAULT '0',
                total_slots INTEGER NOT NULL DEFAULT '22',
                league_type VARCHAR,
                category VARCHAR,
                league_name VARCHAR,
                event_name VARCHAR,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
                FOREIGN KEY (home_team_id) REFERENCES tournament_teams(id) ON DELETE SET NULL,
                FOREIGN KEY (away_team_id) REFERENCES tournament_teams(id) ON DELETE SET NULL,
                FOREIGN KEY (club_owner_id) REFERENCES users(id) ON DELETE SET NULL
            );");

            // Copy existing columns if matches exists
            if (Schema::hasTable('matches')) {
                DB::statement("INSERT INTO matches_temp (
                    id, club_owner_id, title, description, team_a_name, team_b_name, status,
                    opponent_name, match_date, match_time, venue, price, total_slots,
                    league_type, category, league_name, event_name, created_at, updated_at
                ) SELECT 
                    id, club_owner_id, title, description, team_a_name, team_b_name, status,
                    opponent_name, match_date, match_time, venue, price, total_slots,
                    league_type, category, league_name, event_name, created_at, updated_at
                FROM matches;");

                DB::statement("DROP TABLE matches;");
            }

            DB::statement("ALTER TABLE matches_temp RENAME TO matches;");
            DB::statement('PRAGMA foreign_keys = ON;');
        }

        // 4. Drop unused legacy tables
        Schema::dropIfExists('community_games');
        Schema::dropIfExists('community_bookings');
        Schema::dropIfExists('community_users');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('attributes');
        Schema::dropIfExists('coaches');
        Schema::dropIfExists('players');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_teams');
        Schema::dropIfExists('tournaments');
    }
};
