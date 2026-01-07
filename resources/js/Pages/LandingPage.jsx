import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();


    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        setError("");

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email,
                password: password 
            })
        })
        .then(async res => {
            if (!res.ok) {
                const text = await res.json();
                throw new Error(text.message || "Login failed");
            }
            return res.json();
        })
        .then(data => {
            localStorage.setItem("currentUser", data.player_id);
            navigate("/dashboard");
        })
        .catch(err => {
            setError(err.message);
        });
    };

    return (
        <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">
            {/* Left Image Panel (No Changes) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
                <img src="/images/image_landing_page.jpeg" alt="Football Player" className="w-full h-full object-cover object-center opacity-90"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-12 z-20">
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Dominate the Pitch.</h2>
                    <p className="text-xl text-gray-300 max-w-md leading-relaxed">Data-driven insights to elevate your game to the next level.</p>
                </div>
            </div>

            {/* Right Login Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-full max-w-md p-10 bg-white rounded-3xl shadow-2xl border border-gray-100 z-10 relative">
                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 tracking-tighter">NUVRA</h1>
                        <p className="text-gray-500 font-medium mt-3">Player & Scout Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        
                        {/* 3. Email Input */}
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2 pl-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                                placeholder="player@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2 pl-1">Password</label>
                            <input
                                type="password"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-lg flex items-center gap-2">
                                ⚠ {error}
                            </div>
                        )}

                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
                            Enter Arena
                        </button>
                        
                        <div className="mt-8 flex justify-center text-sm">
                            <button type="button" onClick={() => navigate("/coach")} className="text-purple-600 hover:text-purple-800 font-bold transition-colors">
                                Switch to Coach Login →
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}