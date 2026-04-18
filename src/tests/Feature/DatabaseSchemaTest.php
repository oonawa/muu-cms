<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_全テーブルが作成される(): void
    {
        $tables = [
            'users',
            'passkeys',
            'user_recovery_credentials',
            'spaces',
            'space_users',
            'blueprints',
            'specs',
            'parameters',
            'parameter_constraints',
            'contents',
        ];

        foreach ($tables as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "テーブル {$table} が存在しません"
            );
        }
    }
}
