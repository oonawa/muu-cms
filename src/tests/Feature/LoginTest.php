<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserRecoveryCredential;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create(['name' => 'テストユーザー']);
        UserRecoveryCredential::create([
            'user_id' => $this->user->id,
            'email' => 'test@example.com',
            'password_hash' => Hash::make('password123'),
        ]);
    }

    public function test_未認証ユーザーはログイン画面にリダイレクトされる(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/login');
    }

    public function test_ログイン画面が表示される(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Login/index'));
    }

    public function test_メールアドレスとパスワードでログインできる(): void
    {
        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertRedirect('/');
        $this->assertAuthenticatedAs($this->user);
    }

    public function test_パスワードが間違っているとログインできない(): void
    {
        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    public function test_ログアウトできる(): void
    {
        $this->actingAs($this->user);

        $response = $this->post('/logout');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_ログイン済みユーザーがログイン画面にアクセスするとリダイレクトされる(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/login');

        $response->assertRedirect('/');
    }
}
