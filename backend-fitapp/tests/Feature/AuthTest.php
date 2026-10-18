<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_user_and_token_that_authenticates(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass']);

        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass'])
            ->assertOk()
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonMissingPath('data.user.password');

        $this->withToken($login->json('data.token'))
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }

    public function test_wrong_password_is_rejected(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'nope'])
            ->assertUnauthorized()
            ->assertJsonStructure(['message']);
    }

    public function test_login_validates_input(): void
    {
        $this->postJson('/api/login', ['email' => 'not-an-email'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_user_endpoint_requires_token_even_without_json_accept_header(): void
    {
        $this->get('/api/user')->assertUnauthorized();
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass']);
        $token = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass'])->json('data.token');

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_create_user_command(): void
    {
        $this->artisan('fitapp:create-user', ['email' => 'me@example.test', '--name' => 'Me'])
            ->expectsQuestion('Password (min 8 characters)', 'long-enough')
            ->assertSuccessful();

        $this->postJson('/api/login', ['email' => 'me@example.test', 'password' => 'long-enough'])->assertOk();
    }
}
