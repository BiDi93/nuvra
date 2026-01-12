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
        // New columns for Sign Up
        $table->integer('age')->nullable()->after('name');
        $table->text('address')->nullable()->after('age');
        
        // The Gatekeeper Column: 'pending', 'active', 'rejected'
        $table->string('status')->default('pending')->after('password');

        // Make existing strict fields nullable (since new signups might not know them yet)
        $table->integer('jersey_number')->nullable()->change();
        $table->integer('height_cm')->nullable()->change();
        $table->string('strong_foot')->nullable()->change();
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
