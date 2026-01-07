import React from 'react';
import { useOutletContext } from 'react-router-dom';
// 1. NEW IMPORTS for Radar Chart
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

export default function Overview() {
    // Grab attributes from context
    const { stats, history, attributes } = useOutletContext();

    // 2. DATA PREP: Performance History (Area Chart)
    const historyData = [...history].reverse().map(match => ({
        date: new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rating: match.rating
    }));

    // 3. DATA PREP: Attributes (Radar Chart)
    // We map the database columns to readable labels
    const radarData = [
        { subject: 'Pace', A: attributes.pace || 50, fullMark: 100 },
        { subject: 'Shooting', A: attributes.shooting || 50, fullMark: 100 },
        { subject: 'Passing', A: attributes.passing || 50, fullMark: 100 },
        { subject: 'Dribbling', A: attributes.dribbling || 50, fullMark: 100 },
        { subject: 'Defending', A: attributes.defending || 50, fullMark: 100 },
        { subject: 'Physical', A: attributes.physical || 50, fullMark: 100 },
    ];

    const bestMatch = history.length > 0 
        ? history.reduce((prev, current) => (prev.rating > current.rating) ? prev : current)
        : null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Current Form</p>
                    <div className="text-4xl font-black text-gray-900">{stats.average_rating} <span className="text-lg text-gray-400 font-medium">/ 10</span></div>
                    <div className="w-full bg-gray-100 h-1.5 mt-4 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.average_rating * 10}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Season Goals</p>
                    <div className="text-4xl font-black text-blue-600">{stats.total_goals}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Matches Played</p>
                    <div className="text-4xl font-black text-purple-600">{stats.total_matches}</div>
                </div>
            </div>

            {/* CHARTS ROW: Hexagon (Left) + Performance (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. NEW HEXAGON RADAR CHART */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-2 self-start">Player Attributes</h3>
                    <p className="text-gray-400 text-sm mb-4 self-start">Technical analysis breakdown.</p>
                    
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Player"
                                    dataKey="A"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="#8b5cf6"
                                    fillOpacity={0.5}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. EXISTING AREA CHART */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-xl font-bold mb-2">Performance Trend</h3>
                    <p className="text-gray-400 text-sm mb-6">Rating progression over last games.</p>
                    
                    <div className="flex-1 h-64">
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

                    {/* Best Match Info at bottom */}
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Best Performance</span>
                        <span className="text-sm font-bold text-gray-900">
                            {bestMatch ? `${bestMatch.rating} vs ${bestMatch.opponent_name}` : '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Matches Table (Existing) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="font-bold text-gray-900">Recent Matches</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-gray-400 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="p-5">Date</th>
                            <th className="p-5">Opponent</th>
                            <th className="p-5 text-center">Mins</th>
                            <th className="p-5 text-center">G / A</th>
                            <th className="p-5 text-right">Rating</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-sm">
                        {history.map(match => (
                            <tr key={match.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-5 text-gray-500">{new Date(match.match_date).toLocaleDateString()}</td>
                                <td className="p-5 font-bold text-gray-900">{match.opponent_name}</td>
                                <td className="p-5 text-center text-gray-500">{match.minutes_played}'</td>
                                <td className="p-5 text-center">
                                    <span className="text-gray-900 font-bold">{match.goals}</span>
                                    <span className="text-gray-300 mx-1">/</span>
                                    <span className="text-gray-500">{match.assists}</span>
                                </td>
                                <td className="p-5 text-right">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${match.rating >= 8 ? 'bg-green-100 text-green-700' : match.rating >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {match.rating}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}