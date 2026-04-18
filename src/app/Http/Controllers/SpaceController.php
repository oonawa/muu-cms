<?php

namespace App\Http\Controllers;

use App\Models\Space;
use App\Models\SpaceUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SpaceController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($validated) {
            $space = Space::create(['name' => $validated['name']]);

            SpaceUser::create([
                'space_id' => $space->id,
                'user_id' => Auth::id(),
                'role' => 'admin',
            ]);
        });

        return redirect('/');
    }

    public function update(Request $request, Space $space)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $space->update($validated);

        return redirect('/');
    }

    public function destroy(Space $space)
    {
        $space->delete();

        return redirect('/');
    }
}
