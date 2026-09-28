<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'password_reset_required')) {
                // Existing accounts stay able to sign in. A manual command
                // sets this flag; this migration does not.
                $table->boolean('password_reset_required')->default(false);
            }

            if (! Schema::hasColumn('users', 'contact_email')) {
                // A real inbox, separate from the synthetic login email.
                $table->string('contact_email')->nullable()->unique();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'contact_email')) {
                $table->dropUnique(['contact_email']);
                $table->dropColumn('contact_email');
            }

            if (Schema::hasColumn('users', 'password_reset_required')) {
                $table->dropColumn('password_reset_required');
            }
        });
    }
};
