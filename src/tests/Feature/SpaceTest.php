<?php

namespace Tests\Feature;

use App\Models\Blueprint;
use App\Models\Space;
use App\Models\SpaceUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpaceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create(['name' => 'テストユーザー']);
    }

    public function test_ハコ一覧を取得できる(): void
    {
        $space = Space::create(['name' => 'テストハコ']);
        SpaceUser::create(['space_id' => $space->id, 'user_id' => $this->user->id, 'role' => 'admin']);

        $response = $this->actingAs($this->user)->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard/index')
            ->has('spaces', 1)
        );
    }

    public function test_ハコを作成できる(): void
    {
        $response = $this->actingAs($this->user)->post('/spaces', [
            'name' => '新しいハコ',
        ]);

        $response->assertRedirect('/');
        $this->assertDatabaseHas('spaces', ['name' => '新しいハコ']);
        $this->assertDatabaseHas('space_users', [
            'user_id' => $this->user->id,
            'role' => 'admin',
        ]);
    }

    public function test_ハコの名前を変更できる(): void
    {
        $space = Space::create(['name' => '旧名']);
        SpaceUser::create(['space_id' => $space->id, 'user_id' => $this->user->id, 'role' => 'admin']);

        $response = $this->actingAs($this->user)->put("/spaces/{$space->id}", [
            'name' => '新名',
        ]);

        $response->assertRedirect('/');
        $this->assertDatabaseHas('spaces', ['id' => $space->id, 'name' => '新名']);
    }

    public function test_ハコを削除できる(): void
    {
        $space = Space::create(['name' => '削除対象']);
        SpaceUser::create(['space_id' => $space->id, 'user_id' => $this->user->id, 'role' => 'admin']);
        Blueprint::create(['space_id' => $space->id, 'slug' => 'test', 'name' => 'テスト', 'type' => 'multiple']);

        $response = $this->actingAs($this->user)->delete("/spaces/{$space->id}");

        $response->assertRedirect('/');
        $this->assertDatabaseMissing('spaces', ['id' => $space->id]);
        $this->assertDatabaseMissing('blueprints', ['space_id' => $space->id]);
    }
}
