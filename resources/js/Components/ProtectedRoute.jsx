import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('auth_token');
    
    // If no token, bounce to Login immediately
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If token exists, let them pass
    return <Outlet />;
};

export default ProtectedRoute;