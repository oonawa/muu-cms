<?php

namespace App\Http\Controllers;

use App\Models\Blueprint;
use App\Models\Content;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ContentController extends Controller
{
    public function create(Space $space, Blueprint $blueprint)
    {
        return inertia('ContentCreate/index', [
            'space' => $space,
            'blueprint' => $blueprint,
            'parameters' => $blueprint->spec->parameters,
        ]);
    }

    public function edit(Space $space, Blueprint $blueprint, Content $content)
    {
        return inertia('ContentEdit/index', [
            'space' => $space,
            'blueprint' => $blueprint,
            'parameters' => $blueprint->spec->parameters,
            'content' => $content,
        ]);
    }

    public function store(Request $request, Space $space, Blueprint $blueprint)
    {
        if ($blueprint->type === 'single' && $blueprint->contents()->count() >= 1) {
            throw ValidationException::withMessages([
                'blueprint' => 'このモノはタイプが「ひとつ」のため、コンテンツは1件のみです。',
            ]);
        }

        $rules = $this->buildValidationRules($blueprint);
        $validated = $request->validate($rules);

        $data = $this->extractData($blueprint, $validated);
        Content::create(['blueprint_id' => $blueprint->id, 'data' => $data]);

        return redirect("/spaces/{$space->id}/blueprints/{$blueprint->id}")->with('success', 'コンテンツを作成しました。');
    }

    public function update(Request $request, Space $space, Blueprint $blueprint, Content $content)
    {
        $rules = $this->buildValidationRules($blueprint);
        $validated = $request->validate($rules);

        $data = $this->extractData($blueprint, $validated);
        $content->update(['data' => $data]);

        return redirect("/spaces/{$space->id}/blueprints/{$blueprint->id}")->with('success', 'コンテンツを更新しました。');
    }

    public function destroy(Space $space, Blueprint $blueprint, Content $content)
    {
        $content->delete();

        return redirect("/spaces/{$space->id}/blueprints/{$blueprint->id}");
    }

    private function buildValidationRules(Blueprint $blueprint): array
    {
        $rules = [];
        $parameters = $blueprint->spec->parameters;

        foreach ($parameters as $parameter) {
            $paramRules = [];
            $paramRules[] = $parameter->is_required ? 'required' : 'nullable';
            $paramRules[] = 'string';

            if ($parameter->type === 'string') {
                $paramRules[] = 'not_regex:/[\r\n]/';
            }

            if ($parameter->constraint) {
                $paramRules[] = "max:{$parameter->constraint->max_length}";
            }

            $rules[$parameter->name] = $paramRules;
        }

        return $rules;
    }

    private function extractData(Blueprint $blueprint, array $validated): array
    {
        $data = [];
        foreach ($blueprint->spec->parameters as $parameter) {
            if (array_key_exists($parameter->name, $validated)) {
                $data[$parameter->name] = $validated[$parameter->name];
            }
        }
        return $data;
    }
}
