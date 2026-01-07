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
    // 1. Create Coaches Table
    Schema::create('coaches', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->string('password');
        $table->string('team_name'); // e.g., "NUVRA FC U-18"
        $table->timestamps();
    });

    // 2. Add 'coach_id' to Players Table (so we know who they belong to)
    Schema::table('players', function (Blueprint $table) {
        $table->foreignId('coach_id')->nullable()->constrained('coaches')->onDelete('cascade')->after('id');
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coaches_tables');
    }
};
