import React from 'react';

const Login = () => {

    // This simply redirects the user to your Laravel Backend
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8000/auth/google";
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" className="h-12 w-12 object-cover object-left" />
                    <span className="text-2xl font-black text-white tracking-tighter">
                        NUVRA
                    </span>
                </div>
                <p className="text-gray-400 mb-6">Join the Elite Squad</p>

                {/* The Magic Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-gray-900 font-bold py-3 px-4 rounded flex items-center justify-center hover:bg-gray-200 transition"
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