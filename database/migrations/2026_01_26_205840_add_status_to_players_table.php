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
            // Check if column exists first (Safety check)
            if (!Schema::hasColumn('players', 'status')) {
                // Add 'status' column, default to 'pending'
                // Place it after 'position' just to be tidy
                $table->string('status')->default('pending')->after('position'); 
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            if (Schema::hasColumn('players', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
