<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update Role enum (SQLite handles this by recreating table via Laravel)
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['player', 'coach', 'club_owner', 'community_player', 'community_admin'])->default('player')->change();
            $table->string('qr_code_path')->nullable()->after('role');
        });

        // 2. Restructure matches table
        Schema::table('matches', function (Blueprint $table) {
            $table->unsignedBigInteger('coach_id')->nullable()->change();
            $table->string('opponent_name')->nullable()->change();
            $table->string('league_type')->nullable()->change();
            $table->string('category')->nullable()->change();
            
            $table->unsignedBigInteger('club_owner_id')->nullable()->after('id');
            
            $table->string('title')->nullable()->after('club_owner_id');
            $table->text('description')->nullable()->after('title');
            $table->string('team_a_name')->default('Team A')->after('description');
            $table->string('team_b_name')->default('Team B')->after('team_a_name');
            $table->enum('status', ['open', 'full', 'cancelled', 'completed'])->default('open')->after('team_b_name');

            $table->decimal('price', 8, 2)->default(0.00)->after('venue');
            $table->integer('total_slots')->default(22)->after('price');
        });

        // 3. Create Pivot Table for Players joining Matches
        Schema::create('match_player', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // The Player
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
            $table->timestamps();
        });

        // 4. Update Performances to link to User (Player) instead of legacy Player model
        Schema::table('performances', function (Blueprint $table) {
            $table->unsignedBigInteger('player_id')->nullable()->change();
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_player');
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('qr_code_path');
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->dropColumn(['club_owner_id', 'price', 'total_slots']);
        });

        Schema::table('performances', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }
};
