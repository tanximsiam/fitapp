<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FitnessController;
use App\Http\Controllers\IngestController;
use App\Http\Controllers\IngestTokenController;
use App\Http\Controllers\UserController;
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
});

// External providers and bridges.
Route::post('/ingest', IngestController::class)->middleware(['auth:sanctum', 'abilities:ingest', 'throttle:60,1']);
