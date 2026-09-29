<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ExpireUnconfirmedSignups extends Command
{
    protected $signature = 'players:expire-unconfirmed-signups
        {--delete : Delete unconfirmed sign-ups older than 7 days. Without this flag the command only prints the count.}';

    protected $description = 'Extra cleanup for unconfirmed self-registrations older than 7 days. Those rows are already treated as expired when read. Delete them when --delete is passed.';

    public function handle(): int
    {
        $days = max(1, (int) config('nuvra.registration.expire_days', 7));
        $query = User::query()
            ->where('role', 'player')
            ->where('status', 'pending')
            ->whereNull('email_verified_at')
            ->whereNotNull('pending_contact_email')
            ->where('pending_contact_email', '!=', '')
            ->where('created_at', '<=', now()->subDays($days));

        $count = (clone $query)->count();
        $this->line('Unconfirmed sign-ups older than '.$days.' days: '.$count);

        if (! $this->option('delete')) {
            $this->info('Dry run. Nothing was deleted.');

            return self::SUCCESS;
        }

        $deleted = 0;

        (clone $query)->orderBy('id')->chunkById(100, function ($users) use (&$deleted) {
            foreach ($users as $user) {
                $user->delete();
                $deleted++;
            }
        });

        $this->info('Deleted '.$deleted.' unconfirmed sign-up(s). No addresses were printed.');

        return self::SUCCESS;
    }
}
