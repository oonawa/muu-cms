<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSetupCompleted
{
    public function handle(Request $request, Closure $next): Response
    {
        if (User::count() === 0 && !$request->is('setup', 'setup/*')) {
            return redirect('/setup');
        }

        if (User::count() > 0 && !Auth::check() && !$request->is('login', 'login/*', 'setup', 'setup/*', 'passkeys/authenticate/*')) {
            return redirect('/login');
        }

        return $next($request);
    }
}
