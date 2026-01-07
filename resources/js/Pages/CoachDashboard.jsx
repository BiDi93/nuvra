import React, { useState, useEffect } from 'react';

export default function CoachDashboard() {
    const [players, setPlayers] = useState([]);
    
    // Modals State
    const [showPlayerForm, setShowPlayerForm] = useState(false);
    const [showMatchForm, setShowMatchForm] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null); // Who are we adding stats for?

    // Forms Data
    const [playerData, setPlayerData] = useState({
        name: '', position: 'Striker', jersey_number: '', strong_foot: 'right', height_cm: ''
    });

    const [matchData, setMatchData] = useState({
        match_date: '', opponent_name: '', minutes_played: 90, goals: 0, assists: 0, rating: 7.0
    });

    // 1. Fetch Players
    useEffect(() => {
        fetch('/api/players').then(res => res.json()).then(data => setPlayers(data));
    }, []);

    // 2. Handle New Player
    const handlePlayerSubmit = (e) => {
        e.preventDefault();
        fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(playerData)
        })
        .then(res => res.json())
        .then(newPlayer => {
            setPlayers([...players, { ...playerData, id: newPlayer.id }]);
            setShowPlayerForm(false);
        });
    };

    // 3. Handle Match Stats (THE NEW PART)
    const handleMatchSubmit = (e) => {
        e.preventDefault();
        
        const payload = { ...matchData, player_id: selectedPlayer.id };

        fetch('/api/performances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async res => {
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }
            return res.json();
        })
        .then(() => {
            alert(`Stats saved for ${selectedPlayer.name}!`);
            setShowMatchForm(false);
            setMatchData({ match_date: '', opponent_name: '', minutes_played: 90, goals: 0, assists: 0, rating: 7.0 });
        })
        .catch(err => alert("Error: " + err.message));
    };

    const openMatchModal = (player) => {
        setSelectedPlayer(player);
        setShowMatchForm(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
            {/* Header */}
            <nav className="bg-white shadow px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-purple-700">NUVRA <span className="text-gray-400 font-normal text-sm">| Manager Mode</span></h1>
                <button onClick={() => setShowPlayerForm(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-bold shadow">
                    + Scout New Talent
                </button>
            </nav>

            {/* List */}
            <div className="p-8 max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-sm font-bold text-gray-500">Jersey</th>
                                <th className="p-4 text-sm font-bold text-gray-500">Name</th>
                                <th className="p-4 text-sm font-bold text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {players.map(player => (
                                <tr key={player.id} className="hover:bg-purple-50 transition">
                                    <td className="p-4 font-bold text-gray-700">#{player.jersey_number}</td>
                                    <td className="p-4 font-medium">{player.name}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => openMatchModal(player)}
                                            className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-sm font-bold border border-green-200"
                                        >
                                            + Log Match Stats
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- PLAYER FORM MODAL (Keep your existing one, simplified here) --- */}
            {showPlayerForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Add New Player</h2>
                        <form onSubmit={handlePlayerSubmit} className="space-y-4">
                            <input className="w-full border p-2 rounded" placeholder="Name" value={playerData.name} onChange={e=>setPlayerData({...playerData, name:e.target.value})} />
                            <input className="w-full border p-2 rounded" placeholder="Jersey" value={playerData.jersey_number} onChange={e=>setPlayerData({...playerData, jersey_number:e.target.value})} />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowPlayerForm(false)} className="px-4 py-2">Cancel</button>
                                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MATCH STATS MODAL (NEW) --- */}
            {showMatchForm && selectedPlayer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-2">Log Match: {selectedPlayer.name}</h2>
                        <p className="text-sm text-gray-500 mb-4">Enter stats for the latest game.</p>
                        
                        <form onSubmit={handleMatchSubmit} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500">Opponent Team</label>
                                <input className="w-full border p-2 rounded" value={matchData.opponent_name} onChange={e=>setMatchData({...matchData, opponent_name:e.target.value})} required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Date</label>
                                <input type="date" className="w-full border p-2 rounded" value={matchData.match_date} onChange={e=>setMatchData({...matchData, match_date:e.target.value})} required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Goals Scored</label>
                                    <input type="number" className="w-full border p-2 rounded font-bold text-purple-600" value={matchData.goals} onChange={e=>setMatchData({...matchData, goals:e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Assists</label>
                                    <input type="number" className="w-full border p-2 rounded" value={matchData.assists} onChange={e=>setMatchData({...matchData, assists:e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Rating (1-10)</label>
                                    <input type="number" step="0.1" className="w-full border p-2 rounded" value={matchData.rating} onChange={e=>setMatchData({...matchData, rating:e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Minutes</label>
                                    <input type="number" className="w-full border p-2 rounded" value={matchData.minutes_played} onChange={e=>setMatchData({...matchData, minutes_played:e.target.value})} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowMatchForm(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold">Save Stats</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}