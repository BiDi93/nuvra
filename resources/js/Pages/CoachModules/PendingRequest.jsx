import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PendingRequests = ({ coachId, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const [acting, setActing] = useState(null);
    const token = localStorage.getItem('auth_token');

    useEffect(() => {
        if (!coachId) return;
        axios.get(`/api/coach/${coachId}/requests`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setRequests(res.data))
            .catch(err => console.error('Error fetching pending requests:', err));
    }, [coachId, token]);

    const handleAction = async (playerId, action) => {
        setActing(playerId);
        const prev = [...requests];
        setRequests(r => r.filter(p => p.id !== playerId));

        try {
            await axios.post(
                `/api/coach/${coachId}/request/${playerId}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onActionComplete) onActionComplete();
        } catch {
            setRequests(prev);
        } finally {
            setActing(null);
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
                        {requests.length}
                    </span>
                    <span className="text-[11px] font-black text-amber-700 tracking-widest uppercase">
                        Pending Approvals
                    </span>
                </div>
                <span className="text-xs text-amber-600">Review players who applied to join your team</span>
            </div>

            {/* List */}
            <div className="divide-y divide-amber-100">
                {requests.map(player => (
                    <div key={player.id} className="flex items-center gap-4 px-5 py-4 hover:bg-amber-100/40 transition-colors">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-200 bg-gray-100 flex-shrink-0">
                            <img
                                src={player.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=fef3c7&color=d97706&size=80`}
                                alt={player.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{player.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {player.position && (
                                    <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                        {player.position}
                                    </span>
                                )}
                                {player.jersey_number && (
                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                        #{player.jersey_number}
                                    </span>
                                )}
                                {player.date_of_birth && (
                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                        {calcAge(player.date_of_birth)} yrs
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{player.email}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                            <button
                                onClick={() => handleAction(player.id, 'decline')}
                                disabled={acting === player.id}
                                className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                                Decline
                            </button>
                            <button
                                onClick={() => handleAction(player.id, 'approve')}
                                disabled={acting === player.id}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {acting === player.id ? '…' : 'Approve'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

function calcAge(dob) {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default PendingRequests;
