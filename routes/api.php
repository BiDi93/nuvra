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

// --- COMMUNITY CONTROLLERS ---
use App\Http\Controllers\CommunityAuthController;
use App\Http\Controllers\CommunityGameController;
use App\Http\Controllers\CommunityAnnouncementController;
use App\Http\Controllers\CommunityAnalyticsController;

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
Route::middleware('auth:sanctum')->group(function () {
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
    Route::get('/coach/{id}/payments/{month}', [PaymentControllerBillplz::class, 'getTeamPayments']);
    
    // Performance & Matches
    Route::get('/coach/{id}/matches', [PerformanceController::class, 'getMatches']);
    Route::post('/performances', [PerformanceController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| PLAYER PORTAL
|--------------------------------------------------------------------------
| Routes used specifically by the Player Dashboard
*/
Route::middleware('auth:sanctum')->group(function () {
    // Player Profiles & Teammates
    Route::get('/players/{id}', [PlayerController::class, 'show']);
    Route::post('/player/{id}/update', [PlayerController::class, 'update']);
    Route::post('/player/{id}/attributes', [PlayerController::class, 'updateAttributes']);
    Route::get('/players/{id}/teammates', [PlayerController::class, 'getTeammates']);

    // Player Payment History
    Route::get('/player/{id}/payments', [PaymentControllerBillplz::class, 'getMyPayments']);
});

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

/*
|--------------------------------------------------------------------------
| NUVRA COMMUNITY
|--------------------------------------------------------------------------
*/
Route::prefix('community')->group(function () {

    // ── Auth ──────────────────────────────────────────────────────────────────
    Route::post('/register', [CommunityAuthController::class, 'register']);
    Route::post('/login',    [CommunityAuthController::class, 'login']);

    // ── Games (public reads) ───────────────────────────────────────────────────
    Route::get('/games',              [CommunityGameController::class, 'index']);
    Route::get('/games/{id}',         [CommunityGameController::class, 'show']);

    // ── Authenticated Community Routes ──
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout',   [CommunityAuthController::class, 'logout']);
        Route::get('/me',        [CommunityAuthController::class, 'me']);

        // ── Games (auth required) ─────────────────────────────────────────────────
        Route::post('/games',                          [CommunityGameController::class, 'store']);
        Route::patch('/games/{id}/cancel',             [CommunityGameController::class, 'cancel']);
        Route::post('/games/{id}/join',                [CommunityGameController::class, 'join']);
        Route::delete('/games/{id}/leave',             [CommunityGameController::class, 'leave']);
        Route::get('/games/{id}/bookings',             [CommunityGameController::class, 'bookings']);
        Route::patch('/bookings/{bookingId}/approve',  [CommunityGameController::class, 'approveBooking']);
        Route::patch('/bookings/{bookingId}/reject',   [CommunityGameController::class, 'rejectBooking']);

        // ── Announcements ─────────────────────────────────────────────────────────
        Route::get('/announcements',         [CommunityAnnouncementController::class, 'index']);
        Route::post('/announcements',        [CommunityAnnouncementController::class, 'store']);
        Route::delete('/announcements/{id}', [CommunityAnnouncementController::class, 'destroy']);

        // ── Analytics ─────────────────────────────────────────────────────────────
        Route::get('/analytics', [CommunityAnalyticsController::class, 'index']);
    });
});