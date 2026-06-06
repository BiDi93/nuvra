<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- AUTH ---
use App\Http\Controllers\NewPasswordController;

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
// Password Reset Routes
Route::post('/forgot-password', [NewPasswordController::class, 'forgotPassword'])->middleware('guest');
Route::post('/reset-password', [NewPasswordController::class, 'resetPassword'])->middleware('guest');

// Authenticated User Info (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

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
        Route::get('/profile',   [CommunityGameController::class, 'getProfile']);
        Route::post('/profile/avatar', [CommunityGameController::class, 'updateAvatar']);
        Route::get('/members',   [CommunityGameController::class, 'members']);
        Route::get('/members/{id}', [CommunityGameController::class, 'memberProfile']);

        // ── Games (auth required) ─────────────────────────────────────────────────
        Route::post('/games',                          [CommunityGameController::class, 'store']);
        Route::patch('/games/{id}/cancel',             [CommunityGameController::class, 'cancel']);
        Route::post('/games/{id}/join',                [CommunityGameController::class, 'join']);
        Route::post('/games/{id}/receipt',             [CommunityGameController::class, 'uploadReceipt']);
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
