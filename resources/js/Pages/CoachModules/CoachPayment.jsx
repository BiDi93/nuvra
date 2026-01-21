import React, { useState, useEffect } from 'react';

export default function CoachPayment() {
    const coachId = 1; // Assuming Coach ID 1
    const [month, setMonth] = useState("January 2026"); // Default to January as requested
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dropdown options
    const months = [
        "January 2026", "February 2026", "March 2026", 
        "April 2026", "May 2026", "June 2026"
    ];

    useEffect(() => {
        setLoading(true);
        fetch(`/api/coach/${coachId}/payments/${month}`)
            .then(res => res.json())
            .then(data => {
                setRoster(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [month]);

    const handleRemind = (playerName) => {
        alert(`🔔 Reminder sent to ${playerName} for ${month}!`);
    };

    // Stats Calculation
    const totalPaid = roster.filter(p => p.status === 'Paid').length;
    const pending = roster.length - totalPaid;
    const collectionRate = roster.length > 0 ? Math.round((totalPaid / roster.length) * 100) : 0;
    const totalCash = roster.reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Financial Tracker</h1>
                    <p className="text-gray-400 font-medium">Monitor monthly fees and collections.</p>
                </div>

                {/* Month Selector */}
                <div className="relative">
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-900 font-bold text-lg rounded-xl pl-6 pr-12 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:border-purple-200 transition-colors"
                    >
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {/* Custom Arrow Icon */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* 3 Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Collection Rate */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Collection Rate</div>
                        <div className="text-3xl font-black text-gray-900">{collectionRate}%</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        %
                    </div>
                </div>

                {/* Card 2: Total Revenue */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Collected</div>
                        <div className="text-3xl font-black text-green-600">RM {totalCash}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>

                {/* Card 3: Pending Action */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Unpaid Players</div>
                        <div className="text-3xl font-black text-red-500">{pending}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                </div>
            </div>

            {/* The Roster Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                {loading ? (
                    <div className="p-10 text-center font-bold text-gray-400 animate-pulse">Loading Payments...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Player</th>
                                <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Payment Date</th>
                                <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {roster.map(player => (
                                <tr key={player.id} className="hover:bg-gray-50 transition-colors group">
                                    {/* Player Info */}
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-white shadow-sm overflow-hidden">
                                                <img src={player.profile_image || "/avatar-placeholder.png"} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-bold text-gray-900">{player.name}</span>
                                        </div>
                                    </td>

                                    {/* Status Pill */}
                                    <td className="p-6">
                                        {player.status === 'Paid' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                Paid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                                                Pending
                                            </span>
                                        )}
                                    </td>

                                    {/* Date */}
                                    <td className="p-6 text-sm font-medium text-gray-500 hidden md:table-cell">
                                        {player.date_paid ? new Date(player.date_paid).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                                    </td>

                                    {/* Action Button */}
                                    <td className="p-6 text-right">
                                        {player.status === 'Unpaid' && (
                                            <button 
                                                onClick={() => handleRemind(player.name)}
                                                className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors"
                                            >
                                                Send Reminder 🔔
                                            </button>
                                        )}
                                        {player.status === 'Paid' && (
                                            <span className="text-gray-300 font-bold text-xs">Receipt Sent</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && roster.length === 0 && (
                    <div className="p-10 text-center text-gray-400 font-bold">No players found in your squad.</div>
                )}
            </div>
        </div>
    );
}