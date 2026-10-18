<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Manually entered personal records. They are never written by ingestion, so watch uploads cannot
 * overwrite them. Notes are stored encrypted (see the models' casts).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('preferences')->nullable();
        });

        Schema::create('mood_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10);
            $table->dateTime('recorded_at');
            $table->unsignedTinyInteger('mood');
            $table->unsignedTinyInteger('energy')->nullable();
            $table->unsignedTinyInteger('stress')->nullable(); // self-reported, never watch-derived
            $table->json('emotions')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'date']);
        });

        Schema::create('meals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10);
            $table->dateTime('eaten_at');
            $table->string('meal_type', 16);
            $table->text('note')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'date']);
        });

        Schema::create('meal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->decimal('quantity', 10, 2)->nullable();
            $table->string('unit', 20)->nullable();
            // Only values the user typed in; FitApp never looks up or estimates nutrition.
            $table->decimal('energy_kcal', 8, 1)->nullable();
            $table->decimal('protein_g', 7, 1)->nullable();
            $table->decimal('carbs_g', 7, 1)->nullable();
            $table->decimal('fat_g', 7, 1)->nullable();
            $table->timestamps();
        });

        Schema::create('hydration_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10);
            $table->dateTime('recorded_at');
            $table->unsignedSmallInteger('volume_ml');
            $table->timestamps();
            $table->index(['user_id', 'date']);
        });

        Schema::create('cycle_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10);
            $table->string('flow', 16)->nullable();
            $table->json('symptoms')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cycle_days');
        Schema::dropIfExists('hydration_entries');
        Schema::dropIfExists('meal_items');
        Schema::dropIfExists('meals');
        Schema::dropIfExists('mood_entries');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('preferences');
        });
    }
};
