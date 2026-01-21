<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\PerformanceController; 
use App\Http\Controllers\CoachController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\PaymentController;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// The read route to get all players
Route::get('/players', [PlayerController::class, 'index']);

// Write post route to add new player
Route::post('/players', [PlayerController::class, 'store']);

// To list a specific player's profile and performance history
Route::get('/players/{id}', [PlayerController::class, 'show']);

// Get list of matches (For the dropdown)
Route::get('/coach/{id}/matches', [PerformanceController::class, 'getMatches']);

// Save the result
Route::post('/performances', [PerformanceController::class, 'store']);

//Route for player login
Route::post('/login', [PlayerController::class, 'login']);


//Route for coach functionalities
Route::post('/coach/login', [CoachController::class, 'login']);
Route::get('/coach/{id}/players', [CoachController::class, 'getMyTeam']);
Route::post('/coach/{id}/players', [CoachController::class, 'addPlayer']);

// Route to get teammates of a player
Route::get('/players/{id}/teammates', [App\Http\Controllers\PlayerController::class, 'getTeammates']);

// Public Routes
Route::get('/teams', [PlayerController::class, 'getTeams']);
Route::post('/register', [PlayerController::class, 'register']);

// Coach Routes
Route::get('/coach/{id}/requests', [CoachController::class, 'getPendingRequests']);
Route::post('/coach/{id}/requests/{playerId}', [CoachController::class, 'handleRequest']);
Route::get('/coach/{id}/players', [PlayerController::class, 'getCoachPlayers']);

// Announcements Routes
Route::get('/coach/{id}/announcements', [AnnouncementController::class, 'index']);
Route::post('/announcements', [AnnouncementController::class, 'store']);

//Shedule Routes
Route::get('/coach/{id}/schedule', [ScheduleController::class, 'index']);
Route::post('/schedule', [ScheduleController::class, 'store']);
Route::delete('/schedule/{id}', [ScheduleController::class, 'destroy']);

// Player Profile Update Route
Route::post('/player/{id}/update', [PlayerController::class, 'update']);

// Payements Routes //
// COACH ROUTES
Route::get('/coach/{id}/payments/{month}', [PaymentController::class, 'getTeamPayments']);

// PLAYER ROUTES
Route::get('/player/{id}/payments', [PaymentController::class, 'getMyPayments']);
Route::post('/payments', [PaymentController::class, 'makePayment']);