<?php

use App\Services\PlayerRegistrationService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$path = getenv('RACE_DB');
$email = getenv('RACE_EMAIL');
$name = getenv('RACE_NAME');
$password = getenv('RACE_PASSWORD');

if (! is_string($path) || $path === '' || ! is_string($email) || ! is_string($password)) {
    fwrite(STDERR, "missing race input\n");
    exit(1);
}

config([
    'database.default' => 'sqlite',
    'database.connections.sqlite.database' => $path,
    'database.connections.sqlite.busy_timeout' => 5000,
    'database.connections.sqlite.journal_mode' => 'wal',
    'database.connections.sqlite.transaction_mode' => 'IMMEDIATE',
    'cache.default' => 'array',
    'mail.default' => 'array',
    'queue.default' => 'sync',
]);

Illuminate\Support\Facades\DB::purge('sqlite');
Illuminate\Support\Facades\DB::reconnect('sqlite');

$request = Request::create('/api/community/register', 'POST', [
    'name' => is_string($name) && $name !== '' ? $name : 'Racer',
    'email' => $email,
    'password' => $password,
    'password_confirmation' => $password,
]);
$request->headers->set('Accept', 'application/json');

try {
    $response = $app->make(PlayerRegistrationService::class)->register($request);
    $app->terminate();
    $code = $response->getStatusCode();
    fwrite(STDOUT, (string) $code);
    exit($code === 200 ? 0 : 1);
} catch (Throwable $e) {
    fwrite(STDERR, $e::class."\n");
    exit(1);
}
