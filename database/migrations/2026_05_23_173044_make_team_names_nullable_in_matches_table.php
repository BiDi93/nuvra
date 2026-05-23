<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->string('team_a_name')->nullable()->change();
            $table->string('team_b_name')->nullable()->change();
            $table->string('opponent_name')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->string('team_a_name')->nullable(false)->change();
            $table->string('team_b_name')->nullable(false)->change();
            $table->string('opponent_name')->nullable(false)->change();
        });
    }
};
