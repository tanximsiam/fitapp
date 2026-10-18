<?php

namespace App\Http\Controllers;

use App\Http\Requests\FitnessRangeRequest;
use App\Http\Resources\DataSourceResource;
use App\Services\FitnessQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FitnessController extends Controller
{
    public function __construct(private FitnessQueryService $query) {}

    public function days(FitnessRangeRequest $request): JsonResponse
    {
        $user = $request->user();
        [$from, $to] = $request->filled('from')
            ? [$request->validated('from'), $request->validated('to')]
            : FitnessQueryService::defaultRange($user);

        return response()->json([
            'data' => $this->query->days($user, $from, $to),
            'meta' => ['from' => $from, 'to' => $to, 'timezone' => $user->timezone],
        ]);
    }

    public function heartRate(Request $request, string $date): JsonResponse
    {
        return response()->json([
            'data' => ['date' => $date, 'samples' => $this->query->heartRateSamples($request->user(), $date)],
            'meta' => ['timezone' => $request->user()->timezone],
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $latest = $this->query->latestDates($user);
        $sources = $user->dataSources()->orderByDesc('last_ingested_at')->get()
            ->each(fn ($s) => $s->latest_date = $latest->get($s->id));

        return response()->json(['data' => [
            'sources' => DataSourceResource::collection($sources),
            'last_ingested_at' => $sources->max('last_ingested_at')?->toIso8601ZuluString(),
            'latest_date' => $latest->max(),
            'timezone' => $user->timezone,
        ]]);
    }
}
