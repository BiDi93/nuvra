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
    Schema::table('players', function (Blueprint $table) {
        // Stores the encrypted password
        $table->string('password')->default(bcrypt('password123')); 
        // Stores the URL to their photo (e.g. '/images/avatar1.png')
        $table->string('profile_image')->nullable(); 
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            //
        });
    }
};
