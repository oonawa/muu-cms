<?php

namespace App\Http\Controllers;

use App\Models\UserRecoveryCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class LoginController extends Controller
{
    public function create()
    {
        if (Auth::check()) {
            return redirect('/');
        }

        return Inertia::render('Login/index');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $credential = UserRecoveryCredential::where('email', $validated['email'])->first();

        if (!$credential || !Hash::check($validated['password'], $credential->password_hash)) {
            return back()->withErrors([
                'email' => 'メールアドレスまたはパスワードが正しくありません。',
            ]);
        }

        Auth::login($credential->user);

        $request->session()->regenerate();

        return redirect('/');
    }

    public function destroy(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
