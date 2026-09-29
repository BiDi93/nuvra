<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class VellarIdAllocator
{
    /**
     * Reserve the next Vellar login key inside a write lock, then retry if
     * another signup took the same number. The contact address is a separate
     * unique column and is not retried: that clash means the inbox is taken.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes, callable $configure): User
    {
        $this->prepareSqlite();

        $last = null;

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            try {
                return DB::transaction(function () use ($attributes, $configure) {
                    $this->lockSequence();
                    $number = $this->nextNumber();

                    $user = User::create(array_merge($attributes, [
                        'email' => 'vellar'.$number.'@vellarleague.com',
                        'vellar_id' => 'VELLAR '.$number,
                    ]));

                    $configure($user, $number);

                    return $user->fresh();
                });
            } catch (QueryException $e) {
                if ($this->isContactEmailConflict($e)) {
                    throw $e;
                }

                if (! $this->isRetryable($e)) {
                    throw $e;
                }

                $last = $e;
                usleep(20000 * $attempt);
            }
        }

        throw $last ?? new \RuntimeException('Could not assign a Vellar ID.');
    }

    private function prepareSqlite(): void
    {
        if (DB::connection()->getDriverName() !== 'sqlite') {
            return;
        }

        DB::statement('PRAGMA busy_timeout = 5000');
    }

    private function lockSequence(): void
    {
        if (! DB::table('vellar_sequences')->where('id', 1)->exists()) {
            try {
                DB::table('vellar_sequences')->insert([
                    'id' => 1,
                    'lock_at' => null,
                ]);
            } catch (QueryException $e) {
                if (! $this->isRetryable($e)) {
                    throw $e;
                }
            }
        }

        DB::table('vellar_sequences')->where('id', 1)->update([
            'lock_at' => now(),
        ]);
    }

    private function nextNumber(): int
    {
        $max = 0;

        foreach (User::query()->whereNotNull('vellar_id')->pluck('vellar_id') as $id) {
            $max = max($max, (int) preg_replace('/[^0-9]/', '', (string) $id));
        }

        $next = $max + 1;

        while (
            User::query()->where('email', 'vellar'.$next.'@vellarleague.com')->exists()
            || User::query()->where('vellar_id', 'VELLAR '.$next)->exists()
        ) {
            $next++;
        }

        return $next;
    }

    private function isContactEmailConflict(QueryException $e): bool
    {
        return str_contains($e->getMessage(), 'contact_email');
    }

    private function isRetryable(QueryException $e): bool
    {
        $message = $e->getMessage();

        return str_contains($message, 'UNIQUE constraint failed')
            || str_contains($message, 'database is locked')
            || str_contains($message, 'SQLSTATE[23000]')
            || str_contains($message, 'SQLSTATE[40001]');
    }
}
