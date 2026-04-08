<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_bookings', function (Blueprint $table) {
            // Expand status to include payment_submitted
            $table->enum('status', ['payment_submitted', 'confirmed', 'cancelled'])
                  ->default('payment_submitted')
                  ->change();

            $table->string('receipt_path')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('community_bookings', function (Blueprint $table) {
            $table->enum('status', ['confirmed', 'cancelled'])
                  ->default('confirmed')
                  ->change();

            $table->dropColumn('receipt_path');
        });
    }
};
