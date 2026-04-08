import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

const PendingRequests = ({ coachId, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");

    useEffect(() => {
        if(!coachId) return;
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`/api/coach/${coachId}/requests`, { headers })
            .then(res => setRequests(res.data))
            .catch(err => console.error("Error fetching requests:", err));
    }, [coachId, token]);

    const handleAction = async (playerId, action) => {
        const toastId = toast.loading(`${action === 'approve' ? 'Approving' : 'Declining'} player...`);
        const previousRequests = [...requests];
        
        // Optimistic UI
        setRequests(requests.filter(req => req.id !== playerId));

        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`/api/coach/${coachId}/request/${playerId}`, {
                action: action 
            }, { headers });

            toast.success(`Player ${action}d successfully!`, { id: toastId });

            if (onActionComplete) {
                onActionComplete();
            }
        } catch (error) {
            setRequests(previousRequests); // Rollback
            console.error("Action failed:", error);
            toast.error("Something went wrong.", { id: toastId });
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
                            <p className="text-sm text-gray-400">Position: {player.position}</p>
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
