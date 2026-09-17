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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'stat_matches')) {
                $table->integer('stat_matches')->nullable();
            }
            if (!Schema::hasColumn('users', 'stat_goals')) {
                $table->integer('stat_goals')->nullable();
            }
            if (!Schema::hasColumn('users', 'stat_assists')) {
                $table->integer('stat_assists')->nullable();
            }
            if (!Schema::hasColumn('users', 'stat_rating')) {
                $table->decimal('stat_rating', 3, 1)->nullable();
            }
            if (!Schema::hasColumn('users', 'stat_clean_sheets')) {
                $table->integer('stat_clean_sheets')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['stat_matches', 'stat_goals', 'stat_assists', 'stat_rating', 'stat_clean_sheets'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
