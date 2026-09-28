<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * community_announcements.created_by used to reference community_users,
     * which this schema drops. Point it at users so posts use the Sanctum account.
     */
    public function up(): void
    {
        if (! Schema::hasTable('community_announcements')) {
            return;
        }

        Schema::disableForeignKeyConstraints();

        Schema::create('community_announcements_users', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        DB::statement('
            INSERT INTO community_announcements_users (id, title, body, created_by, created_at, updated_at)
            SELECT a.id, a.title, a.body,
                CASE WHEN u.id IS NULL THEN NULL ELSE a.created_by END,
                a.created_at, a.updated_at
            FROM community_announcements a
            LEFT JOIN users u ON u.id = a.created_by
        ');

        Schema::drop('community_announcements');
        Schema::rename('community_announcements_users', 'community_announcements');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // The previous foreign key pointed at a table this schema drops.
    }
};
