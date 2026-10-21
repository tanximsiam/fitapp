<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.groq.key' => 'test-key', 'services.groq.model' => 'openai/gpt-oss-20b']);
        Sanctum::actingAs(User::factory()->create(), ['app']);
    }

    private function fakeReply(array $json): void
    {
        Http::fake(['api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => json_encode($json)]]]])]);
    }

    public function test_score_tip_comes_from_the_model(): void
    {
        $this->fakeReply(['tip' => 'Walk 20 minutes after dinner on three days.']);

        $this->postJson('/api/ai/score-tip', ['score' => 64, 'focus' => 'activity', 'week' => ['active_minutes' => 95, 'sleep_hours' => 7.2]])
            ->assertOk()
            ->assertJsonPath('data.tip', 'Walk 20 minutes after dinner on three days.');

        Http::assertSent(fn (Request $r) => $r['model'] === 'openai/gpt-oss-20b' && $r['response_format']['type'] === 'json_object' && $r->hasHeader('Authorization', 'Bearer test-key'));
    }

    public function test_feedback_never_sends_notes_to_the_model(): void
    {
        $this->fakeReply(['feedback' => 'Nice, a 30-minute jog. Drink some water too.']);

        $this->postJson('/api/ai/feedback', ['kind' => 'activity', 'entry' => ['type' => 'jogging', 'minutes' => 30, 'note' => 'private diary text'], 'today' => ['steps' => 4000]])
            ->assertOk()
            ->assertJsonPath('data.feedback', 'Nice, a 30-minute jog. Drink some water too.');

        Http::assertSent(fn (Request $r) => ! str_contains($r['messages'][1]['content'], 'private diary text'));
    }

    public function test_insights_are_cleaned_and_capped(): void
    {
        $this->fakeReply(['insights' => [
            ['area' => 'sleep', 'title' => 'Better sleep, better mood', 'body' => 'On nights over 7 h your mood averaged 4.1.', 'action' => 'Keep a 23:00 bedtime.'],
            ['area' => 'nonsense', 'title' => 'Water and energy', 'body' => 'Days with 2 L of water had more energy.'],
            ['title' => '', 'body' => 'dropped'],
            ['area' => 'activity', 'title' => 'A', 'body' => 'B'],
            ['area' => 'activity', 'title' => 'C', 'body' => 'D'],
        ]]);

        $this->postJson('/api/ai/insights', ['summary' => ['days' => [['date' => '2026-10-20', 'steps' => 9000]]]])
            ->assertOk()
            ->assertJsonCount(3, 'data.insights')
            ->assertJsonPath('data.insights.1.area', 'general')
            ->assertJsonPath('data.insights.1.action', null);
    }

    public function test_the_same_question_is_answered_from_the_cache(): void
    {
        $this->fakeReply(['tip' => 'Go to bed 30 minutes earlier.']);
        $body = ['score' => 70, 'focus' => 'sleep', 'week' => ['sleep_hours' => 6.2]];

        $this->postJson('/api/ai/score-tip', $body)->assertOk();
        $this->postJson('/api/ai/score-tip', $body)->assertOk();
        Http::assertSentCount(1);
    }

    public function test_off_without_a_key_or_when_the_model_fails(): void
    {
        config(['services.groq.key' => null]);
        $this->postJson('/api/ai/score-tip', ['score' => 70, 'week' => ['sleep_hours' => 6]])->assertStatus(503);

        config(['services.groq.key' => 'test-key']);
        Http::fake(['api.groq.com/*' => Http::response(['error' => 'down'], 500)]);
        $this->postJson('/api/ai/feedback', ['kind' => 'mood', 'entry' => ['mood' => 4]])->assertStatus(503);
    }

    public function test_input_is_validated_and_needs_an_app_token(): void
    {
        $this->postJson('/api/ai/feedback', ['kind' => 'gossip', 'entry' => 'x'])->assertUnprocessable()->assertJsonValidationErrors(['kind', 'entry']);

        Sanctum::actingAs(User::factory()->create(), []);
        $this->postJson('/api/ai/insights', ['summary' => []])->assertForbidden();
    }
}
