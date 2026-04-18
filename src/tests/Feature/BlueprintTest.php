<?php

namespace Tests\Feature;

use App\Models\Blueprint;
use App\Models\Content;
use App\Models\Space;
use App\Models\SpaceUser;
use App\Models\Spec;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlueprintTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Space $space;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create(['name' => 'テストユーザー']);
        $this->space = Space::create(['name' => 'テストハコ']);
        SpaceUser::create(['space_id' => $this->space->id, 'user_id' => $this->user->id, 'role' => 'admin']);
    }

    public function test_モノ一覧を取得できる(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => 'ブログ', 'type' => 'multiple']);
        Spec::create(['blueprint_id' => $blueprint->id]);

        $response = $this->actingAs($this->user)->get("/spaces/{$this->space->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Space/index')
            ->has('blueprints', 1)
        );
    }

    public function test_モノを作成するとスペックも自動作成される(): void
    {
        $response = $this->actingAs($this->user)->post("/spaces/{$this->space->id}/blueprints", [
            'slug' => 'blog',
            'name' => 'ブログ',
            'type' => 'multiple',
        ]);

        $response->assertRedirect("/spaces/{$this->space->id}");
        $this->assertDatabaseHas('blueprints', ['slug' => 'blog', 'space_id' => $this->space->id]);
        $blueprint = Blueprint::where('slug', 'blog')->first();
        $this->assertNotNull($blueprint->spec);
    }

    public function test_モノの名前を変更できる(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => '旧名', 'type' => 'multiple']);

        $response = $this->actingAs($this->user)->put("/spaces/{$this->space->id}/blueprints/{$blueprint->id}", [
            'name' => '新名',
        ]);

        $response->assertRedirect("/spaces/{$this->space->id}");
        $this->assertDatabaseHas('blueprints', ['id' => $blueprint->id, 'name' => '新名']);
    }

    public function test_モノのslugは変更できない(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => 'ブログ', 'type' => 'multiple']);

        $response = $this->actingAs($this->user)->put("/spaces/{$this->space->id}/blueprints/{$blueprint->id}", [
            'name' => 'ブログ',
            'slug' => 'changed',
        ]);

        $this->assertDatabaseHas('blueprints', ['id' => $blueprint->id, 'slug' => 'blog']);
    }

    public function test_モノを削除できる(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => 'ブログ', 'type' => 'multiple']);
        Spec::create(['blueprint_id' => $blueprint->id]);
        Content::create(['blueprint_id' => $blueprint->id, 'data' => ['title' => 'test']]);

        $response = $this->actingAs($this->user)->delete("/spaces/{$this->space->id}/blueprints/{$blueprint->id}");

        $response->assertRedirect("/spaces/{$this->space->id}");
        $this->assertDatabaseMissing('blueprints', ['id' => $blueprint->id]);
        $this->assertDatabaseMissing('specs', ['blueprint_id' => $blueprint->id]);
        $this->assertDatabaseMissing('contents', ['blueprint_id' => $blueprint->id]);
    }
}
