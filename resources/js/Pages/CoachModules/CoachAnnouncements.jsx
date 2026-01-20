import React, { useState, useEffect } from 'react';

export default function CoachAnnouncements() {
    const coachId = 1; // Assuming Coach ID 1
    const [history, setHistory] = useState([]);
    const [formData, setFormData] = useState({ coach_id: coachId, title: '', content: '' });

    // Load previous announcements
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = () => {
        fetch(`/api/coach/${coachId}/announcements`)
            .then(res => res.json())
            .then(data => setHistory(data));
    };

    const handleBlast = (e) => {
        e.preventDefault();
        fetch('/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(res => {
            if (res.ok) {
                alert("Message Sent to Squad! 📢");
                setFormData({ ...formData, title: '', content: '' });
                fetchHistory(); // Refresh the list
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            
            {/* WRITE NEW MESSAGE */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <span>📣</span> Blast Announcement
                </h2>
                
                <form onSubmit={handleBlast} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject Headline</label>
                        <input 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none" 
                            placeholder="e.g. Training Canceled due to Rain"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message</label>
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none" 
                            placeholder="Write your message here..."
                            value={formData.content}
                            onChange={e => setFormData({...formData, content: e.target.value})}
                            required
                        ></textarea>
                    </div>
                    <button className="w-full bg-black hover:bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:-translate-y-1">
                        SEND TO ALL PLAYERS
                    </button>
                </form>
            </div>

            {/* HISTORY LIST */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sent History</h3>
                <div className="space-y-4">
                    {history.map(item => (
                        <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 opacity-75 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg text-gray-800">{item.title}</h4>
                                <span className="text-xs font-bold text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-600 text-sm">{item.content}</p>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-gray-400">No announcements sent yet.</p>}
                </div>
            </div>
        </div>
    );
}