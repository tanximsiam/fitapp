<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_sources', function (Blueprint $table) {
            $table->string('device', 100)->nullable();
            // Measurements the source declares it can provide.
            $table->json('measurements')->nullable();
        });

        Schema::create('workouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10);
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('type', 32);
            $table->unsignedInteger('active_kcal')->nullable();
            $table->unsignedInteger('distance_m')->nullable();
            $table->unsignedTinyInteger('avg_bpm')->nullable();
            $table->unsignedTinyInteger('max_bpm')->nullable();
            $table->timestamps();
            $table->unique(['data_source_id', 'start_at']);
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workouts');
        Schema::table('data_sources', function (Blueprint $table) {
            $table->dropColumn(['device', 'measurements']);
        });
    }
};
