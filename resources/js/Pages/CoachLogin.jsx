import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CoachLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        setError("");

        fetch('/api/coach/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(async res => {
            if (!res.ok) throw new Error("Invalid credentials");
            return res.json();
        })
        .then(data => {
            // Save Coach Data specifically
            localStorage.setItem("currentCoach", JSON.stringify(data));
            navigate("/coach-dashboard"); 
        })
        .catch(err => setError(err.message));
    };

    return (
        <div className="min-h-screen flex w-full bg-gray-900 font-sans overflow-hidden">
            {/* Left Side - Dark / Serious Theme for Coaches */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover opacity-40"/>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-16">
                    <h2 className="text-5xl font-black text-white mb-4">Build Your Legacy.</h2>
                    <p className="text-gray-400 text-xl">Manage your squad, analyze performance, and lead them to victory.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-900">
                <div className="w-full max-w-md p-10 bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl">
                    <h1 className="text-4xl font-black text-white mb-2">Coach Portal</h1>
                    <p className="text-gray-400 mb-8">Secure access for Team Staff only.</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="text-gray-300 text-sm font-bold mb-2 block">Coach Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="coach@nuvra.com" />
                        </div>
                        <div>
                            <label className="text-gray-300 text-sm font-bold mb-2 block">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="••••••••" />
                        </div>
                        
                        {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

                        <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all">
                            Access Dashboard
                        </button>
                    </form>

                    <button onClick={() => navigate('/')} className="mt-8 text-gray-500 text-sm hover:text-white w-full text-center">
                        ← Back to Player Login
                    </button>
                </div>
            </div>
        </div>
    );
}