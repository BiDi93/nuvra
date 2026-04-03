<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_bookings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('game_id');
            $table->unsignedBigInteger('community_user_id');
            $table->enum('team_side', ['team_a', 'team_b']);
            $table->enum('status', ['confirmed', 'cancelled'])->default('confirmed');
            $table->timestamps();

            $table->foreign('game_id')->references('id')->on('community_games')->onDelete('cascade');
            $table->foreign('community_user_id')->references('id')->on('community_users')->onDelete('cascade');

            // Prevent a player from booking the same game twice
            $table->unique(['game_id', 'community_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_bookings');
    }
};
