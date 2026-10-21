<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Watch data. Each record belongs to exactly one data source, and the source belongs to the user, so
 * ownership has a single path (user → source → record) and deleting either cascades.
 * Records are keyed by (source, local date) or (source, instant): a re-upload replaces, never adds.
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
            $table->string('device', 100)->nullable();
            $table->timestamp('last_ingested_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'key']);
        });

        // What a source says it can measure (one row per measurement).
        Schema::create('data_source_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('measurement', 32);
            $table->unique(['data_source_id', 'measurement']);
        });

        Schema::create('activity_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('steps')->nullable();
            $table->unsignedInteger('distance_m')->nullable();
            $table->unsignedInteger('active_kcal')->nullable();
            $table->unsignedSmallInteger('active_minutes')->nullable();
            $table->timestamps();
            $table->unique(['data_source_id', 'date']);
        });

        Schema::create('sleep_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->date('date'); // local date the sleep ended (wake-up day)
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->unsignedSmallInteger('deep_min')->nullable();
            $table->unsignedSmallInteger('light_min')->nullable();
            $table->unsignedSmallInteger('rem_min')->nullable();
            $table->unsignedSmallInteger('awake_min')->nullable();
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamps();
            $table->unique(['data_source_id', 'date']);
        });

        Schema::create('workouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('type', 32);
            $table->unsignedInteger('active_kcal')->nullable();
            $table->unsignedInteger('distance_m')->nullable();
            $table->unsignedTinyInteger('avg_bpm')->nullable();
            $table->unsignedTinyInteger('max_bpm')->nullable();
            $table->timestamps();
            $table->unique(['data_source_id', 'start_at']);
            $table->index(['data_source_id', 'date']);
        });

        Schema::create('heart_rate_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedTinyInteger('resting_bpm');
            $table->timestamps();
            $table->unique(['data_source_id', 'date']);
        });

        Schema::create('heart_rate_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            // Local date in the upload's timezone; kept because the stored instant is UTC and the offset is not.
            $table->date('date');
            $table->dateTime('measured_at');
            $table->unsignedTinyInteger('bpm');
            $table->timestamps();
            $table->unique(['data_source_id', 'measured_at']);
            $table->index(['data_source_id', 'date']);
        });

        // Stress (0–100) and blood oxygen (SpO₂ %) readings.
        Schema::create('body_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 16);
            $table->date('date');
            $table->dateTime('measured_at');
            $table->unsignedTinyInteger('value');
            $table->timestamps();
            $table->unique(['data_source_id', 'kind', 'measured_at']);
            $table->index(['data_source_id', 'kind', 'date']);
        });

        Schema::create('skin_temperature_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->decimal('deviation_c', 4, 2); // relative to the wearer's baseline, not body temperature
            $table->timestamps();
            $table->unique(['data_source_id', 'date']);
        });
    }

    public function down(): void
    {
        foreach (['skin_temperature_days', 'body_samples', 'heart_rate_samples', 'heart_rate_days', 'workouts', 'sleep_sessions', 'activity_days', 'data_source_measurements', 'data_sources'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
