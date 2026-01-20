import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CoachAddStats() {
    const navigate = useNavigate();
    const coachId = 1; // Assuming Coach ID 1 for now (or get from localStorage)
    
    // Lists for Dropdowns
    const [matches, setMatches] = useState([]);
    const [players, setPlayers] = useState([]);

    // Form Data
    const [formData, setFormData] = useState({
        match_id: '',
        player_id: '',
        minutes_played: '90',
        goals: '0',
        assists: '0',
        rating: ''
    });

    useEffect(() => {
        // 1. Fetch Matches
        fetch(`/api/coach/${coachId}/matches`)
            .then(res => res.json())
            .then(data => setMatches(data));

        // 2. Fetch Players (Reuse existing endpoint)
        fetch('/api/teams') // Assuming this returns all players for the coach
            .then(res => res.json())
            .then(data => setPlayers(data));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        fetch('/api/performances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(async res => {
            if (res.ok) {
                alert("Stats Saved Successfully! 📈");
                // Optional: Reset form or navigate back
                setFormData({...formData, rating: '', goals: '0', assists: '0'});
            } else {
                alert("Error saving stats");
            }
        });
    };

    // Shared Styles
    const labelStyle = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2";
    const inputStyle = "w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all";

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg border border-gray-100">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-black text-gray-900">Record Stats</h1>
                    <button onClick={() => navigate('/coach-dashboard')} className="text-sm font-bold text-gray-400 hover:text-gray-900">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* 1. Select Match */}
                    <div>
                        <label className={labelStyle}>Select Match</label>
                        <select 
                            className={inputStyle} 
                            required 
                            onChange={e => setFormData({...formData, match_id: e.target.value})}
                        >
                            <option value="">Choose a game...</option>
                            {matches.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.opponent_name} ({new Date(m.match_date).toLocaleDateString('en-GB')})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Select Player */}
                    <div>
                        <label className={labelStyle}>Select Player</label>
                        <select 
                            className={inputStyle} 
                            required 
                            onChange={e => setFormData({...formData, player_id: e.target.value})}
                        >
                            <option value="">Who played?</option>
                            {players.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (#{p.jersey_number || '00'})</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>Minutes</label>
                            <input type="number" className={inputStyle} value={formData.minutes_played} onChange={e => setFormData({...formData, minutes_played: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelStyle}>Rating (0-10)</label>
                            <input type="number" step="0.1" max="10" className={inputStyle} placeholder="e.g. 8.5" required onChange={e => setFormData({...formData, rating: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelStyle}>Goals</label>
                            <input type="number" className={inputStyle} value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelStyle}>Assists</label>
                            <input type="number" className={inputStyle} value={formData.assists} onChange={e => setFormData({...formData, assists: e.target.value})} />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 transform transition hover:-translate-y-1">
                        Save Performance
                    </button>

                </form>
            </div>
        </div>
    );
}