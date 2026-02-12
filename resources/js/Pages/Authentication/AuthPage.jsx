import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const navigate = useNavigate();

    // Modes: 'selection', 'signup', 'login'
    const [view, setView] = useState('selection');

    // Role Toggle: 'player' or 'coach'
    const [role, setRole] = useState('player');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    const handleGoogleLogin = () => {
        // NOTE: Google Auth logic needs to handle roles on the backend callback
        // window.location.href = "http://localhost:8000/auth/google";
        // Dynamic URL
        window.location.href = "/auth/google";
    };

    // --- SMART LOGIN HANDLER (Fixes the Loop!) ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login', {
                email: formData.email,
                password: formData.password
            });

            const { token, role, status } = res.data;
            localStorage.setItem('auth_token', token);

            // 🔀 SMART REDIRECT LOGIC
            if (role === 'coach') {
                navigate('/coach-dashboard');
            } else {
                // It's a Player
                if (status === 'pending') {
                    navigate('/waiting-room'); // ✅ Goes straight to waiting room
                } else if (status === 'active') {
                    navigate('/dashboard');
                } else {
                    alert("Your account status is: " + status);
                }
            }

        } catch (error) {
            console.error(error);
            alert("Invalid email or password.");
        }
    };

    // --- REGISTER HANDLER (Handles both Player & Coach) ---
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // We use the same register endpoint, but pass the 'role'
            const payload = { ...formData, role: role };

            const res = await axios.post('/api/register', payload);
            const { token, user_id } = res.data;

            localStorage.setItem('auth_token', token);

            if (role === 'coach') {
                navigate('/coach-dashboard'); // Or a coach onboarding page if you have one
            } else {
                navigate(`/onboarding?token=${token}&user_id=${user_id}`);
            }

        } catch (error) {
            console.error(error);
            alert("Registration failed. Email might already be taken.");
        }
    };

    return (
        <div className="h-screen flex flex-col font-sans text-gray-900 overflow-hidden">

            {/* --- HEADER --- */}
            <header className="flex-none flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100 z-50">
                <div
                    onClick={() => setView('selection')}
                    className="cursor-pointer flex items-center gap-2"
                >
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" className="h-12 w-12 object-cover object-left" />
                    <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                        NUVRA
                    </span>
                </div>

                <nav className="hidden md:flex gap-8 text-sm font-bold text-gray-500">
                    <a href="#" className="hover:text-purple-600 transition">About Us</a>
                    <a href="#" className="hover:text-purple-600 transition">Features</a>
                    <a href="#" className="hover:text-purple-600 transition">Support</a>
                </nav>

                <div className="w-[100px] flex justify-end">
                    {view === 'login' ? (
                        <button
                            onClick={() => setView('selection')}
                            className="text-sm font-bold text-purple-600 border border-purple-200 px-4 py-2 rounded-full hover:bg-purple-50 transition"
                        >
                            Sign Up
                        </button>
                    ) : (
                        <button
                            onClick={() => setView('login')}
                            className="text-sm font-bold text-gray-900 border border-gray-300 px-4 py-2 rounded-full hover:bg-gray-50 transition"
                        >
                            Log In
                        </button>
                    )}
                </div>
            </header>

            {/* --- MAIN SPLIT CONTENT --- */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT SIDE: STATIC IMAGE */}
                <div className="hidden md:block md:w-2/3 bg-gray-900 relative h-full">
                    <img
                        src={role === 'coach' ? "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2670" : "/images/landingPage/landing_page.jpeg"}
                        alt="Motivation"
                        className="absolute inset-0 w-full h-full object-cover opacity-50 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                    <div className="absolute bottom-12 left-12 text-white max-w-lg">
                        <h1 className="text-5xl font-black leading-tight mb-4">
                            {role === 'coach' ? "Command your team." : "Elevate your squad's performance."}
                        </h1>
                        <p className="text-xl font-medium text-gray-300">
                            {role === 'coach' ? "Strategize, manage, and lead your players to victory." : "Join the elite platform where champions are managed and stats are made."}
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE: SCROLLABLE CONTENT */}
                <div className="w-full md:w-1/3 bg-white flex flex-col overflow-y-auto h-full">
                    <div className="flex-grow flex flex-col justify-center px-8 py-12 md:px-16 shadow-2xl z-10 relative min-h-min">

                        {/* --- VIEW 1: SELECTION --- */}
                        {view === 'selection' && (
                            <div className="animate-fade-in-up">
                                <div className="text-center mb-8">
                                    <span className="text-xs font-bold text-purple-600 tracking-widest uppercase mb-2 block">
                                        {role === 'player' ? 'For Players' : 'For Coaches'}
                                    </span>
                                    <h2 className="text-3xl font-bold mb-2 text-gray-900">Get Started</h2>
                                    <p className="text-gray-500">
                                        {role === 'player' ? "Join the squad today." : "Create your team workspace."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleGoogleLogin}
                                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm"
                                    >
                                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                                        {role === 'player' ? 'Sign up with Google' : 'Coach Sign up with Google'}
                                    </button>
                                    <button
                                        onClick={() => setView('signup')}
                                        className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200"
                                    >
                                        Sign up with Email
                                    </button>
                                </div>

                                {/* COACH TOGGLE LINK */}
                                <div className="mt-8 text-center pt-8 border-t border-gray-100">
                                    {role === 'player' ? (
                                        <p className="text-sm text-gray-400">
                                            Are you a Coach? <button onClick={() => setRole('coach')} className="text-purple-600 font-bold hover:underline">Access Coach Portal</button>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            Are you a Player? <button onClick={() => setRole('player')} className="text-purple-600 font-bold hover:underline">Go to Player App</button>
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-500">Already have an account?</p>
                                    <button onClick={() => setView('login')} className="text-purple-600 font-bold hover:underline">Log in here</button>
                                </div>
                            </div>
                        )}

                        {/* --- VIEW 2: SIGN UP FORM --- */}
                        {view === 'signup' && (
                            <div className="animate-fade-in-up">
                                <button onClick={() => setView('selection')} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-2 text-sm font-bold">← Back</button>
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">
                                    Create {role === 'coach' ? 'Coach' : 'Player'} Account
                                </h2>
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Your Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                        <input type="email" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                        <input type="password" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                                        <input type="password" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" value={formData.password_confirmation} onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })} required />
                                    </div>
                                    <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 mt-4">
                                        Create Account
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* --- VIEW 3: LOGIN FORM --- */}
                        {view === 'login' && (
                            <div className="animate-fade-in-up">
                                <button onClick={() => setView('selection')} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-2 text-sm font-bold">← Back</button>
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Welcome Back</h2>

                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition shadow-sm mb-6"
                                >
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                                    Log in with Google
                                </button>

                                <div className="relative flex items-center justify-center mb-6">
                                    <span className="absolute bg-white px-4 text-xs font-bold text-gray-400">OR LOGIN WITH EMAIL</span>
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                        <input type="email" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                        <input type="password" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                    </div>
                                    <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 mt-4">Log In</button>
                                </form>
                                <div className="mt-8 text-center">
                                    <p className="text-sm text-gray-500">Don't have an account?</p>
                                    <button onClick={() => setView('selection')} className="text-purple-600 font-bold hover:underline">Sign up here</button>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-gray-400 text-center mt-8 px-8">
                            By using Nuvra, you agree to our Terms of Service.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- FOOTER --- */}
            <footer className="flex-none bg-white border-t border-gray-100 py-6 text-center text-sm text-gray-400 font-medium">
                &copy; 2026 Nuvra Inc. All rights reserved.
            </footer>
        </div>
    );
};

export default AuthPage;