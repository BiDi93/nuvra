<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('player_email_audits')) {
            return;
        }

        Schema::create('player_email_audits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('player_id');
            $table->unsignedBigInteger('admin_id');
            $table->string('old_email_masked');
            $table->string('new_email_masked');
            $table->char('source_sha256', 64);
            $table->timestamp('created_at')->useCurrent();

            $table->index('player_id');
            $table->index('source_sha256');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_email_audits');
    }
};
