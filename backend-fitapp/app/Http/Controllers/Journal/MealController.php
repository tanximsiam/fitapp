<?php

namespace App\Http\Controllers\Journal;

use App\Http\Requests\FitnessRangeRequest;
use App\Http\Requests\MealRequest;
use App\Http\Resources\JournalResources;
use App\Models\Meal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MealController extends JournalController
{
    public function index(FitnessRangeRequest $request): JsonResponse
    {
        $user = $request->user();
        $meals = $user->meals()->with('items')->whereBetween('date', $this->range($request))->orderBy('eaten_at')->get();

        return response()->json(['data' => $meals->map(fn ($m) => JournalResources::meal($m, $user->timezone))]);
    }

    public function store(MealRequest $request): JsonResponse
    {
        $meal = DB::transaction(fn () => $this->save($request, $request->user()->meals()->make()));

        return response()->json(['data' => JournalResources::meal($meal, $request->user()->timezone)], 201);
    }

    public function update(MealRequest $request, int $id): JsonResponse
    {
        $meal = $request->user()->meals()->findOrFail($id);
        $this->assertFresh($request, $meal);
        $meal = DB::transaction(fn () => $this->save($request, $meal));

        return response()->json(['data' => JournalResources::meal($meal, $request->user()->timezone)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->meals()->findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    /** Saves the meal and replaces its items with the submitted list. */
    private function save(MealRequest $request, Meal $meal): Meal
    {
        [$date, $at] = $this->instant($request->validated('eaten_at'));
        $meal->fill(['date' => $date, 'eaten_at' => $at, 'meal_type' => $request->validated('meal_type'), 'note' => $request->validated('note')]);
        $meal->touch();
        $meal->items()->delete();
        $meal->items()->createMany($request->validated('items'));

        return $meal->load('items');
    }
}
