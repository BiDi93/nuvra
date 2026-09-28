<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'password_is_shared_verified')) {
                // True only after a check while NUVRA_SHARED_DEFAULT_PASSWORD was set.
                $table->boolean('password_is_shared_verified')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'password_is_shared_verified')) {
                $table->dropColumn('password_is_shared_verified');
            }
        });
    }
};
