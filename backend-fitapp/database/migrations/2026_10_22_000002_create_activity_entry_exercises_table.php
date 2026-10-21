<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The exercises of a logged workout: what, how many sets and reps, for how long.
        Schema::create('activity_entry_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_entry_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->unsignedTinyInteger('sets');
            $table->unsignedSmallInteger('reps')->nullable();
            $table->unsignedSmallInteger('duration_min')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_entry_exercises');
    }
};
