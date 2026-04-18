<?php

use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/{slug}', [ApiController::class, 'show']);
