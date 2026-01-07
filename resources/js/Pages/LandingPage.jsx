import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
    const navigate = useNavigate();

    // State Definitions
    const [playerId, setPlayerId] = useState("");
    const [error, setError] = useState("");

    // Login Logic
    const handleLogin = (e) => {
        e.preventDefault();
        if (!playerId) {
            setError("Please enter your Player ID");
            return;
        }
        fetch(`/api/players/${playerId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Player not found");
                return res.json();
            })
            .then((data) => {
                localStorage.setItem("currentUser", playerId);
                navigate("/dashboard");
            })
            .catch((err) => {
                setError("Invalid ID. Please check with your Coach.");
            });
    };

    return (
        // Main Container - Split Screen Flex Row
        <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">
            
            {/* LEFT PANEL - YOUR IMAGE SECTION */}
            <div className="lg:flex lg:w-1/2 relative bg-gray-900">
                <img 
                    // This points to the file you put in the 'public' folder
                    src="../../images/landingPage/image_landing_page.jpeg" 
                    alt="Football Player" 
                    className="w-full h-full object-cover object-center opacity-90"
                />
                {/* Gradient Overlay for depth and text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* Text over Image */}
                <div className="absolute bottom-0 left-0 p-12 z-20">
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-4">
                        Dominate the Pitch.
                    </h2>
                    <p className="text-xl text-gray-300 max-w-md leading-relaxed">
                        Data-driven insights to elevate your game to the next level.
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL - LOGIN FORM SECTION */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-gradient-to-br from-gray-50 to-gray-100">

                {/* Login Card */}
                <div className="w-full max-w-md p-10 bg-white rounded-3xl shadow-2xl border border-gray-100 z-10 relative">
                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 tracking-tighter">
                            NUVRA
                        </h1>
                        <p className="text-gray-500 font-medium mt-3">
                            Player & Scout Portal
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2 pl-1">
                                Player ID (System ID)
                            </label>
                            <input
                                type="number"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                                placeholder="e.g. 1 or 2"
                                value={playerId}
                                onChange={(e) => setPlayerId(e.target.value)}
                            />
                            {error && (
                                <p className="text-red-500 text-sm mt-3 font-bold pl-1">⚠ {error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
                        >
                            Enter Arena
                        </button>
                        
                        <div className="mt-8 flex justify-center text-sm">
                            <button
                                type="button"
                                onClick={() => navigate("/coach")}
                                className="text-purple-600 hover:text-purple-800 font-bold transition-colors"
                            >
                                Switch to Coach Login →
                            </button>
                        </div>
                    </form>
                     <div className="mt-10 border-t border-gray-100 pt-6 text-center">
                        <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                            © 2026 NUVRA Systems
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}