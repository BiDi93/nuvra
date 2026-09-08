<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- AUTH ---
use App\Http\Controllers\NewPasswordController;

// --- COMMUNITY & TOURNAMENT CONTROLLERS ---
use App\Http\Controllers\CommunityAuthController;
use App\Http\Controllers\CommunityGameController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\CommunityAnnouncementController;
use App\Http\Controllers\CommunityAnalyticsController;
use App\Http\Controllers\CommunityNotificationController;

/*
|--------------------------------------------------------------------------
| AUTHENTICATION & ONBOARDING
|--------------------------------------------------------------------------
*/
Route::post('/forgot-password', [NewPasswordController::class, 'forgotPassword'])->middleware('guest');
Route::post('/reset-password', [NewPasswordController::class, 'resetPassword'])->middleware('guest');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

/*
|--------------------------------------------------------------------------
| NUVRA TOURNAMENT & COMMUNITY PLATFORM
|--------------------------------------------------------------------------
*/
Route::prefix('community')->group(function () {

    // ── Auth ──────────────────────────────────────────────────────────────────
    Route::post('/register', [CommunityAuthController::class, 'register']);
    Route::post('/login',    [CommunityAuthController::class, 'login']);

    // ── Tournaments (Public Reads) ────────────────────────────────────────────
    Route::get('/tournaments',      [TournamentController::class, 'index']);
    Route::get('/tournaments/{id}', [TournamentController::class, 'show']);

    // ── Legacy Games / Matches (Public Reads) ──────────────────────────────────
    Route::get('/games',            [CommunityGameController::class, 'index']);
    Route::get('/games/{id}',       [CommunityGameController::class, 'show']);

    // ── Members & Profiles (Public) ───────────────────────────────────────────
    Route::get('/members',          [CommunityGameController::class, 'members']);
    Route::get('/members/{id}',     [CommunityGameController::class, 'memberProfile']);

    // ── Authenticated Routes ──
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout',   [CommunityAuthController::class, 'logout']);
        Route::get('/me',        [CommunityAuthController::class, 'me']);
        Route::get('/profile',   [CommunityGameController::class, 'getProfile']);
        Route::post('/profile/avatar', [CommunityGameController::class, 'updateAvatar']);
        Route::post('/profile/logo', [CommunityGameController::class, 'updateClubLogo']);

        // ── Notifications ──────────────────────────────────────────────────────
        Route::get('/notifications', [CommunityNotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [CommunityNotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [CommunityNotificationController::class, 'markAllAsRead']);

        // ── Tournament Management (Organizer / Admin) ─────────────────────────
        Route::post('/tournaments',                          [TournamentController::class, 'store']);
        Route::post('/tournaments/{id}/teams',               [TournamentController::class, 'addTeam']);
        Route::delete('/tournaments/{id}/teams/{teamId}',    [TournamentController::class, 'deleteTeam']);
        Route::post('/tournaments/{id}/fixtures',            [TournamentController::class, 'createFixture']);
        Route::patch('/matches/{matchId}/score',             [TournamentController::class, 'updateScore']);
        Route::delete('/matches/{matchId}',                  [TournamentController::class, 'deleteFixture']);

        // ── Match Performances (Organizer / Admin) ───────────────────────────
        Route::post('/games/{id}/performances',              [CommunityGameController::class, 'recordPerformances']);

        // ── Announcements ─────────────────────────────────────────────────────
        Route::get('/announcements',         [CommunityAnnouncementController::class, 'index']);
        Route::post('/announcements',        [CommunityAnnouncementController::class, 'store']);
        Route::delete('/announcements/{id}', [CommunityAnnouncementController::class, 'destroy']);

        // ── Analytics ─────────────────────────────────────────────────────────
        Route::get('/analytics', [CommunityAnalyticsController::class, 'index']);
    });
});
