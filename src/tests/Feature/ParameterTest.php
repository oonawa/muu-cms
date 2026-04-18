<?php

namespace Tests\Feature;

use App\Models\Blueprint;
use App\Models\Parameter;
use App\Models\Space;
use App\Models\SpaceUser;
use App\Models\Spec;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParameterTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Space $space;
    private Blueprint $blueprint;
    private Spec $spec;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create(['name' => 'テストユーザー']);
        $this->space = Space::create(['name' => 'テストハコ']);
        SpaceUser::create(['space_id' => $this->space->id, 'user_id' => $this->user->id, 'role' => 'admin']);
        $this->blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => 'ブログ', 'type' => 'multiple']);
        $this->spec = Spec::create(['blueprint_id' => $this->blueprint->id]);
    }

    private function basePath(): string
    {
        return "/spaces/{$this->space->id}/blueprints/{$this->blueprint->id}";
    }

    public function test_モノ詳細画面でパラメータ一覧を取得できる(): void
    {
        Parameter::create(['spec_id' => $this->spec->id, 'name' => 'title', 'label' => 'タイトル', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);

        $response = $this->actingAs($this->user)->get($this->basePath());

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Blueprint/index')
            ->has('parameters', 1)
        );
    }

    public function test_パラメータを追加できる(): void
    {
        $response = $this->actingAs($this->user)->post("{$this->basePath()}/parameters", [
            'name' => 'title',
            'label' => 'タイトル',
            'type' => 'string',
            'is_required' => true,
            'sort_order' => 0,
        ]);

        $response->assertRedirect($this->basePath());
        $this->assertDatabaseHas('parameters', ['spec_id' => $this->spec->id, 'name' => 'title']);
    }

    public function test_文字数制限付きでパラメータを追加できる(): void
    {
        $response = $this->actingAs($this->user)->post("{$this->basePath()}/parameters", [
            'name' => 'title',
            'label' => 'タイトル',
            'type' => 'string',
            'is_required' => true,
            'sort_order' => 0,
            'max_length' => 255,
        ]);

        $response->assertRedirect($this->basePath());
        $parameter = Parameter::where('name', 'title')->first();
        $this->assertNotNull($parameter->constraint);
        $this->assertEquals(255, $parameter->constraint->max_length);
    }

    public function test_パラメータを削除できる(): void
    {
        $parameter = Parameter::create(['spec_id' => $this->spec->id, 'name' => 'title', 'label' => 'タイトル', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);

        $response = $this->actingAs($this->user)->delete("{$this->basePath()}/parameters/{$parameter->id}");

        $response->assertRedirect($this->basePath());
        $this->assertDatabaseMissing('parameters', ['id' => $parameter->id]);
    }

    public function test_パラメータの順序を変更できる(): void
    {
        $p1 = Parameter::create(['spec_id' => $this->spec->id, 'name' => 'title', 'label' => 'タイトル', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);
        $p2 = Parameter::create(['spec_id' => $this->spec->id, 'name' => 'body', 'label' => '本文', 'type' => 'string', 'is_required' => true, 'sort_order' => 1]);

        $response = $this->actingAs($this->user)->put("{$this->basePath()}/parameters/reorder", [
            'order' => [$p2->id, $p1->id],
        ]);

        $response->assertRedirect($this->basePath());
        $this->assertEquals(1, $p1->fresh()->sort_order);
        $this->assertEquals(0, $p2->fresh()->sort_order);
    }
}
