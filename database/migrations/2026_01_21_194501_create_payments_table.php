<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::create('payments', function (Blueprint $table) {
        $table->id();
        $table->foreignId('player_id')->constrained('players')->onDelete('cascade');
        $table->string('month_year'); // e.g., "Feb 2026"
        $table->decimal('amount', 8, 2); // e.g., 50.00
        $table->string('status')->default('completed'); // 'completed'
        $table->string('transaction_id')->nullable(); // For future gateway ID
        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
