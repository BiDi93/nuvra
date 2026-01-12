import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    
    // Login State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Sign Up State
    const [teams, setTeams] = useState([]);
    const [formData, setFormData] = useState({
        name: '', age: '', address: '', position: 'Forward',
        email: '', password: '', coach_id: ''
    });

    useEffect(() => {
        if (!isLogin) {
            fetch('/api/teams').then(res => res.json()).then(data => setTeams(data));
        }
    }, [isLogin]);

    const handleLogin = (e) => {
        e.preventDefault();
        setError("");
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(async res => {
            if (!res.ok) throw new Error("Invalid credentials");
            return res.json();
        })
        .then(data => {
            localStorage.setItem("currentUser", data.player_id);
            navigate("/dashboard");
        })
        .catch(err => setError(err.message));
    };

    const handleSignUp = (e) => {
        e.preventDefault();
        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(async res => {
            if (!res.ok) throw new Error("Registration failed");
            return res.json();
        })
        .then(data => {
            alert(data.message);
            setIsLogin(true);
        })
        .catch(err => alert(err.message));
    };

    return (
        <div className="relative min-h-screen w-full font-sans overflow-hidden flex items-center justify-center">
            
            {/* 1. BACKGROUND LAYER (Full Screen Image) */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/images/landingPage/image_landing_page.jpeg" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                />
                {/* Dark Gradient Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-purple-900/40 backdrop-blur-[2px]"></div>
            </div>

            {/* 2. CONTENT LAYER (Floating Card) */}
            <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
                
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-tighter drop-shadow-2xl">
                        NUVRA
                    </h1>
                    <p className="text-gray-300 font-medium tracking-widest text-sm uppercase mt-2">
                        {isLogin ? "Player Intelligence System" : "Join the Future of Football"}
                    </p>
                </div>

                {/* Glassmorphism Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                    
                    {/* Toggle Switch */}
                    <div className="flex bg-black/20 p-1 rounded-xl mb-8">
                        <button 
                            onClick={() => setIsLogin(true)} 
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${isLogin ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => setIsLogin(false)} 
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${!isLogin ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Forms */}
                    {isLogin ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-300 uppercase pl-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-black/40 transition-all font-medium"
                                    placeholder="player@nuvra.com" 
                                    required 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-300 uppercase pl-1">Password</label>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-black/40 transition-all font-medium"
                                    placeholder="••••••••" 
                                    required 
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                                    <span className="text-red-200 text-sm font-bold">⚠ {error}</span>
                                </div>
                            )}

                            <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-lg rounded-xl shadow-lg shadow-purple-900/30 transform transition hover:-translate-y-1">
                                ENTER ARENA
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignUp} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input className="p-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                                    placeholder="Full Name" required 
                                    onChange={e => setFormData({...formData, name: e.target.value})} />
                                <input className="p-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                                    placeholder="Age" type="number" required 
                                    onChange={e => setFormData({...formData, age: e.target.value})} />
                            </div>
                            
                            <input className="p-3 bg-black/20 border border-white/10 rounded-xl w-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                                placeholder="Address" required 
                                onChange={e => setFormData({...formData, address: e.target.value})} />
                            
                            <div className="grid grid-cols-2 gap-3">
                                <select className="p-3 bg-black/20 border border-white/10 rounded-xl w-full text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer" 
                                    required 
                                    onChange={e => setFormData({...formData, coach_id: e.target.value})}>
                                    <option value="" className="text-gray-900">Select Team</option>
                                    {teams.map(t => <option key={t.id} value={t.id} className="text-gray-900">{t.team_name}</option>)}
                                </select>
                                <select className="p-3 bg-black/20 border border-white/10 rounded-xl w-full text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer" 
                                    onChange={e => setFormData({...formData, position: e.target.value})}>
                                    <option className="text-gray-900">Forward</option>
                                    <option className="text-gray-900">Midfielder</option>
                                    <option className="text-gray-900">Defender</option>
                                    <option className="text-gray-900">Goalkeeper</option>
                                </select>
                            </div>

                            <input className="p-3 bg-black/20 border border-white/10 rounded-xl w-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                                type="email" placeholder="Email" required 
                                onChange={e => setFormData({...formData, email: e.target.value})} />
                            
                            <input className="p-3 bg-black/20 border border-white/10 rounded-xl w-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                                type="password" placeholder="Password" required 
                                onChange={e => setFormData({...formData, password: e.target.value})} />

                            <button className="w-full py-4 bg-white text-gray-900 font-black text-lg rounded-xl hover:bg-gray-100 mt-2 transform transition hover:-translate-y-1 shadow-lg">
                                SUBMIT APPLICATION
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <button onClick={() => navigate("/coach")} className="text-white/50 text-sm font-bold hover:text-white transition-colors">
                        Coach Login Portal →
                    </button>
                </div>
            </div>
        </div>
    );
}