<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Records the person enters. Watch uploads never write here. Lists are child rows, not JSON. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mood_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date'); // local date as the person experienced it
            $table->dateTime('recorded_at');
            $table->unsignedTinyInteger('mood');
            $table->unsignedTinyInteger('energy')->nullable();
            $table->unsignedTinyInteger('stress')->nullable(); // self-reported, never watch-derived
            $table->text('note')->nullable(); // encrypted at rest
            $table->timestamps();
            $table->index(['user_id', 'date']);
        });

        Schema::create('mood_entry_emotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mood_entry_id')->constrained()->cascadeOnDelete();
            $table->string('emotion', 32);
            $table->unique(['mood_entry_id', 'emotion']);
        });

        Schema::create('meals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->dateTime('eaten_at');
            $table->string('meal_type', 16);
            $table->text('note')->nullable(); // encrypted at rest
            $table->timestamps();
            $table->index(['user_id', 'date']);
        });

        Schema::create('meal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->decimal('quantity', 10, 2)->nullable();
            $table->string('unit', 20)->nullable();
            $table->decimal('energy_kcal', 8, 1)->nullable();
            $table->decimal('protein_g', 7, 1)->nullable();
            $table->decimal('carbs_g', 7, 1)->nullable();
            $table->decimal('fat_g', 7, 1)->nullable();
            // "database": calculated from FitApp's food list; "entered": typed by the person; null: no values.
            $table->string('nutrition_source', 16)->nullable();
            $table->timestamps();
        });

        Schema::create('hydration_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->dateTime('recorded_at');
            $table->unsignedSmallInteger('volume_ml');
            $table->timestamps();
            $table->index(['user_id', 'date']);
        });

        Schema::create('cycle_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('flow', 16)->nullable();
            $table->text('note')->nullable(); // encrypted at rest
            $table->timestamps();
            $table->unique(['user_id', 'date']);
        });

        Schema::create('cycle_day_symptoms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_day_id')->constrained()->cascadeOnDelete();
            $table->string('symptom', 32);
            $table->unique(['cycle_day_id', 'symptom']);
        });
    }

    public function down(): void
    {
        foreach (['cycle_day_symptoms', 'cycle_days', 'hydration_entries', 'meal_items', 'meals', 'mood_entry_emotions', 'mood_entries'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
