<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRecoveryCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class SetupController extends Controller
{
    public function create()
    {
        if (User::count() > 0) {
            abort(403);
        }

        return Inertia::render('Setup/index');
    }

    public function storeUser(Request $request)
    {
        if (User::count() > 0) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = User::create(['name' => $validated['name']]);

        Auth::login($user);

        return redirect('/setup/passkey');
    }

    public function storeRecovery(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        UserRecoveryCredential::create([
            'user_id' => $request->user()->id,
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
        ]);

        return redirect('/');
    }

    public function complete()
    {
        return redirect('/');
    }
}
