<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Watch-estimated stress (0–100), blood oxygen (SpO₂ %) and nightly skin-temperature deviation.
 * Watch stress is a separate measurement from the stress users report in mood check-ins.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('body_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 16); // stress | spo2
            $table->string('date', 10);
            $table->dateTime('measured_at');
            $table->unsignedTinyInteger('value');
            $table->timestamps();
            $table->unique(['data_source_id', 'kind', 'measured_at']);
            $table->index(['user_id', 'kind', 'date']);
        });

        Schema::create('skin_temperature_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_source_id')->constrained()->cascadeOnDelete();
            $table->string('date', 10);
            $table->decimal('deviation_c', 4, 2); // relative to the wearer's baseline, not body temperature
            $table->timestamps();
            $table->unique(['data_source_id', 'date']);
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skin_temperature_days');
        Schema::dropIfExists('body_samples');
    }
};
