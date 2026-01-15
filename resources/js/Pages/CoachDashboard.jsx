import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CoachDashboard() {
    const navigate = useNavigate();
    const [coach, setCoach] = useState(null);
    const [team, setTeam] = useState([]);
    const [requests, setRequests] = useState([]); 
    const [showAddModal, setShowAddModal] = useState(false);

    // New Player Form State
    const [newPlayer, setNewPlayer] = useState({
        name: '', email: '', position: 'Forward', 
        jersey_number: '', height_cm: '', strong_foot: 'right'
    });

    useEffect(() => {
        // 1. Get Coach Data
        const storedCoach = localStorage.getItem('currentCoach');
        if (!storedCoach) { navigate('/coach'); return; }
        
        const parsedCoach = JSON.parse(storedCoach);
        setCoach(parsedCoach);

        // 2. Fetch Active Team
        fetch(`/api/coach/${parsedCoach.id}/players`)
            .then(res => res.json())
            .then(data => setTeam(data))
            .catch(err => console.error(err));

        // 3. Fetch Pending Requests (The Gatekeeper Logic)
        fetch(`/api/coach/${parsedCoach.id}/requests`)
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(err => console.error(err));

    }, []);

    // Handle Approve / Decline
    const handleRequest = (playerId, action) => {
        fetch(`/api/coach/${coach.id}/requests/${playerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }) // 'approve' or 'decline'
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            window.location.reload(); // Refresh to update lists
        })
        .catch(err => alert("Error processing request"));
    };

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
            
            {/* SIDEBAR */}
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
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors font-bold text-sm">
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto relative flex flex-col">
                
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{coach.team_name}</h2>
                        <p className="text-sm text-gray-500 font-medium">Head Coach: <span className="text-gray-900">{coach.name}</span></p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2">
                        + Scout New Player
                    </button>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
                    
                    {/* --- NEW SECTION: PENDING REQUESTS --- */}
                    {requests.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-3xl p-6 shadow-sm animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">!</span>
                                <h3 className="text-xl font-black text-yellow-800">New Applications ({requests.length})</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {requests.map(req => (
                                    <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-yellow-200 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-900">{req.name}</h4>
                                                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">{req.position}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{req.age} years old • {req.address}</p>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button onClick={() => handleRequest(req.id, 'approve')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold text-sm transition-colors">
                                                Approve
                                            </button>
                                            <button onClick={() => handleRequest(req.id, 'decline')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg font-bold text-sm transition-colors">
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Squad Grid */}
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Active Roster</h3>
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

                                    {/* NEW: Bottom Action Bar */}
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
                    </div>
                </div>

                {/* MODAL (Same as before) */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                         <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                            {/* ... (Keep modal form code exactly the same as previous step) ... */}
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-gray-400">✕</button>
                            <h2 className="text-2xl font-bold mb-4">Add Player Manually</h2>
                            <form onSubmit={handleAddPlayer}>
                                {/* ... form inputs ... */}
                                <button className="w-full bg-black text-white py-3 rounded-xl font-bold">Add Player</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}