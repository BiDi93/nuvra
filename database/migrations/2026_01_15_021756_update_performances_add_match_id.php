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
    Schema::table('performances', function (Blueprint $table) {
        // 1. Add the link to the new Matches table
        $table->foreignId('match_id')->after('player_id')->constrained('matches')->onDelete('cascade');
        
        // 2. Drop the old columns (Clean up)
        $table->dropColumn(['opponent_name', 'match_date']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('performances', function (Blueprint $table) {
            //
        });
    }
};
