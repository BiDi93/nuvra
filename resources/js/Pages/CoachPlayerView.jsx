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
                <button 
                    onClick={() => navigate('/coach-dashboard')}
                    className="bg-white p-3 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:shadow-md transition-all"
                >
                    ← Back to Squad
                </button>
                <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                        <img src={profile.profile_image || "/avatar-placeholder.png"} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 leading-none">{profile.name}</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{profile.position} • #{profile.jersey_number}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. ATTRIBUTES CHART */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-2 self-start">Player DNA</h3>
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
                </div>

                {/* 2. PERFORMANCE TREND */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-xl font-bold mb-2">Form History</h3>
                    <div className="flex-1 h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historyData}>
                                <defs>
                                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}} />
                                <Area type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. KEY STATS CARDS */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Matches</p>
                        <p className="text-4xl font-black text-gray-900">{stats.total_matches}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Total Goals</p>
                        <p className="text-4xl font-black text-blue-600">{stats.total_goals}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Avg Rating</p>
                        <p className="text-4xl font-black text-purple-600">{stats.average_rating}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}