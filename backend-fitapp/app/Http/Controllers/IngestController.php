<?php

namespace App\Http\Controllers;

use App\Http\Requests\IngestRequest;
use App\Http\Resources\DataSourceResource;
use App\Services\IngestionService;
use Illuminate\Http\JsonResponse;

class IngestController extends Controller
{
    public function __invoke(IngestRequest $request, IngestionService $ingestion): JsonResponse
    {
        $result = $ingestion->ingest($request->user(), $request->validated());

        return response()->json(['data' => [
            'source' => new DataSourceResource($result['source']),
            'received' => $result['received'],
        ]]);
    }
}
