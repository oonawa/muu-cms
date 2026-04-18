<?php

namespace Tests\Feature;

use App\Models\Passkey;
use App\Models\User;
use App\Models\UserRecoveryCredential;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasskeyTest extends TestCase
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

    public function test_パスキー登録用のchallengeを取得できる(): void
    {
        $response = $this->actingAs($this->user)->get('/passkeys/register/options');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'rp' => ['name', 'id'],
            'user' => ['id', 'name', 'displayName'],
            'challenge',
            'pubKeyCredParams',
        ]);
    }

    public function test_パスキー認証用のchallengeを取得できる(): void
    {
        Passkey::create([
            'user_id' => $this->user->id,
            'credential_id' => 'test-credential-id',
            'public_key' => 'test-public-key',
            'sign_count' => 0,
        ]);

        $response = $this->get('/passkeys/authenticate/options');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'challenge',
            'rpId',
        ]);
    }

    public function test_ログイン画面にパスキーログイン用のoptionsエンドポイントが存在する(): void
    {
        $response = $this->get('/passkeys/authenticate/options');

        $response->assertStatus(200);
    }
}
