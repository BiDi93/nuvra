import React, { useState, useEffect } from 'react';

export default function CoachPayment() {
    const coachId = 1; // Assuming Coach ID 1
    const [month, setMonth] = useState("February 2026"); // Default month
    const [roster, setRoster] = useState([]);

    // List of months for the dropdown
    const months = ["January 2026", "February 2026", "March 2026", "April 2026"];

    useEffect(() => {
        fetchData();
    }, [month]);

    const fetchData = () => {
        fetch(`/api/coach/${coachId}/payments/${month}`)
            .then(res => res.json())
            .then(data => setRoster(data));
    };

    // Calculate stats
    const totalPaid = roster.filter(p => p.status === 'Paid').length;
    const totalCollected = roster.reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header & Filter */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Payment Tracker</h1>
                    <p className="text-gray-400 font-medium">Monitor monthly fee collection.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-900 font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-1">Total Collected</div>
                    <div className="text-3xl font-black text-green-600">RM {totalCollected.toFixed(2)}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-1">Paid Players</div>
                    <div className="text-3xl font-black text-gray-900">{totalPaid} <span className="text-gray-400 text-lg">/ {roster.length}</span></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-1">Pending</div>
                    <div className="text-3xl font-black text-red-500">{roster.length - totalPaid}</div>
                </div>
            </div>

            {/* Roster List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase">Player</th>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase">Status</th>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase">Date Paid</th>
                            <th className="p-6 text-xs font-bold text-gray-400 uppercase text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {roster.map(player => (
                            <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-6 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                        <img src={player.profile_image || "/avatar-placeholder.png"} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-gray-900">{player.name}</span>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${player.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {player.status}
                                    </span>
                                </td>
                                <td className="p-6 text-sm font-medium text-gray-500">
                                    {player.date_paid ? new Date(player.date_paid).toLocaleDateString() : '-'}
                                </td>
                                <td className="p-6 text-right font-black text-gray-900">
                                    {player.amount > 0 ? `RM ${player.amount}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {roster.length === 0 && <div className="p-8 text-center text-gray-400 font-bold">No players found.</div>}
            </div>
        </div>
    );
}