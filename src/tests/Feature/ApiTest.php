<?php

namespace Tests\Feature;

use App\Models\Blueprint;
use App\Models\Content;
use App\Models\Parameter;
use App\Models\Space;
use App\Models\Spec;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    private Space $space;

    protected function setUp(): void
    {
        parent::setUp();
        $this->space = Space::create(['name' => 'テストハコ']);
    }

    public function test_singleタイプのモノのコンテンツを取得できる(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'profile', 'name' => 'プロフィール', 'type' => 'single']);
        $spec = Spec::create(['blueprint_id' => $blueprint->id]);
        Parameter::create(['spec_id' => $spec->id, 'name' => 'bio', 'label' => '自己紹介', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);
        Content::create(['blueprint_id' => $blueprint->id, 'data' => ['bio' => 'こんにちは']]);

        $response = $this->get('/api/v1/profile');

        $response->assertStatus(200);
        $response->assertExactJson(['bio' => 'こんにちは']);
    }

    public function test_singleタイプでコンテンツ未登録なら404(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'profile', 'name' => 'プロフィール', 'type' => 'single']);
        Spec::create(['blueprint_id' => $blueprint->id]);

        $response = $this->get('/api/v1/profile');

        $response->assertStatus(404);
    }

    public function test_multipleタイプのコンテンツ一覧を取得できる(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => 'ブログ', 'type' => 'multiple']);
        $spec = Spec::create(['blueprint_id' => $blueprint->id]);
        Parameter::create(['spec_id' => $spec->id, 'name' => 'title', 'label' => 'タイトル', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);
        Content::create(['blueprint_id' => $blueprint->id, 'data' => ['title' => '記事1']]);
        Content::create(['blueprint_id' => $blueprint->id, 'data' => ['title' => '記事2']]);

        $response = $this->get('/api/v1/blog');

        $response->assertStatus(200);
        $response->assertJsonStructure(['contents', 'totalCount']);
        $response->assertJsonCount(2, 'contents');
        $response->assertJsonPath('totalCount', 2);
    }

    public function test_limitとoffsetでページネーションできる(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => 'ブログ', 'type' => 'multiple']);
        $spec = Spec::create(['blueprint_id' => $blueprint->id]);
        Parameter::create(['spec_id' => $spec->id, 'name' => 'title', 'label' => 'タイトル', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);
        for ($i = 1; $i <= 15; $i++) {
            Content::create(['blueprint_id' => $blueprint->id, 'data' => ['title' => "記事{$i}"]]);
        }

        $response = $this->get('/api/v1/blog?limit=5&offset=10');

        $response->assertStatus(200);
        $response->assertJsonCount(5, 'contents');
        $response->assertJsonPath('totalCount', 15);
    }

    public function test_存在しないslugは404(): void
    {
        $response = $this->get('/api/v1/nonexistent');

        $response->assertStatus(404);
    }

    public function test_削除済みパラメータのキーはレスポンスから除外される(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => 'ブログ', 'type' => 'single']);
        $spec = Spec::create(['blueprint_id' => $blueprint->id]);
        Parameter::create(['spec_id' => $spec->id, 'name' => 'title', 'label' => 'タイトル', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);
        // dataには削除済みキー"body"が残っている
        Content::create(['blueprint_id' => $blueprint->id, 'data' => ['title' => 'テスト', 'body' => '本文']]);

        $response = $this->get('/api/v1/blog');

        $response->assertStatus(200);
        $response->assertExactJson(['title' => 'テスト']);
    }

    public function test_text型パラメータの値が改行を含んだままAPIレスポンスで返る(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'article', 'name' => '記事', 'type' => 'single']);
        $spec = Spec::create(['blueprint_id' => $blueprint->id]);
        Parameter::create(['spec_id' => $spec->id, 'name' => 'body', 'label' => '本文', 'type' => 'text', 'is_required' => true, 'sort_order' => 0]);
        Content::create(['blueprint_id' => $blueprint->id, 'data' => ['body' => "複数行\nテキスト"]]);

        $response = $this->get('/api/v1/article');

        $response->assertStatus(200);
        $response->assertExactJson(['body' => "複数行\nテキスト"]);
    }

    public function test_追加されたパラメータで既存コンテンツにキーがない場合はnullになる(): void
    {
        $blueprint = Blueprint::create(['space_id' => $this->space->id, 'slug' => 'blog', 'name' => 'ブログ', 'type' => 'single']);
        $spec = Spec::create(['blueprint_id' => $blueprint->id]);
        Parameter::create(['spec_id' => $spec->id, 'name' => 'title', 'label' => 'タイトル', 'type' => 'string', 'is_required' => true, 'sort_order' => 0]);
        // 後から追加されたパラメータ
        Parameter::create(['spec_id' => $spec->id, 'name' => 'subtitle', 'label' => 'サブタイトル', 'type' => 'string', 'is_required' => false, 'sort_order' => 1]);
        // 既存コンテンツにはsubtitleキーがない
        Content::create(['blueprint_id' => $blueprint->id, 'data' => ['title' => 'テスト']]);

        $response = $this->get('/api/v1/blog');

        $response->assertStatus(200);
        $response->assertExactJson(['title' => 'テスト', 'subtitle' => null]);
    }
}
