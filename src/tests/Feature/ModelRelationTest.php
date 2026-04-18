<?php

namespace Tests\Feature;

use App\Models\Blueprint;
use App\Models\Content;
use App\Models\Parameter;
use App\Models\ParameterConstraint;
use App\Models\Passkey;
use App\Models\Space;
use App\Models\SpaceUser;
use App\Models\Spec;
use App\Models\User;
use App\Models\UserRecoveryCredential;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Space $space;
    private Blueprint $blueprint;
    private Spec $spec;
    private Parameter $parameter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create(['name' => 'テストユーザー']);
        $this->space = Space::create(['name' => 'テストハコ']);
        SpaceUser::create([
            'space_id' => $this->space->id,
            'user_id' => $this->user->id,
            'role' => 'admin',
        ]);
        $this->blueprint = Blueprint::create([
            'space_id' => $this->space->id,
            'slug' => 'blog',
            'name' => 'ブログ',
            'type' => 'multiple',
        ]);
        $this->spec = Spec::create([
            'blueprint_id' => $this->blueprint->id,
        ]);
        $this->parameter = Parameter::create([
            'spec_id' => $this->spec->id,
            'name' => 'title',
            'label' => 'タイトル',
            'type' => 'string',
            'is_required' => true,
            'sort_order' => 0,
        ]);
    }

    public function test_ユーザーはパスキーを複数持てる(): void
    {
        Passkey::create([
            'user_id' => $this->user->id,
            'credential_id' => 'cred-1',
            'public_key' => 'key-1',
            'sign_count' => 0,
        ]);

        $this->assertCount(1, $this->user->passkeys);
    }

    public function test_ユーザーはリカバリ情報を1つ持てる(): void
    {
        UserRecoveryCredential::create([
            'user_id' => $this->user->id,
            'email' => 'test@example.com',
            'password_hash' => 'hashed',
        ]);

        $this->assertNotNull($this->user->recoveryCredential);
    }

    public function test_ハコはユーザーと多対多の関係を持つ(): void
    {
        $this->assertCount(1, $this->space->users);
        $this->assertCount(1, $this->user->spaces);
    }

    public function test_ハコはモノを複数持てる(): void
    {
        $this->assertCount(1, $this->space->blueprints);
        $this->assertEquals($this->space->id, $this->blueprint->space->id);
    }

    public function test_モノはスペックを1つ持つ(): void
    {
        $this->assertNotNull($this->blueprint->spec);
        $this->assertEquals($this->blueprint->id, $this->spec->blueprint->id);
    }

    public function test_スペックはパラメータを複数持てる(): void
    {
        $this->assertCount(1, $this->spec->parameters);
        $this->assertEquals($this->spec->id, $this->parameter->spec->id);
    }

    public function test_パラメータは制約を1つ持てる(): void
    {
        ParameterConstraint::create([
            'parameter_id' => $this->parameter->id,
            'max_length' => 255,
        ]);

        $this->assertNotNull($this->parameter->constraint);
    }

    public function test_モノはコンテンツを複数持てる(): void
    {
        Content::create([
            'blueprint_id' => $this->blueprint->id,
            'data' => ['title' => 'テスト記事'],
        ]);

        $this->assertCount(1, $this->blueprint->contents);
        $this->assertIsArray($this->blueprint->contents->first()->data);
    }
}
