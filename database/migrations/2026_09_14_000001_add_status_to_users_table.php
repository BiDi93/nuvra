<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->after('role'); // pending, active, suspended
            }
        });

        // Set all existing Vellar players (with vellar_id) as active
        DB::table('users')->whereNotNull('vellar_id')->update(['status' => 'active']);

        // Set admin/club_owner as active too
        DB::table('users')->whereIn('role', ['club_owner', 'admin'])->update(['status' => 'active']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
