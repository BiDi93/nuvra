<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'contact_email_source')) {
                // null or "player" is not an admin import. "admin" is.
                $table->string('contact_email_source', 16)->nullable();
            }
        });

        if (! Schema::hasTable('contact_email_changes')) {
            Schema::create('contact_email_changes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('player_id')->constrained('users')->cascadeOnDelete();
                $table->string('old_email_masked');
                $table->string('new_email_masked');
                $table->string('ip_address', 45)->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['player_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_email_changes');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'contact_email_source')) {
                $table->dropColumn('contact_email_source');
            }
        });
    }
};
