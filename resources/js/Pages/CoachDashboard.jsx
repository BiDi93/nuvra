import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CoachDashboard() {
    const navigate = useNavigate();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock Coach Data (In real app, fetch this from API/Auth)
    const coachName = "Coach Carter";
    const teamName = "NUVRA Varsity";

    useEffect(() => {
        fetch('/api/teams')
            .then(res => res.json())
            .then(data => {
                setTeam(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleLogout = () => {
        // Clear tokens if any
        navigate('/coach');
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
            
            {/* 1. UPDATED SIDEBAR */}
            <aside className="w-72 bg-[#1a1c23] flex flex-col shadow-xl z-20">
                <div className="p-8">
                    <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        NUVRA
                    </h1>
                    <p className="text-gray-500 text-xs font-bold tracking-widest mt-1">STAFF PORTAL</p>
                </div>

                <nav className="flex-1 px-4 space-y-3">
                    {/* Active Tab: Squad Management */}
                    <button className="flex items-center gap-3 w-full px-4 py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Squad Management
                    </button>

                    {/* NEW SIDEBAR ITEM: Record Stats */}
                    <button 
                        onClick={() => navigate('/coach/add-stats')}
                        className="flex items-center gap-3 w-full px-4 py-4 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl font-bold transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        Record Match Stats
                    </button>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-white/5 rounded-xl transition-colors font-bold text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto relative flex flex-col">
                
                {/* 2. CLEANER HEADER (Removed Buttons) */}
                <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">{teamName}</h2>
                        <p className="text-gray-400 font-medium">Head Coach: <span className="text-gray-900">{coachName}</span></p>
                    </div>
                    
                    <div className="text-right">
                        <h1 className="text-2xl font-black text-gray-900">Team Overview</h1>
                        <p className="text-sm text-gray-400">Manage your squad and performance.</p>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
                    
                    {/* Active Squad Grid */}
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Active Roster</h3>
                        
                        {loading ? (
                            <div className="text-gray-400 font-bold p-10 text-center">Loading Roster...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {team.map(player => (
                                    <div key={player.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                                        
                                        {/* Top Card Content */}
                                        <div>
                                            <div className="relative z-10 flex items-start justify-between mb-4">
                                                <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-md overflow-hidden">
                                                    <img src={player.profile_image || "/avatar-placeholder.png"} alt={player.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="text-right">
                                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">{player.position}</span>
                                                    <div className="mt-2 text-4xl font-black text-gray-200">#{player.jersey_number || '-'}</div>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 relative z-10">{player.name}</h3>
                                            <p className="text-sm text-gray-500 mb-4">{player.email}</p>
                                        </div>

                                        {/* Bottom Action Bar */}
                                        <div className="border-t border-gray-100 pt-4 flex justify-between items-center mt-2">
                                            <button 
                                                onClick={() => navigate(`/coach/player/${player.id}`)} 
                                                className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
                                            >
                                                View Stats <span>→</span>
                                            </button>
                                            
                                            <button className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>

                                    </div>
                                ))}
                                {team.length === 0 && <p className="text-gray-400">No active players found.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}