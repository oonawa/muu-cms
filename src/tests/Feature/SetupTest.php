<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_ユーザーが0件のときセットアップ画面にリダイレクトされる(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/setup');
    }

    public function test_セットアップ画面が表示される(): void
    {
        $response = $this->get('/setup');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Setup/index'));
    }

    public function test_ユーザー名のみで管理者ユーザーを作成できる(): void
    {
        $response = $this->post('/setup/user', [
            'name' => 'テスト管理者',
        ]);

        $response->assertRedirect('/setup');

        $this->assertDatabaseHas('users', ['name' => 'テスト管理者']);
        $this->assertDatabaseCount('user_recovery_credentials', 0);
        $this->assertAuthenticated();
    }

    public function test_リカバリ情報を登録できる(): void
    {
        $user = User::create(['name' => 'テスト管理者']);
        $this->actingAs($user);

        $response = $this->post('/setup/recovery', [
            'email' => 'admin@example.com',
            'password' => 'securepassword123',
            'password_confirmation' => 'securepassword123',
        ]);

        $response->assertRedirect('/setup');

        $this->assertDatabaseHas('user_recovery_credentials', [
            'user_id' => $user->id,
            'email' => 'admin@example.com',
        ]);
    }

    public function test_リカバリ情報をスキップして完了できる(): void
    {
        $user = User::create(['name' => 'テスト管理者']);
        $this->actingAs($user);

        $response = $this->post('/setup/complete');

        $response->assertRedirect('/');

        $this->assertDatabaseCount('user_recovery_credentials', 0);
    }

    public function test_ユーザーが存在する場合セットアップ画面にアクセスできない(): void
    {
        User::create(['name' => '既存ユーザー']);

        $response = $this->get('/setup');

        $response->assertStatus(403);
    }
}
