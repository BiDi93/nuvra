<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function test_unauthenticated_api_request_returns_401_json_instead_of_redirect(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401)
                 ->assertJson([
                     'message' => 'Unauthenticated.',
                 ]);
    }

    public function test_unauthenticated_api_request_without_accept_json_header_returns_401_json(): void
    {
        // Even without Accept: application/json, it should return JSON because it's an /api/* route
        $response = $this->get('/api/user');

        $response->assertStatus(401);
        
        // Check if it's JSON
        $this->assertTrue(str_contains($response->headers->get('Content-Type'), 'application/json'));
        
        $response->assertJson([
            'message' => 'Unauthenticated.',
        ]);
    }
}
