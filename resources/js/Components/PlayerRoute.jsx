import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Protects player dashboard routes.
 * - No token            → /login
 * - Status is pending   → /waiting-room  (can't access dashboard yet)
 * - Otherwise           → allow through (DashboardLayout does the live API check)
 */
const PlayerRoute = () => {
    const token  = localStorage.getItem('auth_token');
    const status = localStorage.getItem('player_status');

    if (!token)               return <Navigate to="/login"        replace />;
    if (status === 'pending') return <Navigate to="/waiting-room" replace />;

    return <Outlet />;
};

export default PlayerRoute;
