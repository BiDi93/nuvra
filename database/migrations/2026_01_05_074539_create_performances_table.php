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
        Schema::create('performances', function (Blueprint $table) {
            $table->id();

        // This links the stats to a specific player
            $table->foreignId('player_id')->constrained()->onDelete('cascade');

            $table->date('match_date');
            $table->string('opponent_name');

        // The Stats
        $table->integer('goals')->default(0);
        $table->integer('assists')->default(0);
        $table->integer('minutes_played')->default(0);
        $table->decimal('rating', 3, 1)->nullable(); // e.g. 8.5

        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performances');
    }
};
