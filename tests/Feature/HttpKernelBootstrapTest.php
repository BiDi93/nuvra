<?php

namespace Tests\Feature;

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Facade;
use Tests\TestCase;

class HttpKernelBootstrapTest extends TestCase
{
    public function test_http_kernel_can_be_created_before_bootstrap_without_a_server_error(): void
    {
        $original = Application::getInstance();

        /** @var Application $app */
        $app = require Application::inferBasePath().'/bootstrap/app.php';

        try {
            $this->assertFalse($app->hasBeenBootstrapped());

            $kernel = $app->make(Kernel::class);

            $this->assertFalse($app->hasBeenBootstrapped());

            $request = Request::create('/', 'GET');
            $response = $kernel->handle($request);

            $this->assertNotSame(500, $response->getStatusCode());

            $kernel->terminate($request, $response);
        } finally {
            Application::setInstance($original);
            Facade::setFacadeApplication($original);
        }
    }
}
