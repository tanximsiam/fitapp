<?php

namespace App\Ai;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The AI service's only door to the model: Groq's OpenAI-compatible chat API with a JSON reply.
 * Off until GROQ_API_KEY is set. Identical requests are answered from the cache, so the same
 * day's data never costs a second call.
 */
class Groq
{
    private const URL = 'https://api.groq.com/openai/v1/chat/completions';

    public static function configured(): bool
    {
        return filled(config('services.groq.key'));
    }

    /**
     * The model's JSON answer to `$data` under `$instructions`, or null when the service is off,
     * unreachable, or replies with something that is not JSON.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>|null
     */
    public function json(string $instructions, array $data, int $maxTokens = 700): ?array
    {
        if (! self::configured()) {
            return null;
        }
        $model = config('services.groq.model');
        $key = 'ai:'.sha1($model.$instructions.json_encode($data));

        if (is_array($cached = Cache::get($key))) {
            return $cached;
        }

        try {
            $response = Http::withToken(config('services.groq.key'))
                ->timeout(25)
                ->post(self::URL, [
                    'model' => $model,
                    'response_format' => ['type' => 'json_object'],
                    'reasoning_effort' => 'low',
                    'temperature' => 0.4,
                    'max_completion_tokens' => $maxTokens,
                    'messages' => [
                        ['role' => 'system', 'content' => $instructions],
                        ['role' => 'user', 'content' => json_encode($data, JSON_UNESCAPED_UNICODE)],
                    ],
                ]);
            $answer = json_decode((string) $response->json('choices.0.message.content'), true);
        } catch (Throwable $e) {
            Log::warning('AI request failed', ['error' => $e->getMessage()]);

            return null;
        }

        if ($response->failed() || ! is_array($answer)) {
            Log::warning('AI reply unusable', ['status' => $response->status()]);

            return null;
        }
        Cache::put($key, $answer, now()->addHours(12));

        return $answer;
    }
}
