<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'email_confirm_token_hash')) {
                $table->string('email_confirm_token_hash', 64)->nullable()->unique();
            }

            if (! Schema::hasColumn('users', 'email_confirm_expires_at')) {
                $table->timestamp('email_confirm_expires_at')->nullable();
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('status_token');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('vellar_id');
        });

        if (! Schema::hasTable('vellar_sequences')) {
            Schema::create('vellar_sequences', function (Blueprint $table) {
                $table->unsignedTinyInteger('id')->primary();
                $table->timestamp('lock_at')->nullable();
            });

            DB::table('vellar_sequences')->insert([
                'id' => 1,
                'lock_at' => null,
            ]);
        }

        if (! Schema::hasTable('player_registration_audits')) {
            Schema::create('player_registration_audits', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('player_id');
                $table->unsignedBigInteger('admin_id');
                $table->string('action', 16);
                $table->string('email_masked', 64);
                $table->timestamp('created_at')->useCurrent();

                $table->index('player_id');
                $table->index('admin_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('player_registration_audits');
        Schema::dropIfExists('vellar_sequences');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'vellar_id')) {
                $table->dropUnique(['vellar_id']);
            }

            if (Schema::hasColumn('users', 'status_token')) {
                $table->dropIndex(['status_token']);
            }

            if (Schema::hasColumn('users', 'email_confirm_token_hash')) {
                $table->dropUnique(['email_confirm_token_hash']);
                $table->dropColumn('email_confirm_token_hash');
            }

            if (Schema::hasColumn('users', 'email_confirm_expires_at')) {
                $table->dropColumn('email_confirm_expires_at');
            }
        });
    }
};
