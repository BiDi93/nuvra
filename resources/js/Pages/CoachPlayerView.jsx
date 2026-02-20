import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

export default function CoachPlayerView() {
    const { id } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Reuse the existing Player API
        fetch(`/api/players/${id}`)
            .then(res => res.json())
            .then(playerData => {
                setData(playerData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    // EDIT STATE
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({});

    const handleEditToggle = () => {
        if (!isEditing) {
            // Enter Edit Mode: copy current attributes to temp state
            setEditValues({ ...data.attributes });
        }
        setIsEditing(!isEditing);
    };

    const handleAttributeChange = (key, value) => {
        setEditValues(prev => ({
            ...prev,
            [key]: parseInt(value)
        }));
    };

    const saveAttributes = () => {
        fetch(`/api/player/${id}/attributes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                // Add Authorization header if needed, but usually handled by cookie/browser for same-origin
            },
            body: JSON.stringify(editValues)
        })
            .then(res => res.json())
            .then(response => {
                // Update the main data state with new attributes
                setData(prev => ({
                    ...prev,
                    attributes: { ...editValues }
                }));
                setIsEditing(false);
                alert("Stats updated successfully!");
            })
            .catch(err => {
                console.error(err);
                alert("Failed to update stats.");
            });
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 font-bold">Loading Stats...</div>;
    if (!data) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-400 font-bold">Player not found.</div>;

    // PREPARE CHART DATA
    const { attributes, history, stats, profile } = data;

    const radarData = [
        { subject: 'Pace', A: attributes.pace, fullMark: 100 },
        { subject: 'Shooting', A: attributes.shooting, fullMark: 100 },
        { subject: 'Passing', A: attributes.passing, fullMark: 100 },
        { subject: 'Dribbling', A: attributes.dribbling, fullMark: 100 },
        { subject: 'Defending', A: attributes.defending, fullMark: 100 },
        { subject: 'Physical', A: attributes.physical, fullMark: 100 },
    ];

    const historyData = [...history].reverse().map(match => ({
        date: new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rating: match.rating
    }));

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">

            {/* Header / Navigation */}
            <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4">
                <button onClick={() => navigate('/coach-dashboard')} className="bg-white p-3 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:shadow-md transition-all">← Back</button>
                <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm flex-1">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                        <img src={profile.profile_image || "/images/playerImage/beckam.jpg"} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 leading-none">{profile.name}</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{profile.position} • #{profile.jersey_number}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">

                {/* 1. TOP SECTION: CHARTS (Same as before) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Player DNA</h3>
                            {/* EDIT BUTTON */}
                            <button
                                onClick={handleEditToggle}
                                className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${isEditing ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                            >
                                {isEditing ? 'Cancel Edit' : 'Edit Stats'}
                            </button>
                        </div>

                        {/* VIEW MODE: RADAR CHART */}
                        {!isEditing && (
                            <div className="w-full h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Player" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.5} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* EDIT MODE: SLIDERS */}
                        {isEditing && (
                            <div className="w-full space-y-4 animate-fade-in-up">
                                {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(attr => (
                                    <div key={attr} className="flex items-center gap-4">
                                        <label className="w-24 text-sm font-bold text-gray-500 uppercase">{attr}</label>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={editValues[attr] || 0}
                                            onChange={(e) => handleAttributeChange(attr, e.target.value)}
                                            className="flex-1 accent-purple-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="w-8 text-right font-bold text-gray-900">{editValues[attr]}</span>
                                    </div>
                                ))}

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={saveAttributes}
                                        className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                        <h3 className="text-xl font-bold mb-2">Form History</h3>
                        <div className="flex-1 h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
                                    <Area type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 2. NEW SECTION: MATCH LOG LIST */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">Match Log</h3>
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{history.length} Matches</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-400">
                                    <th className="p-5 font-bold">Date</th>
                                    <th className="p-5 font-bold">Opponent / Venue</th>
                                    <th className="p-5 font-bold">League</th>
                                    <th className="p-5 font-bold text-center">Minutes Played</th>
                                    <th className="p-5 font-bold text-center">Goal / Assist</th>
                                    <th className="p-5 font-bold text-right">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {history.map((match, index) => (
                                    <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-5 font-bold text-gray-500 whitespace-nowrap">
                                            {new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-gray-900">{match.opponent_name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                <span>📍 {match.venue || 'None'}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-bold border border-blue-100">
                                                {match.league_name || 'League'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center font-bold text-gray-400">{match.minutes_played}'</td>
                                        <td className="p-5 text-center font-bold text-gray-900">
                                            {match.goals} <span className="text-gray-300 mx-1">/</span> {match.assists}
                                        </td>
                                        <td className="p-5 text-right">
                                            <span className={`px-3 py-1 rounded-lg font-bold text-white ${match.rating >= 8.0 ? 'bg-green-500' : (match.rating >= 6.0 ? 'bg-yellow-400' : 'bg-red-400')}`}>
                                                {match.rating}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {history.length === 0 && (
                        <div className="p-8 text-center text-gray-400 font-bold">No match records found.</div>
                    )}
                </div>

            </div>
        </div>
    );
}