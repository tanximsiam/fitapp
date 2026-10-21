<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private const NEW_USER = ['name' => 'Ana', 'email' => 'ana@example.test', 'password' => 'long-enough', 'timezone' => 'Asia/Dhaka', 'device_name' => 'phone'];

    public function test_register_creates_the_account_and_a_working_token(): void
    {
        $res = $this->postJson('/api/register', self::NEW_USER)
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'ana@example.test')
            ->assertJsonPath('data.user.timezone', 'Asia/Dhaka')
            ->assertJsonMissingPath('data.user.password');

        $this->withToken($res->json('data.token'))->getJson('/api/user')->assertOk()->assertJsonPath('data.name', 'Ana');
        $this->postJson('/api/login', ['email' => 'ana@example.test', 'password' => 'long-enough'])->assertOk();
    }

    public function test_register_validates_input(): void
    {
        User::factory()->create(['email' => 'ana@example.test']);

        $this->postJson('/api/register', [...self::NEW_USER, 'password' => 'short', 'timezone' => 'Mars/Base'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password', 'timezone']);
    }

    public function test_register_can_be_turned_off(): void
    {
        config(['auth.registration' => false]);

        $this->postJson('/api/register', self::NEW_USER)->assertForbidden();
        $this->getJson('/api/auth/providers')->assertOk()->assertJsonPath('data.registration', false);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_providers_lists_google_only_when_configured(): void
    {
        $this->getJson('/api/auth/providers')->assertOk()->assertExactJson(['data' => ['registration' => true, 'google' => false]]);

        config(['services.google.client_id' => 'id', 'services.google.client_secret' => 'secret']);
        $this->getJson('/api/auth/providers')->assertJsonPath('data.google', true);
    }
}
