<?php

namespace App\Providers;

use App\Contracts\SmsSender;
use App\Models\FootballMatch;
use App\Models\Tournament;
use App\Models\User;
use App\Policies\DatabaseNotificationPolicy;
use App\Policies\FootballMatchPolicy;
use App\Policies\TournamentPolicy;
use App\Policies\UserPolicy;
use App\Services\Sms\HttpSmsSender;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(SmsSender::class, HttpSmsSender::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(FootballMatch::class, FootballMatchPolicy::class);
        Gate::policy(Tournament::class, TournamentPolicy::class);
        Gate::policy(DatabaseNotification::class, DatabaseNotificationPolicy::class);
        Gate::define('viewAnalytics', fn (User $user) => $user->role === 'admin');

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return env('FRONTEND_URL', 'http://localhost:5173').'/reset-password?token='.$token.'&email='.$notifiable->getEmailForPasswordReset();
        });
    }
}
