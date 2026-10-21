<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private const RETURN = 'fitapp://auth/google';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.client_id' => 'client-123', 'services.google.client_secret' => 'secret']);
    }

    /** Start the flow and come back from Google with an ID token carrying these claims. */
    private function signIn(array $claims = [], string $return = self::RETURN): string
    {
        $claims = [
            'iss' => 'https://accounts.google.com', 'aud' => 'client-123', 'exp' => time() + 600,
            'sub' => 'g-1', 'email' => 'ana@example.test', 'email_verified' => true, 'name' => 'Ana', ...$claims,
        ];
        $idToken = 'h.'.rtrim(strtr(base64_encode(json_encode($claims)), '+/', '-_'), '=').'.sig';
        Http::fake(['oauth2.googleapis.com/token' => Http::response(['id_token' => $idToken])]);

        $location = $this->get('/api/auth/google/redirect?return='.urlencode($return))->assertRedirect()->headers->get('Location');
        $this->assertStringStartsWith('https://accounts.google.com/o/oauth2/v2/auth?', $location);
        parse_str(parse_url($location, PHP_URL_QUERY), $query);
        $this->assertSame('client-123', $query['client_id']);

        return $this->get('/api/auth/google/callback?code=auth-code&state='.$query['state'])->assertRedirect()->headers->get('Location');
    }

    private function codeFrom(string $location): string
    {
        parse_str(parse_url($location, PHP_URL_QUERY), $query);

        return $query['code'];
    }

    public function test_new_google_user_gets_an_account_and_a_token(): void
    {
        $location = $this->signIn();
        $this->assertStringStartsWith(self::RETURN.'?code=', $location);

        $token = $this->postJson('/api/auth/google/token', ['code' => $this->codeFrom($location)])
            ->assertOk()
            ->assertJsonPath('data.user.email', 'ana@example.test')
            ->json('data.token');
        $this->withToken($token)->getJson('/api/user')->assertOk()->assertJsonPath('data.name', 'Ana');
        $this->assertDatabaseHas('users', ['email' => 'ana@example.test', 'google_id' => 'g-1']);
    }

    public function test_existing_account_with_the_same_email_is_linked(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.test']);

        $this->postJson('/api/auth/google/token', ['code' => $this->codeFrom($this->signIn())])->assertJsonPath('data.user.id', $user->id);
        $this->assertSame('g-1', $user->fresh()->google_id);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_code_works_once(): void
    {
        $code = $this->codeFrom($this->signIn());

        $this->postJson('/api/auth/google/token', ['code' => $code])->assertOk();
        $this->postJson('/api/auth/google/token', ['code' => $code])->assertUnauthorized();
    }

    public function test_unverified_email_is_refused(): void
    {
        $this->assertStringContainsString('error=', $this->signIn(['email_verified' => false]));
        $this->assertDatabaseCount('users', 0);
    }

    public function test_token_for_another_client_is_refused(): void
    {
        $this->assertStringContainsString('error=', $this->signIn(['aud' => 'someone-else']));
        $this->assertDatabaseCount('users', 0);
    }

    public function test_closed_registration_refuses_new_google_accounts(): void
    {
        config(['auth.registration' => false]);

        $this->assertStringContainsString('error=', $this->signIn());
        $this->assertDatabaseCount('users', 0);
    }

    public function test_returns_only_to_the_app_or_an_allowed_origin(): void
    {
        config(['cors.allowed_origins' => ['http://localhost:5174']]);

        $this->get('/api/auth/google/redirect?return='.urlencode('https://evil.example/steal'))->assertStatus(422);
        $this->assertStringStartsWith('http://localhost:5174/auth/google?code=', $this->signIn([], 'http://localhost:5174/auth/google'));
    }

    public function test_unknown_state_is_rejected(): void
    {
        $this->get('/api/auth/google/callback?code=x&state=forged')->assertStatus(400);
    }

    public function test_everything_is_off_until_configured(): void
    {
        config(['services.google.client_id' => null]);

        $this->get('/api/auth/google/redirect?return='.urlencode(self::RETURN))->assertNotFound();
    }
}
