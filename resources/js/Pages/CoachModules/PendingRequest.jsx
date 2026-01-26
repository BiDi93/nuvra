import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 1. Added 'onActionComplete' to props
const PendingRequests = ({ coachId, onActionComplete }) => {
    const [requests, setRequests] = useState([]);

    // Fetch Requests on Load
    useEffect(() => {
        if(!coachId) return;

        axios.get(`/api/coach/${coachId}/requests`)
            .then(res => setRequests(res.data))
            .catch(err => console.error("Error fetching requests:", err));
    }, [coachId]);

    // Handle Approve/Decline
    const handleAction = async (playerId, action) => {
        try {
            await axios.post(`/api/coach/${coachId}/request/${playerId}`, {
                action: action 
            });

            // Remove the processed player from the list visually
            setRequests(requests.filter(req => req.id !== playerId));
            
            alert(`Player ${action}d successfully!`);

            // 2. TRIGGER THE REFRESH SIGNAL
            // This tells SquadManagement to re-fetch the active roster immediately
            if (onActionComplete) {
                onActionComplete();
            }

        } catch (error) {
            console.error("Action failed:", error);
            alert("Something went wrong.");
        }
    };

    if (requests.length === 0) return null; 

    return (
        
        <div className="border border-yellow-600 rounded-lg p-6 mb-8 text-white">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                ⚠️ Pending Approvals ({requests.length})
            </h3>

            <div className="space-y-4">
                {requests.map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-gray-800 p-4 rounded">
                        <div>
                            <p className="font-bold text-lg">{player.name}</p>
                            <p className="text-sm text-gray-400">Position: {player.position} | Age: {player.age || 'N/A'}</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleAction(player.id, 'decline')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold"
                            >
                                Decline
                            </button>
                            <button 
                                onClick={() => handleAction(player.id, 'approve')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-bold"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingRequests;