<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('match_player', function (Blueprint $table) {
            $table->string('payment_receipt')->nullable()->after('status');
            $table->timestamp('paid_at')->nullable()->after('payment_receipt');
        });
    }

    public function down(): void
    {
        Schema::table('match_player', function (Blueprint $table) {
            $table->dropColumn(['payment_receipt', 'paid_at']);
        });
    }
};
