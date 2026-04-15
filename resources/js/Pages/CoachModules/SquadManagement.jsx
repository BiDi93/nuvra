import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PendingRequests from './PendingRequest';

export default function SquadManagement() {
    const navigate = useNavigate();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    const token   = localStorage.getItem("auth_token");
    const coachId = localStorage.getItem("coach_id");

    const fetchTeam = () => {
        fetch(`/api/coach/${coachId}/players`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => { setTeam(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchTeam(); }, [coachId, token]);

    if (loading) return (
        <div className="flex items-center justify-center py-32 text-gray-400 text-sm font-bold tracking-widest">
            LOADING ROSTER...
        </div>
    );

    return (
        <div>
            <Toaster position="top-right" />

            {/* Page Header */}
            <div className="mb-8">
                <p className="text-xs font-bold text-purple-500 tracking-widest uppercase mb-1">NUVRA · CLUB PORTAL</p>
                <h1 className="text-3xl font-black text-gray-900">Squad Management</h1>
                <p className="text-gray-500 text-sm mt-1">View and manage your registered players.</p>
            </div>

            {/* Pending Requests */}
            <PendingRequests coachId={coachId} onActionComplete={fetchTeam} />

            {/* Active Roster */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black text-gray-700 tracking-widest uppercase">Active Roster</h2>
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {team.length} players
                    </span>
                </div>
            </div>

            {team.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-gray-800 font-bold text-sm tracking-wide">NO ACTIVE PLAYERS</p>
                    <p className="text-gray-400 text-sm mt-1">Players will appear here once approved.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {team.map(player => (
                        <div
                            key={player.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            {/* Card top accent */}
                            <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-violet-600" />

                            <div className="p-5">
                                {/* Avatar + Jersey */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-100 flex-shrink-0">
                                        <img
                                            src={player.profile_image || "/avatar-placeholder.png"}
                                            alt={player.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-3xl font-black text-gray-100 leading-none">
                                        #{player.jersey_number || "–"}
                                    </span>
                                </div>

                                {/* Name + Email */}
                                <p className="font-black text-gray-900 text-sm truncate">{player.name}</p>
                                <p className="text-gray-400 text-xs truncate mt-0.5 mb-3">{player.email}</p>

                                {/* Position badge */}
                                <span className="inline-block bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded mb-4">
                                    {player.position || "PLAYER"}
                                </span>

                                {/* Divider + Action */}
                                <div className="border-t border-gray-100 pt-3">
                                    <button
                                        onClick={() => navigate(`/coach/player/${player.id}`)}
                                        className="text-purple-600 hover:text-purple-800 text-[11px] font-bold tracking-wider uppercase transition-colors"
                                    >
                                        VIEW STATS →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
