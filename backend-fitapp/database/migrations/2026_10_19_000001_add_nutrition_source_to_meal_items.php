<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meal_items', function (Blueprint $table) {
            // "database": calculated from FitApp's food list; "entered": typed by the user; null: no values.
            $table->string('nutrition_source', 16)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('meal_items', function (Blueprint $table) {
            $table->dropColumn('nutrition_source');
        });
    }
};
