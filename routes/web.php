<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

Route::get('/', function () {
    return view('welcome');
});

// This tells Laravel to hand over any unknown URL to React
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');

