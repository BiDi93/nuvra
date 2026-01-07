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
    Schema::create('attributes', function (Blueprint $table) {
        $table->id();
        $table->foreignId('player_id')->constrained()->onDelete('cascade');
        // The 6 FIFA Attributes
        $table->integer('pace')->default(50);
        $table->integer('shooting')->default(50);
        $table->integer('passing')->default(50);
        $table->integer('dribbling')->default(50);
        $table->integer('defending')->default(50);
        $table->integer('physical')->default(50);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attributes');
    }
};
