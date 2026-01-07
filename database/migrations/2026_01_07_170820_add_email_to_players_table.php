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
        // We make it 'nullable' so it doesn't break your existing players
        // We make it 'unique' so two players can't have the same email
        $table->string('email')->nullable()->unique()->after('name');
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
