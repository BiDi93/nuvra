<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add QR Code field to Users (for Club Owners)
        Schema::table('users', function (Blueprint $blueprint) {
            $blueprint->string('qr_code_path')->nullable()->after('role');
        });

        // 2. Restructure matches table
        Schema::table('matches', function (Blueprint $table) {
            $table->unsignedBigInteger('club_owner_id')->nullable()->after('id');
            $table->decimal('price', 8, 2)->default(0.00)->after('venue');
            $table->integer('total_slots')->default(22)->after('price');
            
            // Note: We keep coach_id temporarily to avoid migration crashes if data exists, 
            // but we will phase it out in the models.
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
