<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Local calendar dates (`date`) are stored as Y-m-d strings exactly as the source reported them.
 * Instants (`*_at`) are stored in UTC.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('key', 64);
            $table->string('name', 100);
            $table->timestamp('last_ingested_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'key']);
        });

        Schema::create('activity_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10);
            $table->unsignedInteger('steps')->nullable();
            $table->unsignedInteger('distance_m')->nullable();
            $table->unsignedInteger('active_kcal')->nullable();
            $table->unsignedSmallInteger('active_minutes')->nullable();
            $table->timestamps();
            $table->unique(['data_source_id', 'date']);
            $table->index(['user_id', 'date']);
        });

        Schema::create('sleep_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10); // local date the sleep ended (wake-up day)
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->unsignedSmallInteger('deep_min')->nullable();
            $table->unsignedSmallInteger('light_min')->nullable();
            $table->unsignedSmallInteger('rem_min')->nullable();
            $table->unsignedSmallInteger('awake_min')->nullable();
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamps();
            $table->unique(['data_source_id', 'date']);
            $table->index(['user_id', 'date']);
        });

        Schema::create('heart_rate_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10);
            $table->unsignedTinyInteger('resting_bpm');
            $table->timestamps();
            $table->unique(['data_source_id', 'date']);
            $table->index(['user_id', 'date']);
        });

        Schema::create('heart_rate_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10); // local date of measured_at in the upload's timezone
            $table->dateTime('measured_at');
            $table->unsignedTinyInteger('bpm');
            $table->timestamps();
            $table->unique(['data_source_id', 'measured_at']);
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('heart_rate_samples');
        Schema::dropIfExists('heart_rate_days');
        Schema::dropIfExists('sleep_sessions');
        Schema::dropIfExists('activity_days');
        Schema::dropIfExists('data_sources');
    }
};
