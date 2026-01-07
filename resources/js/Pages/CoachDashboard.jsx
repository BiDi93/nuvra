import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CoachDashboard() {
    const navigate = useNavigate();
    const [coach, setCoach] = useState(null);
    const [team, setTeam] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);

    // New Player Form State
    const [newPlayer, setNewPlayer] = useState({
        name: '', email: '', position: 'Forward', 
        jersey_number: '', height_cm: '', strong_foot: 'right'
    });

    useEffect(() => {
        // 1. Get Coach Data from LocalStorage
        const storedCoach = localStorage.getItem('currentCoach');
        if (!storedCoach) { navigate('/coach'); return; }
        
        const parsedCoach = JSON.parse(storedCoach);
        setCoach(parsedCoach);

        // 2. Fetch YOUR Team (Only players linked to this coach)
        fetch(`/api/coach/${parsedCoach.id}/players`)
            .then(res => res.json())
            .then(data => setTeam(data))
            .catch(err => console.error(err));
    }, []);

    const handleAddPlayer = (e) => {
        e.preventDefault();
        fetch(`/api/coach/${coach.id}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlayer)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            setShowAddModal(false);
            // Reload team to see the new player
            window.location.reload(); 
        })
        .catch(err => alert("Error adding player"));
    };

    const handleLogout = () => {
        localStorage.removeItem('currentCoach');
        navigate('/coach');
    };

    if (!coach) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading Staff Portal...</div>;

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
            
            {/* 1. SIDEBAR (Dark Theme for Coaches to differentiate from Players) */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex shadow-2xl z-20">
                <div className="p-8">
                    <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">NUVRA</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-2 font-bold">Staff Portal</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 bg-purple-600 rounded-xl font-bold text-white cursor-pointer shadow-lg shadow-purple-900/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <span>Squad Management</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 rounded-xl font-medium cursor-pointer transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <span>Team Analytics</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 rounded-xl font-medium cursor-pointer transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Schedule</span>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors font-bold text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* 2. MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto relative flex flex-col">
                
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{coach.team_name}</h2>
                        <p className="text-sm text-gray-500 font-medium">Head Coach: <span className="text-gray-900">{coach.name}</span></p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Scout New Player
                    </button>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 max-w-7xl mx-auto w-full">
                    
                    {/* Squad Overview Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {team.map(player => (
                            <div key={player.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                
                                <div className="relative z-10 flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-md overflow-hidden">
                                        <img src={player.profile_image || "/avatar-placeholder.png"} alt={player.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">{player.position}</span>
                                        <div className="mt-2 text-4xl font-black text-gray-200">#{player.jersey_number}</div>
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 relative z-10">{player.name}</h3>
                                <p className="text-sm text-gray-500 mb-4">{player.email}</p>
                                
                                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                    <button className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors">View Stats →</button>
                                    <button className="text-gray-300 hover:text-red-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {/* Empty State if no players */}
                        {team.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                                <p className="text-gray-400 font-bold mb-2">Your squad is empty.</p>
                                <button onClick={() => setShowAddModal(true)} className="text-purple-600 font-bold hover:underline">Scout your first player now</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. ADD PLAYER MODAL */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">✕</button>
                            
                            <h2 className="text-2xl font-black text-gray-900 mb-1">Scout New Talent</h2>
                            <p className="text-sm text-gray-500 mb-6">Add a player to your roster. Default password: <span className="font-mono text-purple-600">welcome123</span></p>
                            
                            <form onSubmit={handleAddPlayer} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                        <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" required
                                            placeholder="e.g. Ali Hassan"
                                            value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jersey #</label>
                                        <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" required
                                            placeholder="10"
                                            value={newPlayer.jersey_number} onChange={e => setNewPlayer({...newPlayer, jersey_number: e.target.value})} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                    <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" required
                                        placeholder="player@email.com"
                                        value={newPlayer.email} onChange={e => setNewPlayer({...newPlayer, email: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Position</label>
                                        <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={newPlayer.position} onChange={e => setNewPlayer({...newPlayer, position: e.target.value})}>
                                            <option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Strong Foot</label>
                                        <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={newPlayer.strong_foot} onChange={e => setNewPlayer({...newPlayer, strong_foot: e.target.value})}>
                                            <option value="right">Right</option><option value="left">Left</option><option value="both">Both</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Height (cm)</label>
                                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" required
                                        placeholder="180"
                                        value={newPlayer.height_cm} onChange={e => setNewPlayer({...newPlayer, height_cm: e.target.value})} />
                                </div>

                                <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-lg">
                                    Add Player to Squad
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}