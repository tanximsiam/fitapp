<?php

namespace App\Http\Controllers;

use App\Ai\Groq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Personal text from the AI service: insights over recent days, a short reaction to a new entry,
 * and a tip for raising the health score. The app sends aggregates and categories only; free-text
 * notes are stripped here as well, so they never reach the model.
 * Every answer is advice about habits, never a diagnosis. When the service is off or fails the API
 * answers 503 and the app shows its own wording instead.
 */
class AiController extends Controller
{
    private const RULES = <<<'TXT'
        You are the coach inside FitApp, a personal health tracker. Write in plain, warm, encouraging English
        for one person about their own records. Use only the numbers given; never invent data. Talk about
        habits, not medicine: no diagnoses, no conditions, no medication or supplement advice, no promises.
        If something looks worrying, suggest talking to a doctor without naming a condition. Keep sentences
        short. Refer to days exactly as the data names them (like "Sun, Oct 18" or "today"), never as ISO dates.
        Do not mention scores' internal parts or formulas. Reply with JSON only, in the shape asked.
        TXT;

    /** Most private fields a client might send by mistake; dropped before anything reaches the model. */
    private const PRIVATE = ['note', 'notes', 'name', 'email'];

    public function __construct(private Groq $groq) {}

    public function insights(Request $request): JsonResponse
    {
        $data = $request->validate(['summary' => ['required', 'array']]);
        $answer = $this->ask(<<<'TXT'
            From the summary of recent days, give up to 3 insights that connect different areas (for example
            sleep and mood, activity and stress, water and energy). Each has a short title (max 6 words), a body
            of 1-2 sentences that cites the numbers, and one practical next step.
            JSON: {"insights": [{"area": "activity|sleep|heart|stress|mood|food|hydration|cycle|general", "title": "...", "body": "...", "action": "..."}]}
            TXT, $data['summary'], 900);

        $insights = collect($answer['insights'] ?? [])
            ->filter(fn ($i) => is_array($i) && filled($i['title'] ?? null) && filled($i['body'] ?? null))
            ->take(3)
            ->map(fn ($i) => [
                'area' => in_array($i['area'] ?? '', ['activity', 'sleep', 'heart', 'stress', 'mood', 'food', 'hydration', 'cycle'], true) ? $i['area'] : 'general',
                'title' => Str::limit((string) $i['title'], 60),
                'body' => Str::limit((string) $i['body'], 280),
                'action' => filled($i['action'] ?? null) ? Str::limit((string) $i['action'], 160) : null,
            ])
            ->values();

        return $insights->isEmpty() ? $this->unavailable() : response()->json(['data' => ['insights' => $insights]]);
    }

    public function feedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kind' => ['required', 'in:mood,meal,drink,activity'],
            'entry' => ['required', 'array'],
            'today' => ['nullable', 'array'],
        ]);
        $answer = $this->ask(<<<'TXT'
            The person just logged the entry below. React in 1-2 sentences (max 220 characters): acknowledge it,
            relate it to today's numbers when that adds something, and give one small, specific suggestion.
            JSON: {"feedback": "..."}
            TXT, $data, 300);

        return filled($answer['feedback'] ?? null)
            ? response()->json(['data' => ['feedback' => Str::limit((string) $answer['feedback'], 260)]])
            : $this->unavailable();
    }

    public function scoreTip(Request $request): JsonResponse
    {
        $data = $request->validate([
            'score' => ['required', 'integer', 'between:0,100'],
            'focus' => ['nullable', 'in:activity,sleep'],
            'week' => ['required', 'array'],
        ]);
        $answer = $this->ask(<<<'TXT'
            The person has a health score out of 100. Suggest the one thing that would raise it most this week,
            based on the focus area and the week's numbers. One sentence, max 110 characters, starting with a verb.
            Say "your score" if needed; never name parts of it (no "activity score" or "sleep score").
            JSON: {"tip": "..."}
            TXT, $data, 200);

        return filled($answer['tip'] ?? null)
            ? response()->json(['data' => ['tip' => Str::limit((string) $answer['tip'], 140)]])
            : $this->unavailable();
    }

    /** @param array<string, mixed> $data */
    private function ask(string $task, array $data, int $maxTokens): ?array
    {
        return $this->groq->json(self::RULES."\n\n".$task, $this->withoutPrivate($data), $maxTokens);
    }

    private function withoutPrivate(array $data): array
    {
        $clean = [];
        foreach ($data as $key => $value) {
            if (is_string($key) && in_array(strtolower($key), self::PRIVATE, true)) {
                continue;
            }
            $clean[$key] = is_array($value) ? $this->withoutPrivate($value) : $value;
        }

        return $clean;
    }

    private function unavailable(): JsonResponse
    {
        return response()->json(['message' => 'Personal insights are not available right now.'], 503);
    }
}
