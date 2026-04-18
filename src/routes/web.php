<?php

use App\Http\Controllers\BlueprintController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\ParameterController;
use App\Http\Controllers\PasskeyController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\SpaceController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/setup', [SetupController::class, 'create']);
Route::post('/setup/user', [SetupController::class, 'storeUser']);
Route::post('/setup/recovery', [SetupController::class, 'storeRecovery']);
Route::post('/setup/complete', [SetupController::class, 'complete']);

Route::get('/login', [LoginController::class, 'create']);
Route::post('/login', [LoginController::class, 'store']);
Route::post('/logout', [LoginController::class, 'destroy']);

Route::get('/passkeys/register/options', [PasskeyController::class, 'registerOptions']);
Route::post('/passkeys/register', [PasskeyController::class, 'register']);
Route::get('/passkeys/authenticate/options', [PasskeyController::class, 'authenticateOptions']);
Route::post('/passkeys/authenticate', [PasskeyController::class, 'authenticate']);

Route::get('/', function () {
    return Inertia::render('Dashboard/index', [
        'spaces' => Auth::user()->spaces,
    ]);
});

Route::post('/spaces', [SpaceController::class, 'store']);
Route::put('/spaces/{space}', [SpaceController::class, 'update']);
Route::delete('/spaces/{space}', [SpaceController::class, 'destroy']);

Route::get('/spaces/{space}', [BlueprintController::class, 'index']);
Route::post('/spaces/{space}/blueprints', [BlueprintController::class, 'store']);
Route::put('/spaces/{space}/blueprints/{blueprint}', [BlueprintController::class, 'update']);
Route::delete('/spaces/{space}/blueprints/{blueprint}', [BlueprintController::class, 'destroy']);

Route::get('/spaces/{space}/blueprints/{blueprint}', [ParameterController::class, 'index']);
Route::post('/spaces/{space}/blueprints/{blueprint}/parameters', [ParameterController::class, 'store']);
Route::put('/spaces/{space}/blueprints/{blueprint}/parameters/reorder', [ParameterController::class, 'reorder']);
Route::delete('/spaces/{space}/blueprints/{blueprint}/parameters/{parameter}', [ParameterController::class, 'destroy']);

Route::post('/spaces/{space}/blueprints/{blueprint}/contents', [ContentController::class, 'store']);
Route::put('/spaces/{space}/blueprints/{blueprint}/contents/{content}', [ContentController::class, 'update']);
Route::delete('/spaces/{space}/blueprints/{blueprint}/contents/{content}', [ContentController::class, 'destroy']);
