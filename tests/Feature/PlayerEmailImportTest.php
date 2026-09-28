<?php

namespace Tests\Feature;

use App\Mail\RecoveryEmailChanged;
use App\Models\PlayerEmailAudit;
use App\Models\User;
use App\Support\EmailMask;
use App\Support\PlayerContact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class PlayerEmailImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_dry_run_writes_nothing_and_masks_every_address(): void
    {
        Mail::fake();
        $admin = $this->admin();
        $player = $this->player('82');
        $this->player('84');
        $this->player('85');
        $this->player('87');
        $holder = $this->player('90', ['contact_email' => 'taken@example.com']);
        $this->player('88', ['contact_email' => 'kept88@example.com']);
        $existing = $this->player('89', ['contact_email' => 'other89@example.com']);
        $this->player('92');
        $this->player('93');
        $this->player('94');
        $this->player('91', [
            'role' => 'admin',
            'email' => 'vellar91@vellarleague.com',
            'name' => 'Not A Player',
        ]);

        $path = $this->outsideFile('.csv', implode("\n", [
            'Vellar ID, Email, Collected by',
            '  82 ,  Alpha82@Example.com , Manager A',
            '84, not-an-email, Manager A',
            '85, keeper85@vellarleague.com, Manager A',
            '999, missing@example.com, Manager A',
            '87,  Taken@Example.com , Manager A',
            '91, staff91@example.com, Manager A',
            '88,  Kept88@Example.com , Manager A',
            '89, new89@example.com, Manager A',
            '92, first92@example.com, Manager A',
            '92, second92@example.com, Manager A',
            '93, shared93@example.com, Manager A',
            '94, shared93@example.com, Manager A',
        ]));

        $mask = EmailMask::mask('alpha82@example.com');

        $this->artisan('players:import-emails', [
            'file' => $path,
        ])->expectsOutputToContain('File SHA-256: '.hash_file('sha256', $path))
            ->expectsOutputToContain('Rows read: 12')
            ->expectsOutputToContain('Rows to apply: 1')
            ->expectsOutputToContain('Rows unchanged: 1')
            ->expectsOutputToContain('Invalid email or placeholder: 2')
            ->expectsOutputToContain('Vellar ID not found or not a player: 2')
            ->expectsOutputToContain('Same ID with different emails: 2')
            ->expectsOutputToContain('Email maps to more than one player: 3')
            ->expectsOutputToContain('Would replace an existing recovery email: 1')
            ->expectsOutputToContain('Players with a route afterwards: 4')
            ->expectsOutputToContain('Players with no route afterwards: 6')
            ->expectsOutputToContain('Row 2: would apply '.$mask)
            ->expectsOutputToContain('Dry run only. No accounts were changed.')
            ->doesntExpectOutputToContain('alpha82@example.com')
            ->doesntExpectOutputToContain('Alpha82@Example.com')
            ->doesntExpectOutputToContain('taken@example.com')
            ->doesntExpectOutputToContain('keeper85@vellarleague.com')
            ->assertSuccessful();

        $this->assertNull($player->fresh()->contact_email);
        $this->assertSame('vellar82@vellarleague.com', $player->fresh()->email);
        $this->assertSame('taken@example.com', $holder->fresh()->contact_email);
        $this->assertSame('other89@example.com', $existing->fresh()->contact_email);
        $this->assertSame(0, PlayerEmailAudit::query()->count());
        Mail::assertNothingSent();

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->expectsOutputToContain('Rows applied: 1')
            ->expectsOutputToContain('Row 2: would apply '.$mask)
            ->doesntExpectOutputToContain('alpha82@example.com')
            ->assertSuccessful();

        $player->refresh();
        $this->assertSame('alpha82@example.com', $player->contact_email);
        $this->assertSame('vellar82@vellarleague.com', $player->email);
        $this->assertSame('other89@example.com', $existing->fresh()->contact_email);

        $audit = PlayerEmailAudit::query()->sole();
        $this->assertSame($player->id, $audit->player_id);
        $this->assertSame($admin->id, $audit->admin_id);
        $this->assertSame('import', $audit->source);
        $this->assertSame('Manager A', $audit->collected_by);
        $this->assertSame('(none)', $audit->old_email_masked);
        $this->assertSame($mask, $audit->new_email_masked);
        $this->assertSame(hash_file('sha256', $path), $audit->source_sha256);
        $this->assertStringNotContainsString('alpha82', $audit->new_email_masked);
        $this->assertStringNotContainsString('example.com', $audit->new_email_masked);
        Mail::assertNothingSent();
    }

    public function test_reapplying_the_same_file_changes_nothing(): void
    {
        Mail::fake();
        $admin = $this->admin();
        $player = $this->player('82');
        $path = $this->outsideFile('.csv', "vellar_id,E-mail,collected_by\n82,  Alpha82@Example.com  , Manager A\n");

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->expectsOutputToContain('Rows applied: 1')
            ->assertSuccessful();

        $this->assertSame('alpha82@example.com', $player->fresh()->contact_email);
        $this->assertSame(1, PlayerEmailAudit::query()->count());

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->expectsOutputToContain('Rows to apply: 0')
            ->expectsOutputToContain('Rows unchanged: 1')
            ->expectsOutputToContain('Rows applied: 0')
            ->assertSuccessful();

        $this->assertSame('alpha82@example.com', $player->fresh()->contact_email);
        $this->assertSame(1, PlayerEmailAudit::query()->count());
        Mail::assertNothingSent();
    }

    public function test_replace_existing_is_skipped_unless_requested(): void
    {
        Mail::fake();
        $admin = $this->admin();
        $player = $this->player('82', ['contact_email' => 'old82@example.com']);
        $path = $this->outsideFile('.csv', "Vellar ID,Email\n82,new82@example.com\n");

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->expectsOutputToContain('Would replace an existing recovery email: 1')
            ->expectsOutputToContain('Rows applied: 0')
            ->assertSuccessful();

        $this->assertSame('old82@example.com', $player->fresh()->contact_email);
        $this->assertSame(0, PlayerEmailAudit::query()->count());

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
            '--replace-existing' => true,
        ])->expectsOutputToContain('Rows applied: 1')
            ->assertSuccessful();

        $this->assertSame('new82@example.com', $player->fresh()->contact_email);
        $this->assertSame(EmailMask::mask('old82@example.com'), PlayerEmailAudit::query()->sole()->old_email_masked);
        $this->assertSame(EmailMask::mask('new82@example.com'), PlayerEmailAudit::query()->sole()->new_email_masked);
        Mail::assertNothingSent();
    }

    public function test_apply_refuses_a_non_admin_and_a_workbook(): void
    {
        Mail::fake();
        $player = $this->player('82');
        $path = $this->outsideFile('.csv', "Vellar ID,Email\n82,alpha82@example.com\n");
        $workbook = $this->outsideFile('.xlsx', 'not a workbook');

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $player->id,
            '--apply' => true,
        ])->expectsOutputToContain('--admin-id must be an admin account.')
            ->assertFailed();

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--apply' => true,
        ])->expectsOutputToContain('--admin-id is required.')
            ->assertFailed();

        $this->artisan('players:import-emails', [
            'file' => $workbook,
            '--apply' => true,
            '--admin-id' => $this->admin()->id,
        ])->expectsOutputToContain('must be a CSV file')
            ->assertFailed();

        $this->assertNull($player->fresh()->contact_email);
        $this->assertSame(0, PlayerEmailAudit::query()->count());
        Mail::assertNothingSent();
    }

    public function test_import_file_inside_the_repository_is_refused(): void
    {
        $admin = $this->admin();
        $player = $this->player('82');
        $path = base_path('storage/framework/testing/player-emails.csv');
        file_put_contents($path, "Vellar ID,Email\n82,alpha82@example.com\n");

        try {
            $this->artisan('players:import-emails', [
                'file' => $path,
                '--admin-id' => $admin->id,
                '--apply' => true,
            ])->expectsOutputToContain('must live outside the repository')
                ->assertFailed();
        } finally {
            @unlink($path);
        }

        $this->assertNull($player->fresh()->contact_email);
        $this->assertSame(0, PlayerEmailAudit::query()->count());
    }

    public function test_only_with_route_retires_imported_players_and_leaves_the_rest(): void
    {
        $admin = $this->admin();
        $imported = $this->player('82');
        $left = $this->player('83');
        $path = $this->outsideFile('.csv', "Vellar ID,Email\n82,alpha82@example.com\n");

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->assertSuccessful();

        config(['nuvra.retire_shared_passwords' => true]);
        $this->artisan('players:retire-default-passwords', [
            '--force' => true,
            '--only-with-route' => true,
        ])->expectsOutputToContain('Retired: 1')
            ->expectsOutputToContain('Left on the shared password: 1')
            ->assertSuccessful();

        $this->assertTrue($imported->fresh()->password_reset_required);
        $this->assertFalse(Hash::check($this->sharedPassword(), $imported->fresh()->password));
        $this->assertTrue(Hash::check($this->sharedPassword(), $left->fresh()->password));
        $this->assertFalse($left->fresh()->password_reset_required);
    }

    public function test_placeholder_domain_is_still_not_a_delivery_route(): void
    {
        $player = $this->player('82', ['contact_email' => 'vellar82@vellarleague.com']);

        $this->assertTrue(PlayerContact::isPlaceholderEmail($player->contact_email));
        $this->assertFalse(PlayerContact::canReceiveEmail($player));

        config(['nuvra.retire_shared_passwords' => true]);
        $this->artisan('players:retire-default-passwords', ['--force' => true])
            ->expectsOutputToContain('Default password and no delivery channel: 1')
            ->assertFailed();

        $this->assertTrue(Hash::check($this->sharedPassword(), $player->fresh()->password));
        $this->assertFalse($player->fresh()->password_reset_required);
    }

    public function test_profile_refuses_contact_email_while_the_shared_password_or_reset_flag_is_set(): void
    {
        Mail::fake();
        $shared = $this->player('82');
        $reset = $this->player('83', [
            'password' => 'unique-pass-1',
            'password_reset_required' => true,
            'contact_email' => 'kept83@example.com',
        ]);

        $this->actingAs($shared, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken Over',
            'contact_email' => 'attacker82@example.com',
            'current_password' => $this->sharedPassword(),
        ])->assertStatus(422);

        $this->actingAs($reset, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Taken Over',
            'contact_email' => 'attacker83@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertStatus(401);

        $this->assertNull($shared->fresh()->contact_email);
        $this->assertSame('Player 82', $shared->fresh()->name);
        $this->assertSame('kept83@example.com', $reset->fresh()->contact_email);
        $this->assertSame('vellar82@vellarleague.com', $shared->fresh()->email);
        $this->assertSame(0, PlayerEmailAudit::query()->count());
        Mail::assertNothingSent();
    }

    public function test_profile_change_requires_the_current_password_and_notifies_the_old_inbox(): void
    {
        Mail::fake();
        $player = $this->player('82', [
            'password' => 'unique-pass-1',
            'contact_email' => 'kept82@example.com',
        ]);
        $empty = $this->player('83', ['password' => 'unique-pass-1']);

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Still Named',
            'contact_email' => 'next82@example.com',
        ])->assertStatus(422);

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Still Named',
            'contact_email' => 'next82@example.com',
            'current_password' => 'wrong-pass',
        ])->assertStatus(422);

        $this->assertSame('kept82@example.com', $player->fresh()->contact_email);
        $this->assertSame(0, PlayerEmailAudit::query()->count());
        Mail::assertNothingSent();

        $this->actingAs($player, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Renamed',
            'contact_email' => '  Next82@Example.com ',
            'current_password' => 'unique-pass-1',
        ])->assertOk();

        $player->refresh();
        $this->assertSame('Renamed', $player->name);
        $this->assertSame('next82@example.com', $player->contact_email);
        $this->assertSame('vellar82@vellarleague.com', $player->email);

        $audit = PlayerEmailAudit::query()->sole();
        $this->assertSame('profile', $audit->source);
        $this->assertNull($audit->admin_id);
        $this->assertSame(EmailMask::mask('kept82@example.com'), $audit->old_email_masked);
        $this->assertSame(EmailMask::mask('next82@example.com'), $audit->new_email_masked);
        $this->assertStringNotContainsString('next82', $audit->new_email_masked);

        Mail::assertSent(RecoveryEmailChanged::class, function (RecoveryEmailChanged $mail) {
            return $mail->hasTo('kept82@example.com');
        });

        $this->actingAs($empty, 'sanctum')->putJson('/api/community/profile', [
            'name' => 'Player 83',
            'contact_email' => 'first83@example.com',
            'current_password' => 'unique-pass-1',
        ])->assertOk();

        $this->assertSame('first83@example.com', $empty->fresh()->contact_email);
        Mail::assertSent(RecoveryEmailChanged::class, 1);
    }

    public function test_clear_unimported_emails_counts_only_and_apply_clears_them(): void
    {
        $admin = $this->admin();
        $imported = $this->player('82');
        $stray = $this->player('83', ['contact_email' => 'stray83@example.com']);
        $path = $this->outsideFile('.csv', "Vellar ID,Email\n82,alpha82@example.com\n");

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->assertSuccessful();

        $this->artisan('players:clear-unimported-emails')
            ->expectsOutputToContain('Recovery emails not set by the import: 1')
            ->expectsOutputToContain('Dry run only. No accounts were changed.')
            ->doesntExpectOutputToContain('stray83@example.com')
            ->assertSuccessful();

        $this->assertSame('stray83@example.com', $stray->fresh()->contact_email);
        $this->assertSame('alpha82@example.com', $imported->fresh()->contact_email);

        $this->artisan('players:clear-unimported-emails', [
            '--apply' => true,
            '--admin-id' => $admin->id,
        ])->expectsOutputToContain('Cleared: 1')
            ->doesntExpectOutputToContain('stray83@example.com')
            ->assertSuccessful();

        $this->assertNull($stray->fresh()->contact_email);
        $this->assertSame('alpha82@example.com', $imported->fresh()->contact_email);
        $this->assertSame('clear', PlayerEmailAudit::query()->where('player_id', $stray->id)->first()->source);
        $this->assertSame(EmailMask::mask('stray83@example.com'), PlayerEmailAudit::query()->where('player_id', $stray->id)->first()->old_email_masked);
    }

    private function outsideFile(string $suffix, string $contents): string
    {
        $path = tempnam(sys_get_temp_dir(), 'nuvra');
        $target = $path.$suffix;
        rename($path, $target);
        file_put_contents($target, $contents);

        return $target;
    }

    private function player(string $number, array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'name' => 'Player '.$number,
            'email' => 'vellar'.$number.'@vellarleague.com',
            'vellar_id' => 'VELLAR '.$number,
            'role' => 'player',
            'status' => 'active',
            'password' => $this->sharedPassword(),
            'phone' => null,
        ], $overrides));
    }

    private function admin(): User
    {
        return User::factory()->create([
            'name' => 'League Admin',
            'email' => 'admin-'.Str::random(6).'@example.com',
            'role' => 'admin',
            'status' => 'active',
            'password' => 'admin-unique-pass',
        ]);
    }
}
