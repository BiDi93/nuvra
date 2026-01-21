<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::create('schedules', function (Blueprint $table) {
        $table->id();
        $table->foreignId('coach_id')->constrained('coaches')->onDelete('cascade');
        $table->string('title'); // e.g., "vs Cyberjaya FC" or "Fitness Training"
        $table->string('type'); // 'match', 'training', 'meeting'
        $table->dateTime('start_time');
        $table->dateTime('end_time')->nullable();
        $table->string('location')->nullable(); // e.g., "Padang A", "Gym"
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
