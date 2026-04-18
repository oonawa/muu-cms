<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_recovery_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_recovery_credentials');
    }
};
