<?php

namespace App\Http\Controllers\Journal;

use App\Http\Controllers\Controller;
use App\Http\Requests\FitnessRangeRequest;
use App\Services\FitnessQueryService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/** Shared helpers for manually entered records. Every query is scoped to the signed-in user. */
abstract class JournalController extends Controller
{
    /** @return array{0: string, 1: string} */
    protected function range(FitnessRangeRequest $request): array
    {
        return $request->filled('from')
            ? [$request->validated('from'), $request->validated('to')]
            : FitnessQueryService::defaultRange($request->user());
    }

    /** Local date as experienced (the offset the client sent) and the UTC instant to store. */
    protected function instant(string $iso): array
    {
        $at = CarbonImmutable::parse($iso);

        return [$at->toDateString(), $at->utc()->format('Y-m-d H:i:s')];
    }

    /** Refuses an edit made from a stale copy, so one device cannot silently overwrite another's change. */
    protected function assertFresh(Request $request, Model $model): void
    {
        $seen = $request->input('updated_at');
        if ($seen !== null && $seen !== $model->updated_at?->toIso8601ZuluString()) {
            abort(409, 'This entry changed since you opened it. Reload it and try again.');
        }
    }
}
