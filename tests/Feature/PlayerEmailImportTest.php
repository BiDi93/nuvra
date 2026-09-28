<?php

namespace Tests\Feature;

use App\Models\PlayerEmailAudit;
use App\Models\User;
use App\Support\EmailMask;
use App\Support\PlayerContact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;
use ZipArchive;

class PlayerEmailImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_csv_import_validates_each_category_and_dry_run_writes_nothing(): void
    {
        $admin = $this->admin();
        $player = $this->player('82');
        $this->player('84');
        $this->player('85');
        $this->player('86');
        $this->player('87');
        $this->player('88', ['contact_email' => 'kept88@example.com']);
        $this->player('90', ['contact_email' => 'taken@example.com']);
        $this->player('91', [
            'role' => 'admin',
            'email' => 'vellar91@vellarleague.com',
            'name' => 'Not A Player',
        ]);

        $path = $this->outsideFile('.csv', implode("\n", [
            'Vellar ID, Email',
            '  82 ,  Alpha82@Example.com',
            '84, not-an-email',
            '85, keeper85@vellarleague.com',
            '86, player86@nuvra.com',
            '999, missing@example.com',
            '87, taken@example.com',
            '91, staff91@example.com',
            '88, Kept88@Example.com',
            '',
        ]));

        $before = $player->contact_email;

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
        ])->expectsOutputToContain('Invalid email: 1')
            ->expectsOutputToContain('Placeholder email: 2')
            ->expectsOutputToContain('Unknown Vellar ID: 1')
            ->expectsOutputToContain('Not a player: 1')
            ->expectsOutputToContain('Email already held: 1')
            ->expectsOutputToContain('Unchanged: 1')
            ->expectsOutputToContain('Would update: 1')
            ->expectsOutputToContain('Row 3: invalid email')
            ->expectsOutputToContain('Row 4: placeholder email')
            ->expectsOutputToContain('Row 5: placeholder email')
            ->expectsOutputToContain('Row 6: unknown Vellar ID')
            ->expectsOutputToContain('Row 7: email already held')
            ->expectsOutputToContain('Row 8: not a player')
            ->expectsOutputToContain('Row 9: unchanged')
            ->expectsOutputToContain('Dry run only. No accounts were changed.')
            ->doesntExpectOutputToContain('Alpha82@Example.com')
            ->doesntExpectOutputToContain('alpha82@example.com')
            ->doesntExpectOutputToContain('taken@example.com')
            ->doesntExpectOutputToContain('keeper85@vellarleague.com')
            ->assertSuccessful();

        $this->assertSame($before, $player->fresh()->contact_email);
        $this->assertSame(0, PlayerEmailAudit::query()->count());
        $this->assertSame('vellar82@vellarleague.com', $player->fresh()->email);

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->expectsOutputToContain('Updated: 1')
            ->expectsOutputToContain('Updated 1 player account(s).')
            ->doesntExpectOutputToContain('alpha82@example.com')
            ->assertSuccessful();

        $player->refresh();
        $this->assertSame('alpha82@example.com', $player->contact_email);
        $this->assertSame('vellar82@vellarleague.com', $player->email);
        $this->assertSame('kept88@example.com', User::where('vellar_id', 'VELLAR 88')->first()->contact_email);

        $audit = PlayerEmailAudit::query()->first();
        $this->assertNotNull($audit);
        $this->assertSame($player->id, $audit->player_id);
        $this->assertSame($admin->id, $audit->admin_id);
        $this->assertSame('(none)', $audit->old_email_masked);
        $this->assertSame(EmailMask::mask('alpha82@example.com'), $audit->new_email_masked);
        $this->assertStringNotContainsString('alpha82', $audit->new_email_masked);
        $this->assertStringNotContainsString('example.com', $audit->new_email_masked);
        $this->assertSame(hash_file('sha256', $path), $audit->source_sha256);
        $this->assertNotNull($audit->created_at);
        $this->assertSame(1, PlayerEmailAudit::query()->count());

        $this->postJson('/api/community/login', [
            'vellar_id' => '82',
            'password' => $this->sharedPassword(),
        ])->assertOk();

        $this->artisan('players:contact-audit')
            ->expectsOutputToContain('Players with a usable recovery email: 3')
            ->assertSuccessful();
    }

    public function test_xlsx_import_applies_and_deduplicates_within_the_file(): void
    {
        $admin = $this->admin();
        $first = $this->player('82');
        $second = $this->player('83');
        $third = $this->player('84');
        $fourth = $this->player('85');

        $path = $this->outsideFile('.xlsx', '');
        $this->writeXlsx($path, [
            ['vellar_id', 'E-mail'],
            ['82', 'alpha82@example.com'],
            ['83', 'alpha82@example.com'],
            ['84', 'first84@example.com'],
            ['84', 'second84@example.com'],
            ['85', 'repeat85@example.com'],
            ['85', 'repeat85@example.com'],
        ]);

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->expectsOutputToContain('Duplicate in file: 5')
            ->expectsOutputToContain('Updated: 1')
            ->expectsOutputToContain('Row 2: duplicate in file')
            ->expectsOutputToContain('Row 3: duplicate in file')
            ->expectsOutputToContain('Row 4: duplicate in file')
            ->expectsOutputToContain('Row 5: duplicate in file')
            ->expectsOutputToContain('Row 7: duplicate in file')
            ->doesntExpectOutputToContain('repeat85@example.com')
            ->assertSuccessful();

        $this->assertNull($first->fresh()->contact_email);
        $this->assertNull($second->fresh()->contact_email);
        $this->assertNull($third->fresh()->contact_email);
        $this->assertSame('repeat85@example.com', $fourth->fresh()->contact_email);
        $this->assertSame('vellar85@vellarleague.com', $fourth->fresh()->email);

        $audit = PlayerEmailAudit::query()->sole();
        $this->assertSame($fourth->id, $audit->player_id);
        $this->assertSame($admin->id, $audit->admin_id);
        $this->assertSame(hash_file('sha256', $path), $audit->source_sha256);
        $this->assertSame(EmailMask::mask('repeat85@example.com'), $audit->new_email_masked);
    }

    public function test_non_admin_and_missing_admin_id_are_refused(): void
    {
        $player = $this->player('82');
        $path = $this->outsideFile('.csv', "Vellar ID,Email\n82,alpha82@example.com\n");

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $player->id,
        ])->expectsOutputToContain('--admin-id must be an admin account.')
            ->assertFailed();

        $this->artisan('players:import-emails', [
            'file' => $path,
        ])->expectsOutputToContain('--admin-id is required.')
            ->assertFailed();

        $this->assertNull($player->fresh()->contact_email);
        $this->assertSame(0, PlayerEmailAudit::query()->count());
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

    public function test_retire_command_retires_imported_players_only(): void
    {
        $admin = $this->admin();
        $first = $this->player('82');
        $second = $this->player('83');
        $unique = $this->player('84', ['password' => 'already-unique']);

        $path = $this->outsideFile('.csv', "Vellar ID,Email\n82,alpha82@example.com\n83,beta83@example.com\n");

        $this->artisan('players:import-emails', [
            'file' => $path,
            '--admin-id' => $admin->id,
            '--apply' => true,
        ])->assertSuccessful();

        config(['nuvra.retire_shared_passwords' => true]);
        $this->artisan('players:retire-default-passwords', ['--force' => true])
            ->expectsOutputToContain('Default password and a usable recovery email: 2')
            ->assertSuccessful();

        $this->assertTrue($first->fresh()->password_reset_required);
        $this->assertFalse(Hash::check($this->sharedPassword(), $first->fresh()->password));
        $this->assertTrue($second->fresh()->password_reset_required);
        $this->assertFalse(Hash::check($this->sharedPassword(), $second->fresh()->password));
        $this->assertTrue(Hash::check('already-unique', $unique->fresh()->password));
        $this->assertFalse($unique->fresh()->password_reset_required);
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

        $this->artisan('players:contact-audit')
            ->expectsOutputToContain('Players with a usable recovery email: 0')
            ->assertSuccessful();
    }

    private function outsideFile(string $suffix, string $contents): string
    {
        $path = tempnam(sys_get_temp_dir(), 'nuvra');
        $target = $path.$suffix;
        rename($path, $target);

        if ($contents !== '') {
            file_put_contents($target, $contents);
        }

        return $target;
    }

    /**
     * @param  list<list<string>>  $rows
     */
    private function writeXlsx(string $path, array $rows): void
    {
        $shared = [];
        $sheetRows = '';
        $number = 1;

        foreach ($rows as $row) {
            $cells = '';
            $column = 0;

            foreach ($row as $value) {
                $letter = chr(ord('A') + $column);

                if ($number > 1 && $column === 0 && ctype_digit($value)) {
                    $cells .= '<c r="'.$letter.$number.'"><v>'.$value.'</v></c>';
                } else {
                    $index = count($shared);
                    $shared[] = $value;
                    $cells .= '<c r="'.$letter.$number.'" t="s"><v>'.$index.'</v></c>';
                }

                $column++;
            }

            $sheetRows .= '<row r="'.$number.'">'.$cells.'</row>';
            $number++;
        }

        $sharedXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="'.count($shared).'" uniqueCount="'.count($shared).'">';

        foreach ($shared as $value) {
            $sharedXml .= '<si><t>'.htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8').'</t></si>';
        }

        $sharedXml .= '</sst>';

        $sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
            .$sheetRows
            .'</sheetData></worksheet>';

        $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Players" sheetId="1" r:id="rId1"/></sheets></workbook>';

        $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
            .'</Relationships>';

        $types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
            .'</Types>';

        $rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', $types);
        $zip->addFromString('_rels/.rels', $rootRels);
        $zip->addFromString('xl/workbook.xml', $workbook);
        $zip->addFromString('xl/_rels/workbook.xml.rels', $rels);
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet);
        $zip->addFromString('xl/sharedStrings.xml', $sharedXml);
        $zip->close();
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
