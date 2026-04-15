<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_games', function (Blueprint $table) {
            $table->decimal('price_per_player', 8, 2)->default(0)->after('max_slots_per_team');
            $table->string('payment_qr_path')->nullable()->after('price_per_player');
        });
    }

    public function down(): void
    {
        Schema::table('community_games', function (Blueprint $table) {
            $table->dropColumn(['price_per_player', 'payment_qr_path']);
        });
    }
};
