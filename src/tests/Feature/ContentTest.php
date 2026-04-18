<?php

namespace Tests\Feature;

use App\Models\Blueprint;
use App\Models\Content;
use App\Models\Parameter;
use App\Models\ParameterConstraint;
use App\Models\Space;
use App\Models\SpaceUser;
use App\Models\Spec;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentTest extends TestCase
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
        Parameter::create(['spec_id' => $this->spec->id, 'name' => 'title', 'label' => 'タイトル', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);
    }

    private function basePath(): string
    {
        return "/spaces/{$this->space->id}/blueprints/{$this->blueprint->id}";
    }

    public function test_コンテンツを作成できる(): void
    {
        $response = $this->actingAs($this->user)->post("{$this->basePath()}/contents", [
            'title' => 'テスト記事',
        ]);

        $response->assertRedirect($this->basePath());
        $this->assertDatabaseCount('contents', 1);
        $content = Content::first();
        $this->assertEquals(['title' => 'テスト記事'], $content->data);
    }

    public function test_必須パラメータが未入力だとバリデーションエラー(): void
    {
        $response = $this->actingAs($this->user)->post("{$this->basePath()}/contents", [
            'title' => '',
        ]);

        $response->assertSessionHasErrors('title');
        $this->assertDatabaseCount('contents', 0);
    }

    public function test_文字数制限を超えるとバリデーションエラー(): void
    {
        $parameter = Parameter::where('name', 'title')->first();
        ParameterConstraint::create(['parameter_id' => $parameter->id, 'max_length' => 10]);

        $response = $this->actingAs($this->user)->post("{$this->basePath()}/contents", [
            'title' => str_repeat('あ', 11),
        ]);

        $response->assertSessionHasErrors('title');
        $this->assertDatabaseCount('contents', 0);
    }

    public function test_singleタイプのモノは2件目のコンテンツを作成できない(): void
    {
        $singleBlueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'profile', 'name' => 'プロフィール', 'type' => 'single']);
        $singleSpec = Spec::create(['blueprint_id' => $singleBlueprint->id]);
        Parameter::create(['spec_id' => $singleSpec->id, 'name' => 'bio', 'label' => '自己紹介', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);
        Content::create(['blueprint_id' => $singleBlueprint->id, 'data' => ['bio' => '既存']]);

        $response = $this->actingAs($this->user)->from("/spaces/{$this->space->id}/blueprints/{$singleBlueprint->id}")->post("/spaces/{$this->space->id}/blueprints/{$singleBlueprint->id}/contents", [
            'bio' => '2件目',
        ]);

        $response->assertSessionHasErrors('blueprint');
    }

    public function test_コンテンツを更新できる(): void
    {
        $content = Content::create(['blueprint_id' => $this->blueprint->id, 'data' => ['title' => '旧タイトル']]);

        $response = $this->actingAs($this->user)->put("{$this->basePath()}/contents/{$content->id}", [
            'title' => '新タイトル',
        ]);

        $response->assertRedirect($this->basePath());
        $this->assertEquals('新タイトル', $content->fresh()->data['title']);
    }

    public function test_コンテンツを削除できる(): void
    {
        $content = Content::create(['blueprint_id' => $this->blueprint->id, 'data' => ['title' => '削除対象']]);

        $response = $this->actingAs($this->user)->delete("{$this->basePath()}/contents/{$content->id}");

        $response->assertRedirect($this->basePath());
        $this->assertDatabaseMissing('contents', ['id' => $content->id]);
    }
}
