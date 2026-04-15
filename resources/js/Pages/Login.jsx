import React from 'react';
import DynamicBackground from '../Components/DynamicBackground';
import PageLoader from '../Components/PageLoader';

const Login = () => {

    // This simply redirects the user to your Laravel Backend
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8000/auth/google";
    };

    return (
        <div className="portal-root min-h-screen flex items-center justify-center text-white relative">
            <PageLoader />
            <DynamicBackground />
            <div className="glass-panel p-8 w-96 text-center relative z-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" className="h-10 w-10 object-contain" />
                    <span className="text-2xl font-black text-white tracking-tighter">
                        NUVRA
                    </span>
                </div>
                <p className="text-gray-400 mb-6">Join the Elite Squad</p>

                {/* The Magic Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        className="w-5 h-5 mr-3"
                        alt="Google"
                    />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default Login;