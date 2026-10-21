<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FitnessController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\IngestController;
use App\Http\Controllers\Journal\CycleDayController;
use App\Http\Controllers\Journal\HydrationController;
use App\Http\Controllers\Journal\MealController;
use App\Http\Controllers\Journal\MoodEntryController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Contract: docs/openapi.yaml

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::get('/auth/providers', [AuthController::class, 'providers']);

// Sign in with Google: browser redirects, then a one-time code for a token (see GoogleAuthController).
Route::prefix('auth/google')->middleware('throttle:20,1')->group(function () {
    Route::get('/redirect', [GoogleAuthController::class, 'redirect']);
    Route::get('/callback', [GoogleAuthController::class, 'callback']);
    Route::post('/token', [GoogleAuthController::class, 'token']);
});

// Frontend app tokens.
Route::middleware(['auth:sanctum', 'abilities:app'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [UserController::class, 'show']);
    Route::patch('/user', [UserController::class, 'update']);

    Route::get('/fitness/days', [FitnessController::class, 'days']);
    Route::get('/fitness/heart-rate/{date}', [FitnessController::class, 'heartRate'])->where('date', '\d{4}-\d{2}-\d{2}');
    Route::get('/fitness/readings/{kind}/{date}', [FitnessController::class, 'readings'])->whereIn('kind', ['stress', 'spo2'])->where('date', '\d{4}-\d{2}-\d{2}');
    Route::get('/fitness/status', [FitnessController::class, 'status']);
    // The phone uploads what it reads from the watch, Health Connect or Apple Health.
    Route::post('/ingest', IngestController::class)->middleware('throttle:60,1');

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
