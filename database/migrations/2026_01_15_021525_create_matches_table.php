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
    Schema::create('matches', function (Blueprint $table) {
        $table->id();
        // Link to Coach so we know which team this match belongs to
        $table->foreignId('coach_id')->constrained('coaches')->onDelete('cascade');
        
        $table->string('opponent_name');
        $table->date('match_date');
        $table->time('match_time')->nullable();
        $table->string('venue')->default('Home'); // e.g., 'Home', 'Away', or Stadium Name
        $table->string('league_type')->default('League'); // e.g., 'Friendly', 'Cup'
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
