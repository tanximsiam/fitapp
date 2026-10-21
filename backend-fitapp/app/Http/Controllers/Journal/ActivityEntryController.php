<?php

namespace App\Http\Controllers\Journal;

use App\Http\Requests\ActivityEntryRequest;
use App\Http\Requests\FitnessRangeRequest;
use App\Http\Resources\JournalResources;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityEntryController extends JournalController
{
    public function index(FitnessRangeRequest $request): JsonResponse
    {
        $user = $request->user();
        $entries = $user->activityEntries()->whereBetween('date', $this->range($request))->orderBy('started_at')->get();

        return response()->json(['data' => $entries->map(fn ($a) => JournalResources::activity($a, $user->timezone))]);
    }

    public function store(ActivityEntryRequest $request): JsonResponse
    {
        $entry = $request->user()->activityEntries()->create($this->fields($request));

        return response()->json(['data' => JournalResources::activity($entry, $request->user()->timezone)], 201);
    }

    public function update(ActivityEntryRequest $request, int $id): JsonResponse
    {
        $entry = $request->user()->activityEntries()->findOrFail($id);
        $this->assertFresh($request, $entry);
        $entry->update($this->fields($request));

        return response()->json(['data' => JournalResources::activity($entry, $request->user()->timezone)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->activityEntries()->findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function fields(ActivityEntryRequest $request): array
    {
        [$date, $at] = $this->instant($request->validated('started_at'));
        $energy = $request->validated('energy_kcal');

        return [
            'date' => $date,
            'started_at' => $at,
            'activity_type' => $request->validated('activity_type'),
            'duration_min' => $request->validated('duration_min'),
            'energy_kcal' => $energy,
            'energy_source' => $energy === null ? null : $request->validated('energy_source'),
        ];
    }
}
