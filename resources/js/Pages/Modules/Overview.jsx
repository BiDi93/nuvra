import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

export default function Overview() {
    // Grab attributes from context
    const { stats, history, attributes } = useOutletContext();

    // 1. DATA PREP: Performance History (Area Chart)
    // Updated to use dd/mm/yyyy format as requested
    const historyData = [...history].reverse().map(match => ({
        date: new Date(match.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        rating: match.rating
    }));

    // 2. DATA PREP: Attributes (Radar Chart)
    // Using useMemo to prevent "jitter" on hover, but keeping the values from DB
    const radarData = useMemo(() => [
        { subject: 'Pace', A: attributes.pace || 50, fullMark: 100 },
        { subject: 'Shooting', A: attributes.shooting || 50, fullMark: 100 },
        { subject: 'Passing', A: attributes.passing || 50, fullMark: 100 },
        { subject: 'Dribbling', A: attributes.dribbling || 50, fullMark: 100 },
        { subject: 'Defending', A: attributes.defending || 50, fullMark: 100 },
        { subject: 'Physical', A: attributes.physical || 50, fullMark: 100 },
    ], [attributes]);

    const bestMatch = history.length > 0 
        ? history.reduce((prev, current) => (prev.rating > current.rating) ? prev : current)
        : null;

    if (!stats) return <div className="p-8 text-gray-400">Loading Stats...</div>;

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
                
                {/* 1. HEXAGON RADAR CHART */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-2 self-start">Player Attributes</h3>
                    <p className="text-gray-400 text-sm mb-4 self-start">Technical analysis breakdown.</p>
                    
                    {/* Reverted to 'h-80' (320px) which worked perfectly for you before */}
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

                {/* 2. AREA CHART */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-xl font-bold mb-2">Performance Trend</h3>
                    <p className="text-gray-400 text-sm mb-6">Rating progression over last games.</p>
                    
                    {/* Reverted to 'flex-1 h-64' which allows it to fit naturally */}
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

                    {/* Best Match Info */}
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Best Performance</span>
                        <span className="text-sm font-bold text-gray-900">
                            {bestMatch ? `${bestMatch.rating} vs ${bestMatch.opponent_name}` : '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. NEW MATCH LOG TABLE (Integrated into the working layout) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Match Log</h3>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Recent History</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-400">
                                <th className="p-5 font-bold">Date</th>
                                <th className="p-5 font-bold">Opponent / Venue</th>
                                <th className="p-5 font-bold">League</th>
                                <th className="p-5 font-bold text-center">Mins</th>
                                <th className="p-5 font-bold text-center">G / A</th>
                                <th className="p-5 font-bold text-right">Rating</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {history.map((match, index) => (
                                <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                    {/* Date formatted as dd/mm/yyyy */}
                                    <td className="p-5 font-bold text-gray-500 whitespace-nowrap">
                                        {new Date(match.match_date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="p-5">
                                        <div className="font-bold text-gray-900">{match.opponent_name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                            <span>📍 {match.venue || 'Unknown Venue'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-bold border border-blue-100">
                                            {match.league_type || 'League'}
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
    );
}