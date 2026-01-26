import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // 1. Grab data from URL
        const token = searchParams.get('token');
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const userId = searchParams.get('user_id');

        if (token) {
            // 2. Save to Local Storage (The Bridge!)
            localStorage.setItem('auth_token', token);
            localStorage.setItem('currentUser', userId); // Optional, if you use it

            // 3. Smart Redirect Logic (Same as your AuthPage)
            if (role === 'coach') {
                navigate('/coach-dashboard');
            } else {
                // Player Logic
                if (status === 'pending') {
                    navigate('/waiting-room');
                } else if (status === 'active') {
                    navigate('/dashboard');
                } else {
                    // Fallback for 'rejected' or unknown
                    navigate('/login'); 
                }
            }
        } else {
            // If something failed, go back to login
            navigate('/login');
        }
    }, [navigate, searchParams]);

    return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-500 font-bold">Finishing Sign In...</span>
        </div>
    );
};

export default GoogleCallback;