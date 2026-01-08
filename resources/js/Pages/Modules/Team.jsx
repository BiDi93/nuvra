import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Team() {
    // Get the current user's data from the Layout
    const { profile } = useOutletContext(); 
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            fetch(`/api/players/${profile.id}/teammates`)
                .then(res => {
                    if (!res.ok) throw new Error("No team found");
                    return res.json();
                })
                .then(data => {
                    setTeamData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [profile]);

    if (loading) return <div className="p-8 text-gray-400 font-bold">Loading Roster...</div>;

    if (!teamData) return (
        <div className="p-8">
            <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-2xl text-yellow-800 font-bold">
                You have not been assigned to a squad yet. Ask your coach to add you!
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">{teamData.club_name}</h1>
                    <p className="text-gray-500 font-medium mt-1">Managed by <span className="text-purple-600 font-bold">{teamData.coach_name}</span></p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-sm font-bold text-gray-500">
                    {teamData.teammates.length} Squad Members
                </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {teamData.teammates.map((player) => (
                    <div key={player.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${player.id === profile.id ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-100'}`}>
                        
                        {/* Avatar & Number */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-md overflow-hidden">
                                <img 
                                    src={player.profile_image || "/avatar-placeholder.png"} 
                                    alt={player.name} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-3xl font-black text-gray-100">
                                #{player.jersey_number}
                            </div>
                        </div>

                        {/* Name & Position */}
                        <h3 className="text-lg font-bold text-gray-900 truncate">{player.name}</h3>
                        <p className="text-purple-600 text-xs font-bold uppercase mb-4">{player.position}</p>

                        {/* Mini Stats (Optional) */}
                        <div className="pt-4 border-t border-gray-50 flex justify-between text-xs font-medium text-gray-400">
                            <span>{player.height_cm}cm</span>
                            {player.id === profile.id && <span className="text-purple-600 font-bold">(You)</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}