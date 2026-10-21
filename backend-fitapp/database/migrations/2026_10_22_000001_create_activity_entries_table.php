<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Activities the person logs by hand (chores, a jog, a gym session). Kept apart from watch totals.
        Schema::create('activity_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->dateTime('started_at');
            $table->string('activity_type', 16);
            $table->unsignedSmallInteger('duration_min');
            $table->unsignedSmallInteger('energy_kcal')->nullable();
            // "estimated": calculated by the app from the activity and duration; "entered": typed by the person.
            $table->string('energy_source', 16)->nullable();
            $table->timestamps();
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_entries');
    }
};
