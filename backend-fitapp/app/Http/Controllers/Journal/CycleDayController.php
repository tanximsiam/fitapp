<?php

namespace App\Http\Controllers\Journal;

use App\Http\Requests\CycleDayRequest;
use App\Http\Requests\FitnessRangeRequest;
use App\Http\Resources\JournalResources;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Cycle tracking is stored per calendar day; one record per user and date. */
class CycleDayController extends JournalController
{
    public function index(FitnessRangeRequest $request): JsonResponse
    {
        $days = $request->user()->cycleDays()->with('symptoms')->whereBetween('date', $this->range($request))->orderBy('date')->get();

        return response()->json(['data' => $days->map(fn ($d) => JournalResources::cycleDay($d))]);
    }

    public function upsert(CycleDayRequest $request, string $date): JsonResponse
    {
        $day = $request->user()->cycleDays()->firstOrNew(['date' => $date]);
        if ($day->exists) {
            $this->assertFresh($request, $day);
        }
        DB::transaction(function () use ($request, $day) {
            $day->fill(['flow' => $request->validated('flow'), 'note' => $request->validated('note')]);
            $day->touch();
            $day->setSymptoms($request->validated('symptoms') ?? []);
        });

        return response()->json(['data' => JournalResources::cycleDay($day)], $day->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, string $date): JsonResponse
    {
        $request->user()->cycleDays()->where('date', $date)->firstOrFail()->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
