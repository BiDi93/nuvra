import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SquadManagement() {
    const navigate = useNavigate();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

useEffect(() => {
        // Fetch Players for the Coach's Team
        const coachId = 1; 
        fetch(`/api/coach/${coachId}/players`) 
            .then(res => res.json())
            .then(data => {
                setTeam(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return <div className="text-gray-400 font-bold p-10 text-center">Loading Roster...</div>;

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <h3 className="text-xl font-bold text-gray-900">Active Roster</h3>
                <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">{team.length} Players</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map(player => (
                    <div key={player.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
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

                        <div className="border-t border-gray-100 pt-4 flex justify-between items-center mt-2">
                            <button onClick={() => navigate(`/coach/player/${player.id}`)} className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1">
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
    );
}