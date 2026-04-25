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
    public function create(Request $request)
    {
        if (User::count() > 0 && !Auth::check()) {
            abort(403);
        }

        if (User::count() > 0 && Auth::check() && !$request->session()->has('setup_step')) {
            return redirect('/');
        }

        return Inertia::render('Setup/index', [
            'step' => $request->session()->get('setup_step', 'name'),
        ]);
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

        $request->session()->put('setup_step', 'passkey');

        return redirect('/setup');
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

        $request->session()->put('setup_step', 'complete');

        return redirect('/setup');
    }

    public function complete(Request $request)
    {
        $request->session()->forget('setup_step');

        return redirect('/');
    }
}
