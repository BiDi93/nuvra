<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_games', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('venue');
            $table->dateTime('game_date');
            $table->string('team_a_name')->default('Team A');
            $table->string('team_b_name')->default('Team B');
            $table->unsignedInteger('max_slots_per_team')->default(20);
            $table->enum('status', ['open', 'full', 'cancelled', 'completed'])->default('open');
            $table->unsignedBigInteger('created_by'); // FK → community_users
            $table->foreign('created_by')->references('id')->on('community_users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_games');
    }
};
