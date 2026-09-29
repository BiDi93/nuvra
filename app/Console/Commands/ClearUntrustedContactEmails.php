<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ClearUntrustedContactEmails extends Command
{
    protected $signature = 'players:clear-untrusted-contact-emails
        {--force : Clear recovery emails with no source, from before this deploy. Without this flag the command only prints counts.}';

    protected $description = 'Count recovery emails and clear any with no source. Keeps admin, player, and registration sources. Prints counts only.';

    public function handle(): int
    {
        $withEmail = User::query()
            ->whereNotNull('contact_email')
            ->where('contact_email', '!=', '');

        $total = (clone $withEmail)->count();
        $adminSet = (clone $withEmail)->where('contact_email_source', 'admin')->count();
        $playerSet = (clone $withEmail)->where('contact_email_source', 'player')->count();
        $registrationSet = (clone $withEmail)->where('contact_email_source', 'registration')->count();
        $beforeDeploy = (clone $withEmail)->whereNull('contact_email_source')->count();

        $this->line('Accounts with a recovery email: '.$total);
        $this->line('Set by an admin process: '.$adminSet);
        $this->line('Set by the player: '.$playerSet);
        $this->line('Set by registration: '.$registrationSet);
        $this->line('Set before this deploy: '.$beforeDeploy);

        if (! $this->option('force')) {
            $this->info('Counts only. No recovery emails were cleared. Re-run with --force to clear emails that have no source. Admin, player, and registration sources are kept, so running this between import rounds is safe.');

            return self::SUCCESS;
        }

        $cleared = 0;

        (clone $withEmail)
            ->whereNull('contact_email_source')
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
