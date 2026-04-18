<?php

namespace App\Http\Controllers;

use App\Models\Blueprint;
use App\Models\Space;
use App\Models\Spec;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BlueprintController extends Controller
{
    public function index(Space $space)
    {
        return Inertia::render('Space/index', [
            'space' => $space,
            'blueprints' => $space->blueprints,
        ]);
    }

    public function store(Request $request, Space $space)
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9\-]+$/'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:single,multiple'],
        ]);

        DB::transaction(function () use ($space, $validated) {
            $blueprint = Blueprint::create([
                'space_id' => $space->id,
                ...$validated,
            ]);

            Spec::create(['blueprint_id' => $blueprint->id]);
        });

        return redirect("/spaces/{$space->id}");
    }

    public function update(Request $request, Space $space, Blueprint $blueprint)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $blueprint->update($validated);

        return redirect("/spaces/{$space->id}");
    }

    public function destroy(Space $space, Blueprint $blueprint)
    {
        $blueprint->delete();

        return redirect("/spaces/{$space->id}");
    }
}
