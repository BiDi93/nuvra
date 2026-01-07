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
    Schema::create('players', function (Blueprint $table) {
        $table->id(); // Primary Key (Auto Increment)
        
        // Basic Info
        $table->string('name');
        $table->date('date_of_birth')->nullable();
        $table->string('position'); // e.g. "Striker", "Goalkeeper"
        $table->integer('jersey_number')->nullable();
        
        // Physical Stats (The "FIFA" element)
        $table->integer('height_cm')->nullable();
        $table->integer('weight_kg')->nullable();
        $table->enum('strong_foot', ['left', 'right', 'both'])->default('right');
        
        // System Info
        $table->string('photo_url')->nullable(); // For the player profile pic
        $table->timestamps(); // Creates 'created_at' and 'updated_at' automatically
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
