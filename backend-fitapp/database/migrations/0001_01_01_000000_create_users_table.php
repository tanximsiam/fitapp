<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per person. Everything here depends on the user alone, so goals, trackers and the
        // wearable are plain columns rather than JSON or extra tables.
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            // Google's stable account id ("sub"), set on the first Google sign-in.
            $table->string('google_id')->nullable()->unique();
            // IANA zone used to resolve "today" and default ranges.
            $table->string('timezone', 64)->default('UTC');
            $table->date('birth_date')->nullable();
            // Set when the person finishes the app's setup screens.
            $table->timestamp('onboarded_at')->nullable();
            $table->string('wearable_brand', 16)->nullable();
            $table->string('wearable_model', 100)->nullable();

            $table->unsignedInteger('goal_steps')->default(8000);
            $table->unsignedInteger('goal_active_kcal')->default(450);
            $table->unsignedInteger('goal_distance_m')->default(6000);
            $table->unsignedSmallInteger('goal_sleep_min')->default(450);
            $table->unsignedSmallInteger('goal_water_ml')->default(2000);

            $table->boolean('track_mood')->default(true);
            $table->boolean('track_food')->default(true);
            $table->boolean('track_hydration')->default(true);
            $table->boolean('track_cycle')->default(false);
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
