<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spec_id')->constrained()->cascadeOnDelete();
            $table->string('name', 64);
            $table->string('label');
            $table->enum('type', ['string']);
            $table->boolean('is_required')->default(true);
            $table->unsignedInteger('sort_order');
            $table->timestamp('created_at');

            $table->unique(['spec_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parameters');
    }
};
