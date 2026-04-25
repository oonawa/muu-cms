<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parameters', function (Blueprint $table) {
            $table->enum('type', ['string', 'text'])->change();
        });
    }

    public function down(): void
    {
        Schema::table('parameters', function (Blueprint $table) {
            $table->enum('type', ['string'])->change();
        });
    }
};
