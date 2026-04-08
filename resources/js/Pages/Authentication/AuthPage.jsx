import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DynamicBackground from '../../Components/DynamicBackground';
import PageLoader from '../../Components/PageLoader';

const AuthPage = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('selection');
    const [role, setRole] = useState('player');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    const handleGoogleLogin = () => {
        window.location.href = "/auth/google";
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login', {
                email: formData.email,
                password: formData.password
            });
            const { token, role: userRole, status } = res.data;
            localStorage.setItem('auth_token', token);
            if (userRole === 'coach') {
                navigate('/coach-dashboard');
            } else {
                if (status === 'pending') {
                    navigate('/waiting-room');
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

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, role };
            const res = await axios.post('/api/register', payload);
            const { token, user_id } = res.data;
            localStorage.setItem('auth_token', token);
            if (role === 'coach') {
                navigate('/coach-dashboard');
            } else {
                navigate(`/onboarding?token=${token}&user_id=${user_id}`);
            }
        } catch (error) {
            console.error(error);
            alert("Registration failed. Email might already be taken.");
        }
    };

    const accentColor = role === 'player' ? 'var(--brand-cyan)' : 'var(--brand-magenta)';
    const btnGradient = role === 'player'
        ? 'linear-gradient(135deg, #00ff87, #00c9ff)'
        : 'linear-gradient(135deg, #a78bfa, #7c3aed)';
    const btnTextColor = role === 'player' ? '#080810' : '#fff';

    const inputCls = "w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg p-3 outline-none focus:border-[rgba(255,255,255,0.3)] transition placeholder-gray-600";
    const labelCls = "block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider";

    return (
        <div className="portal-root min-h-screen flex flex-col text-white relative">
            <PageLoader />
            <DynamicBackground />

            {/* HEADER */}
            <header className="flex-none flex items-center px-8 py-5 z-50 relative">
                <div onClick={() => setView('selection')} className="cursor-pointer flex items-center gap-3">
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" className="h-9 w-9 object-contain" />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, letterSpacing: 3 }}>
                        NUVRA
                    </span>
                </div>
            </header>

            {/* MAIN */}
            <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                <div className="glass-panel w-full max-w-md p-8">

                    {/* VIEW 1: SELECTION */}
                    {view === 'selection' && (
                        <div>
                            <div className="text-center mb-8">
                                <span className="text-xs font-bold tracking-widest uppercase mb-2 block" style={{ color: accentColor }}>
                                    {role === 'player' ? 'For Players' : 'For Clubs'}
                                </span>
                                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, letterSpacing: 2 }}>
                                    Join Nuvra
                                </h2>
                                <p className="text-gray-400 mt-2 text-sm">
                                    {role === 'player' ? "Join the squad today." : "Create your team workspace."}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white font-bold py-3 px-4 rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition"
                                >
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                                    {role === 'player' ? 'Continue with Google' : 'Club Sign up with Google'}
                                </button>
                                <button
                                    onClick={() => setView('signup')}
                                    className="w-full font-bold py-3 px-4 rounded-xl transition"
                                    style={{ background: btnGradient, color: btnTextColor }}
                                >
                                    Sign up with Email
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
                                {role === 'player' ? (
                                    <p className="text-sm text-gray-400 text-center">
                                        Manage a club?{' '}
                                        <button onClick={() => setRole('coach')} className="font-bold hover:text-white transition" style={{ color: 'var(--brand-magenta)' }}>
                                            Access Club Portal
                                        </button>
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center">
                                        Are you a Player?{' '}
                                        <button onClick={() => setRole('player')} className="font-bold hover:text-white transition" style={{ color: 'var(--brand-cyan)' }}>
                                            Go to Player Portal
                                        </button>
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-500">
                                    Already have an account?{' '}
                                    <button onClick={() => setView('login')} className="text-white font-bold hover:text-gray-300 transition">
                                        Log in
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* VIEW 2: SIGN UP */}
                    {view === 'signup' && (
                        <div>
                            <button onClick={() => setView('selection')} className="text-gray-500 hover:text-white mb-6 flex items-center gap-2 text-sm font-bold transition">
                                ← Back
                            </button>
                            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, letterSpacing: 2, marginBottom: 24 }}>
                                Create {role === 'coach' ? 'Club' : 'Player'} Account
                            </h2>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className={labelCls}>Full Name</label>
                                    <input type="text" className={inputCls} placeholder="Your Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelCls}>Email Address</label>
                                    <input type="email" className={inputCls} placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelCls}>Password</label>
                                    <input type="password" className={inputCls} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelCls}>Confirm Password</label>
                                    <input type="password" className={inputCls} placeholder="••••••••" value={formData.password_confirmation} onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })} required />
                                </div>
                                <button type="submit" className="w-full font-bold py-3 px-4 rounded-xl mt-2 transition" style={{ background: btnGradient, color: btnTextColor }}>
                                    Create Account
                                </button>
                            </form>
                        </div>
                    )}

                    {/* VIEW 3: LOGIN */}
                    {view === 'login' && (
                        <div>
                            <button onClick={() => setView('selection')} className="text-gray-500 hover:text-white mb-6 flex items-center gap-2 text-sm font-bold transition">
                                ← Back
                            </button>
                            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, letterSpacing: 2, marginBottom: 24 }}>
                                Welcome Back
                            </h2>

                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white font-bold py-3 px-4 rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition mb-5"
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                                Log in with Google
                            </button>

                            <div className="relative flex items-center justify-center mb-5">
                                <div className="w-full border-t border-[rgba(255,255,255,0.08)]"></div>
                                <span className="absolute bg-[rgba(8,8,10,0.9)] px-3 text-xs font-bold text-gray-600 uppercase tracking-widest">or</span>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className={labelCls}>Email Address</label>
                                    <input type="email" className={inputCls} placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelCls}>Password</label>
                                    <input type="password" className={inputCls} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                                <button type="submit" className="w-full bg-white text-gray-900 font-bold py-3 px-4 rounded-xl mt-2 hover:bg-gray-100 transition">
                                    Log In
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)] text-center">
                                <p className="text-sm text-gray-500">
                                    Don't have an account?{' '}
                                    <button onClick={() => setView('selection')} className="text-white font-bold hover:text-gray-300 transition">
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-gray-600 text-center mt-8">
                        By using Nuvra, you agree to our Terms of Service.
                    </p>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="flex-none py-5 text-center text-xs text-[rgba(255,255,255,0.2)] relative z-10">
                © 2026 Nuvra Inc. All rights reserved.
            </footer>
        </div>
    );
};

export default AuthPage;