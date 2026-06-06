<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Expand the match_player.status CHECK constraint to support the
     * full payment flow: pending → awaiting_approval → confirmed / rejected.
     * SQLite cannot ALTER a CHECK constraint, so the table is rebuilt.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return; // other drivers: no enum check to rebuild here
        }

        Schema::disableForeignKeyConstraints();

        DB::statement('
            CREATE TABLE "match_player_tmp" (
                "id" integer primary key autoincrement not null,
                "match_id" integer not null,
                "user_id" integer not null,
                "status" varchar check ("status" in (\'pending\', \'confirmed\', \'cancelled\', \'awaiting_approval\', \'rejected\')) not null default \'pending\',
                "created_at" datetime,
                "updated_at" datetime,
                "payment_receipt" varchar,
                "paid_at" datetime,
                foreign key("match_id") references "matches"("id") on delete cascade,
                foreign key("user_id") references "users"("id") on delete cascade
            )
        ');

        DB::statement('INSERT INTO "match_player_tmp" (id, match_id, user_id, status, created_at, updated_at, payment_receipt, paid_at)
                       SELECT id, match_id, user_id, status, created_at, updated_at, payment_receipt, paid_at FROM "match_player"');

        DB::statement('DROP TABLE "match_player"');
        DB::statement('ALTER TABLE "match_player_tmp" RENAME TO "match_player"');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Leaving the expanded constraint in place on rollback is safe.
    }
};
