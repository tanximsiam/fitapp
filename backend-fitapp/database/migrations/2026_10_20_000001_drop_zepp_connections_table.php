<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * FitApp no longer integrates a third-party vendor cloud; data arrives through its own ingestion API.
 * Drops the table the removed integration created, for databases that already have it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('zepp_connections');
    }

    public function down(): void
    {
        // Intentionally empty: the integration and its table are gone.
    }
};
