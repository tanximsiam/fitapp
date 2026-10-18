<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FitnessController;
use App\Http\Controllers\IngestController;
use App\Http\Controllers\IngestTokenController;
use App\Http\Controllers\Journal\CycleDayController;
use App\Http\Controllers\Journal\HydrationController;
use App\Http\Controllers\Journal\MealController;
use App\Http\Controllers\Journal\MoodEntryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ZeppController;
use App\Http\Controllers\ZeppWebhookController;
use Illuminate\Support\Facades\Route;

// Contract: docs/openapi.yaml

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

// Frontend app tokens.
Route::middleware(['auth:sanctum', 'abilities:app'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [UserController::class, 'show']);
    Route::patch('/user', [UserController::class, 'update']);

    Route::get('/fitness/days', [FitnessController::class, 'days']);
    Route::get('/fitness/heart-rate/{date}', [FitnessController::class, 'heartRate'])->where('date', '\d{4}-\d{2}-\d{2}');
    Route::get('/fitness/status', [FitnessController::class, 'status']);

    Route::get('/ingest-tokens', [IngestTokenController::class, 'index']);
    Route::post('/ingest-tokens', [IngestTokenController::class, 'store']);
    Route::delete('/ingest-tokens/{id}', [IngestTokenController::class, 'destroy'])->whereNumber('id');

    // Manually entered records (never written by ingestion).
    Route::prefix('journal')->group(function () {
        foreach (['mood' => MoodEntryController::class, 'meals' => MealController::class, 'hydration' => HydrationController::class] as $path => $controller) {
            Route::get("/$path", [$controller, 'index']);
            Route::post("/$path", [$controller, 'store']);
            Route::put("/$path/{id}", [$controller, 'update'])->whereNumber('id');
            Route::delete("/$path/{id}", [$controller, 'destroy'])->whereNumber('id');
        }
        Route::get('/cycle-days', [CycleDayController::class, 'index']);
        Route::put('/cycle-days/{date}', [CycleDayController::class, 'upsert'])->where('date', '\d{4}-\d{2}-\d{2}');
        Route::delete('/cycle-days/{date}', [CycleDayController::class, 'destroy'])->where('date', '\d{4}-\d{2}-\d{2}');
    });
});

// Zepp Open Platform: account connection (app tokens) and public OAuth/webhook endpoints.
Route::middleware(['auth:sanctum', 'abilities:app'])->prefix('zepp')->group(function () {
    Route::get('/status', [ZeppController::class, 'status']);
    Route::post('/authorize', [ZeppController::class, 'authorize']);
    Route::delete('/connection', [ZeppController::class, 'disconnect']);
    Route::post('/backfill', [ZeppController::class, 'backfill'])->middleware('throttle:5,60');
});
Route::get('/zepp/callback', [ZeppController::class, 'callback'])->middleware('throttle:20,1');
Route::post('/zepp/webhook/{token}', ZeppWebhookController::class)->middleware('throttle:300,1');

// External providers and bridges.
Route::post('/ingest', IngestController::class)->middleware(['auth:sanctum', 'abilities:ingest', 'throttle:60,1']);
