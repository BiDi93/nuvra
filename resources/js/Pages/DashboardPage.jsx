import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);

    useEffect(() => {
        const userId = localStorage.getItem('currentUser');
        if (!userId) { navigate('/'); return; }

        fetch(`/api/players/${userId}`)
            .then(res => res.json())
            .then(responseData => setData(responseData))
            .catch(err => console.error("Error:", err));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/');
    };

    if (!data) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500 font-bold">Loading Analytics...</div>;

    const { profile, stats, history } = data;

    // Prepare chart data
    const chartData = [...history].reverse().map(match => ({
        date: new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rating: match.rating
    }));

    // Reusable Sidebar Link Component
    const SidebarLink = ({ icon, text, active = false }) => (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer mb-1 ${active ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
            <div className="w-5">{icon}</div>
            <span>{text}</span>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
            
            {/* 1. LEFT SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                {/* Logo Area */}
                <div className="p-8">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                        NUVRA
                    </h1>
                </div>

                {/* Menu Options */}
                <nav className="flex-1 px-4 space-y-2">
                    <SidebarLink 
                        active={true} 
                        text="Dashboard" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>}
                    />
                    <SidebarLink 
                        text="User Team" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
                    />
                    <SidebarLink 
                        text="Announcements" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 018.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.32 1.3-.816 1.73" /></svg>}
                    />
                    <SidebarLink 
                        text="Profile Settings" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    />
                </nav>

                {/* Bottom of Sidebar */}
                <div className="p-4 border-t border-gray-100">
                     <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-all font-bold text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* 2. MAIN CONTENT AREA (Right Side) */}
            <main className="flex-1 overflow-y-auto bg-gray-50 relative">
                
                {/* Top Header Bar */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Parent / Player Dashboard</h2>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{profile.name}</div>
                            <div className="text-xs font-medium text-gray-500">{profile.position}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-md">
                            {profile.jersey_number}
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    
                    {/* Header Stats */}
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
                                    <div className="text-xl font-bold text-gray-900">9.5 <span className="text-sm font-normal text-gray-400">vs Tigers FC</span></div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="text-xs text-gray-400 font-bold uppercase">Total Minutes</div>
                                    <div className="text-xl font-bold text-gray-900">{history.reduce((acc, curr) => acc + curr.minutes_played, 0)}'</div>
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
                    <div>
                        <h3 className="text-lg font-bold mb-4 ml-1">Recent Matches</h3>
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
                </div>
            </main>
        </div>
    );
}