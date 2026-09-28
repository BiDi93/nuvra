<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'password_is_shared')) {
                $table->boolean('password_is_shared')->nullable();
            }

            if (! Schema::hasColumn('users', 'is_test_account')) {
                $table->boolean('is_test_account')->default(false);
            }
        });

        if (! Schema::hasTable('player_code_audits')) {
            Schema::create('player_code_audits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('player_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('source', 32);
                $table->timestamp('issued_at');
                $table->timestamps();

                $table->index(['player_id', 'issued_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('player_code_audits');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_test_account')) {
                $table->dropColumn('is_test_account');
            }

            if (Schema::hasColumn('users', 'password_is_shared')) {
                $table->dropColumn('password_is_shared');
            }
        });
    }
};
