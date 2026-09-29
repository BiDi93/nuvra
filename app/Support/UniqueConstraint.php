<?php

namespace App\Support;

use Illuminate\Database\QueryException;

class UniqueConstraint
{
    /**
     * A unique violation on the pending or confirmed inbox column.
     * The SQL text is not used: every inbox update mentions those columns.
     */
    public static function isInbox(QueryException $exception): bool
    {
        if (! self::isUniqueViolation($exception)) {
            return false;
        }

        $detail = (string) (($exception->errorInfo[2] ?? ''));

        foreach ([
            'users.pending_contact_email',
            'users.contact_email',
            'users_pending_contact_email_unique',
            'users_contact_email_unique',
        ] as $constraint) {
            if (str_contains($detail, $constraint)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Same unique-violation check as the player email import.
     * MySQL ER_DUP_ENTRY is 1062. SQLite SQLITE_CONSTRAINT_UNIQUE is 2067
     * when extended codes are on, and 19 with a UNIQUE constraint label otherwise.
     */
    public static function isUniqueViolation(QueryException $exception): bool
    {
        $info = $exception->errorInfo ?? [];
        $driverCode = isset($info[1]) ? (int) $info[1] : 0;

        if (in_array($driverCode, [1062, 2067], true)) {
            return true;
        }

        $detail = (string) ($info[2] ?? '');

        return $driverCode === 19 && str_starts_with($detail, 'UNIQUE constraint failed');
    }
}
