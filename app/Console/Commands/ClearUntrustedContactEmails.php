<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ClearUntrustedContactEmails extends Command
{
    protected $signature = 'players:clear-untrusted-contact-emails
        {--force : Clear recovery emails that were not set by an admin process. Without this flag the command only prints counts.}';

    protected $description = 'Count recovery emails and clear any that were not set by an admin process. Prints counts only.';

    public function handle(): int
    {
        $withEmail = User::query()
            ->whereNotNull('contact_email')
            ->where('contact_email', '!=', '');

        $total = (clone $withEmail)->count();
        $adminSet = (clone $withEmail)->where('contact_email_source', 'admin')->count();
        $untrusted = $total - $adminSet;

        $this->line('Accounts with a recovery email: '.$total);
        $this->line('Set by an admin process: '.$adminSet);
        $this->line('Not set by an admin process: '.$untrusted);

        if (! $this->option('force')) {
            $this->info('Counts only. No recovery emails were cleared. Re-run with --force to clear the ones not set by an admin process.');

            return self::SUCCESS;
        }

        $cleared = 0;

        (clone $withEmail)
            ->where(function ($query) {
                $query->whereNull('contact_email_source')
                    ->orWhere('contact_email_source', '!=', 'admin');
            })
            ->orderBy('id')
            ->chunkById(100, function ($users) use (&$cleared) {
                foreach ($users as $user) {
                    $user->forceFill([
                        'contact_email' => null,
                        'contact_email_source' => null,
                    ])->save();
                    $cleared++;
                }
            });

        $this->info('Cleared '.$cleared.' recovery email(s). No addresses were printed.');

        return self::SUCCESS;
    }
}
