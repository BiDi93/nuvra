import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Overview() {
    // Grab data directly from the parent Layout
    const { stats, history } = useOutletContext();

    const chartData = [...history].reverse().map(match => ({
        date: new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rating: match.rating
    }));

    const bestMatch = history.length > 0 
            ? history.reduce((prev, current) => (prev.rating > current.rating) ? prev : current)
            : null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
            {/* Stats Grid */}
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
                    <p className="text-xs text-green-500 font-bold mt-2">Top Scorer Contender</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Matches Played</p>
                    <div className="text-4xl font-black text-purple-600">{stats.total_matches}</div>
                    <p className="text-xs text-gray-400 font-bold mt-2">100% Attendance</p>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">

                    <h3 className="text-2xl font-bold mb-2">Performance History</h3>
                    <p className="text-gray-500 text-sm mb-6">Track your rating progression over the last 5 games.</p>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-400 font-bold uppercase">Highest Rating</div>
                        <div className="text-xl font-bold text-gray-900">
        
                         {/* Dynamic Rating */}
                         {bestMatch ? bestMatch.rating : '-'} 

                         {/* Dynamic Opponent Name */}
                        <span className="text-sm font-normal text-gray-400 ml-2">
                         {bestMatch ? `vs ${bestMatch.opponent_name}` : 'No matches yet'}
                         </span>
        
                </div>
            </div>
                     </div>
                </div>
                
                <div className="md:w-2/3 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}} />
                            <Area type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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