<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Tokens limited to the `ingest` ability, for bridges that upload data on the user's behalf. */
class IngestTokenController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens()->get()
            ->filter(fn ($t) => $t->can('ingest') && ! $t->can('app'))
            ->values()
            ->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'last_used_at' => $t->last_used_at?->toIso8601ZuluString(),
                'created_at' => $t->created_at?->toIso8601ZuluString(),
            ]);

        return response()->json(['data' => $tokens]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:100']]);
        $token = $request->user()->createToken($data['name'], ['ingest']);

        // The plain-text token is only ever returned here.
        return response()->json(['data' => ['id' => $token->accessToken->id, 'name' => $data['name'], 'token' => $token->plainTextToken]], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $deleted = $request->user()->tokens()->whereKey($id)->delete();

        return $deleted ? response()->json(['message' => 'Token revoked.']) : response()->json(['message' => 'Token not found.'], 404);
    }
}
