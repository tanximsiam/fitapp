<?php

namespace App\Http\Controllers\Journal;

use App\Http\Requests\FitnessRangeRequest;
use App\Http\Requests\MoodEntryRequest;
use App\Http\Resources\JournalResources;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MoodEntryController extends JournalController
{
    public function index(FitnessRangeRequest $request): JsonResponse
    {
        $user = $request->user();
        $entries = $user->moodEntries()->with('emotions')->whereBetween('date', $this->range($request))->orderBy('recorded_at')->get();

        return response()->json(['data' => $entries->map(fn ($e) => JournalResources::mood($e, $user->timezone))]);
    }

    public function store(MoodEntryRequest $request): JsonResponse
    {
        $entry = DB::transaction(function () use ($request) {
            $entry = $request->user()->moodEntries()->create($this->fields($request));
            $entry->setEmotions($request->validated('emotions') ?? []);

            return $entry;
        });

        return response()->json(['data' => JournalResources::mood($entry, $request->user()->timezone)], 201);
    }

    public function update(MoodEntryRequest $request, int $id): JsonResponse
    {
        $entry = $request->user()->moodEntries()->findOrFail($id);
        $this->assertFresh($request, $entry);
        DB::transaction(function () use ($request, $entry) {
            $entry->update($this->fields($request));
            $entry->setEmotions($request->validated('emotions') ?? []);
        });

        return response()->json(['data' => JournalResources::mood($entry, $request->user()->timezone)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->moodEntries()->findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function fields(MoodEntryRequest $request): array
    {
        [$date, $at] = $this->instant($request->validated('recorded_at'));

        return ['date' => $date, 'recorded_at' => $at] + collect($request->validated())
            ->only(['mood', 'energy', 'stress', 'note'])
            ->all() + ['energy' => null, 'stress' => null, 'note' => null];
    }
}
