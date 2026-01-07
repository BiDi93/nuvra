<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\PerformanceController; 


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// The read route to get all players
Route::get('/players', [PlayerController::class, 'index']);

// Write post route to add new player
Route::post('/players', [PlayerController::class, 'store']);

// To list a specific player's profile and performance history
Route::get('/players/{id}', [PlayerController::class, 'show']);

// Route to store performance stats
Route::post('/performances', [PerformanceController::class, 'store']);

//Route for player login
Route::post('/login', [PlayerController::class, 'login']);