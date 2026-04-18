<?php

namespace App\Http\Controllers;

use App\Models\Blueprint;
use App\Models\Parameter;
use App\Models\ParameterConstraint;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ParameterController extends Controller
{
    public function index(Space $space, Blueprint $blueprint)
    {
        return Inertia::render('Blueprint/index', [
            'space' => $space,
            'blueprint' => $blueprint,
            'parameters' => $blueprint->spec->parameters()->orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request, Space $space, Blueprint $blueprint)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9_]+$/'],
            'label' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:string'],
            'is_required' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'max_length' => ['nullable', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($blueprint, $validated) {
            $parameter = Parameter::create([
                'spec_id' => $blueprint->spec->id,
                'name' => $validated['name'],
                'label' => $validated['label'],
                'type' => $validated['type'],
                'is_required' => $validated['is_required'],
                'sort_order' => $validated['sort_order'],
            ]);

            if (!empty($validated['max_length'])) {
                ParameterConstraint::create([
                    'parameter_id' => $parameter->id,
                    'max_length' => $validated['max_length'],
                ]);
            }
        });

        return redirect("/spaces/{$space->id}/blueprints/{$blueprint->id}");
    }

    public function destroy(Space $space, Blueprint $blueprint, Parameter $parameter)
    {
        $parameter->delete();

        return redirect("/spaces/{$space->id}/blueprints/{$blueprint->id}");
    }

    public function reorder(Request $request, Space $space, Blueprint $blueprint)
    {
        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['required', 'integer'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['order'] as $index => $parameterId) {
                Parameter::where('id', $parameterId)->update(['sort_order' => $index]);
            }
        });

        return redirect("/spaces/{$space->id}/blueprints/{$blueprint->id}");
    }
}
