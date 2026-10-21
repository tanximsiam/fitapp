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
        $this->allowed($request);
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
        $this->allowed($request);
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

    /** A summary of the week behind the health score and the one thing that would raise it most. */
    public function coach(Request $request): JsonResponse
    {
        $this->allowed($request);
        $data = $request->validate([
            'score' => ['required', 'integer', 'between:0,100'],
            'label' => ['required', 'string', 'max:20'],
            'focus' => ['nullable', 'in:activity,steps,sleep,regularity,heart,hydration'],
            'week' => ['required', 'array'],
            'today' => ['nullable', 'array'],
        ]);
        $answer = $this->ask(<<<'TXT'
            The person has a health score out of 100 for the past week, built from activity, steps, sleep length,
            sleep regularity, resting heart rate and water. "week" has the numbers behind it; "focus" is the part
            with the most room to grow; "today" is what happened so far today.
            Write a summary: 1-2 sentences (max 200 characters) that recognise what went well this week in plain words, warm and specific to the habits, with no numbers.
            Write a tip: the one thing to do next that would raise the score most, starting with a verb,
            max 110 characters, using today's numbers when they help (for example what is left today).
            Never state the score number (the app shows it) and never name parts of the score
            (no "activity score" or "sleep score").
            JSON: {"summary": "...", "tip": "..."}
            TXT, $data, 400);

        return filled($answer['tip'] ?? null) && filled($answer['summary'] ?? null)
            ? response()->json(['data' => ['summary' => Str::limit((string) $answer['summary'], 240), 'tip' => Str::limit((string) $answer['tip'], 140)]])
            : $this->unavailable();
    }

    /** A short personal line for the day, shown as the daily reminder on Home. */
    public function quote(Request $request): JsonResponse
    {
        $this->allowed($request);
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'part_of_day' => ['nullable', 'in:morning,afternoon,evening,night'],
            'focus' => ['nullable', 'string', 'max:20'],
            'recent' => ['nullable', 'array'],
        ]);
        $answer = $this->ask(<<<'TXT'
            Write today's short encouraging line for this person: an original sentence of your own (not a famous
            quote), max 90 characters, warm and specific to their recent days and the area they are working on.
            No emojis, no hashtags, no quotation marks.
            JSON: {"quote": "..."}
            TXT, $data, 200);

        return filled($answer['quote'] ?? null)
            ? response()->json(['data' => ['quote' => Str::limit(trim((string) $answer['quote'], " \"'“”"), 120)]])
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

    /** Without an account the demo routes answer only when the server allows it (AI_DEMO). */
    private function allowed(Request $request): void
    {
        abort_unless($request->user() || config('services.groq.demo'), 404);
    }

    private function unavailable(): JsonResponse
    {
        return response()->json(['message' => 'Personal insights are not available right now.'], 503);
    }
}
