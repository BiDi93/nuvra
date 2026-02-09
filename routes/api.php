<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- CONTROLLERS ---
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\CoachController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\PaymentController; // Legacy (Coach View)
use App\Http\Controllers\PaymentControllerBillplz; // New (Billplz Integration)

/*
|--------------------------------------------------------------------------
| AUTHENTICATION & ONBOARDING
|--------------------------------------------------------------------------
*/
// Login Routes
Route::post('/login', [PlayerController::class, 'login']);
Route::post('/coach/login', [CoachController::class, 'login']);

// Registration & Onboarding
Route::post('/register', [PlayerController::class, 'register']);
Route::post('/player/onboarding', [PlayerController::class, 'submitApplication']);

// Authenticated User Info (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/player/me', [PlayerController::class, 'me']);
});

/*
|--------------------------------------------------------------------------
| COACH PORTAL
|--------------------------------------------------------------------------
| Routes used specifically by the Coach Dashboard
*/
// Team Management
Route::get('/coach/{id}/team', [TeamController::class, 'getCoachTeam']);
Route::get('/coach/{id}/players', [CoachController::class, 'getMyTeam']);
Route::post('/coach/{id}/players', [CoachController::class, 'addPlayer']);

// Player Requests
Route::get('/coach/{id}/requests', [CoachController::class, 'getPendingRequests']);
Route::post('/coach/{id}/request/{playerId}', [CoachController::class, 'handleRequest']);

// Announcements
Route::get('/coach/{id}/announcements', [AnnouncementController::class, 'index']);
Route::post('/announcements', [AnnouncementController::class, 'store']);

// Schedule
Route::get('/coach/{id}/schedule', [ScheduleController::class, 'index']);
Route::post('/schedule', [ScheduleController::class, 'store']);
Route::delete('/schedule/{id}', [ScheduleController::class, 'destroy']);

// Coach View of Payments
Route::get('/coach/{id}/payments/{month}', [PaymentController::class, 'getTeamPayments']);

/*
|--------------------------------------------------------------------------
| PLAYER PORTAL
|--------------------------------------------------------------------------
| Routes used specifically by the Player Dashboard
*/
// Player Profiles & Teammates
Route::get('/players/{id}', [PlayerController::class, 'show']);
Route::post('/player/{id}/update', [PlayerController::class, 'update']);
Route::get('/players/{id}/teammates', [PlayerController::class, 'getTeammates']);

// Player Payment History
Route::get('/player/{id}/payments', [PaymentControllerBillplz::class, 'getMyPayments']);

// General Player List (Admin/Public?)
Route::get('/players', [PlayerController::class, 'index']);
Route::post('/players', [PlayerController::class, 'store']);

/*
|--------------------------------------------------------------------------
| PERFORMANCE & MATCHES
|--------------------------------------------------------------------------
*/
// Matches (Dropdowns)
Route::get('/coach/{id}/matches', [PerformanceController::class, 'getMatches']);

// Saving Stats
Route::post('/performances', [PerformanceController::class, 'store']);

/*
|--------------------------------------------------------------------------
| PAYMENT PROCESSING (BILLPLZ)
|--------------------------------------------------------------------------
| Functional routes for processing payments
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/payment/create-bill', [PaymentControllerBillplz::class, 'createBill']);
    Route::post('/payment/verify', [PaymentControllerBillplz::class, 'verifyPayment']);
});

/*
|--------------------------------------------------------------------------
| PUBLIC / UTILITY
|--------------------------------------------------------------------------
*/
Route::get('/teams', [PlayerController::class, 'getTeams']);