<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parameter_constraints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parameter_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('max_length');
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parameter_constraints');
    }
};
