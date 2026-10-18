<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zepp_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('zepp_user_id', 64)->unique();
            // Encrypted by the model casts.
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('status', 16); // connected | revoked | error
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('last_event_at')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->string('last_error', 255)->nullable();
            $table->timestamps();
        });

        // Webhook deliveries can repeat; processed activity files are remembered by summaryId.
        Schema::create('zepp_processed_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zepp_connection_id')->constrained()->cascadeOnDelete();
            $table->string('summary_id', 128);
            $table->timestamps();
            $table->unique(['zepp_connection_id', 'summary_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zepp_processed_files');
        Schema::dropIfExists('zepp_connections');
    }
};
