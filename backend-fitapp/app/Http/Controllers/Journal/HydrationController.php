<?php

namespace App\Http\Controllers\Journal;

use App\Http\Requests\FitnessRangeRequest;
use App\Http\Requests\HydrationRequest;
use App\Http\Resources\JournalResources;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HydrationController extends JournalController
{
    public function index(FitnessRangeRequest $request): JsonResponse
    {
        $user = $request->user();
        $entries = $user->hydrationEntries()->whereBetween('date', $this->range($request))->orderBy('recorded_at')->get();

        return response()->json(['data' => $entries->map(fn ($h) => JournalResources::hydration($h, $user->timezone))]);
    }

    public function store(HydrationRequest $request): JsonResponse
    {
        $entry = $request->user()->hydrationEntries()->create($this->fields($request));

        return response()->json(['data' => JournalResources::hydration($entry, $request->user()->timezone)], 201);
    }

    public function update(HydrationRequest $request, int $id): JsonResponse
    {
        $entry = $request->user()->hydrationEntries()->findOrFail($id);
        $this->assertFresh($request, $entry);
        $entry->update($this->fields($request));

        return response()->json(['data' => JournalResources::hydration($entry, $request->user()->timezone)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->hydrationEntries()->findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function fields(HydrationRequest $request): array
    {
        [$date, $at] = $this->instant($request->validated('recorded_at'));

        return ['date' => $date, 'recorded_at' => $at, 'volume_ml' => $request->validated('volume_ml')];
    }
}
