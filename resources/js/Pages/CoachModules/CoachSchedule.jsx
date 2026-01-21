import React, { useState, useEffect } from 'react';

export default function CoachSchedule() {
    const coachId = 1; 
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({
        coach_id: coachId, title: '', type: 'training', start_time: '', location: ''
    });

    // Load Events
    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = () => {
        fetch(`/api/coach/${coachId}/schedule`)
            .then(res => res.json())
            .then(data => setEvents(data));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(res => {
            if (res.ok) {
                alert("Event Added to Calendar! 📅");
                setFormData({ ...formData, title: '', start_time: '', location: '' });
                fetchSchedule();
            }
        });
    };

    const handleDelete = (id) => {
        if(confirm("Delete this event?")) {
            fetch(`/api/schedule/${id}`, { method: 'DELETE' })
                .then(() => fetchSchedule());
        }
    };

    // Helper: Sort events by date
    const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: ADD EVENT FORM */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                <h2 className="text-xl font-black text-gray-900 mb-6">Add Event</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Event Title</label>
                        <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold mt-1" 
                            placeholder="e.g. Fitness Drill" required
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Type</label>
                        <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold mt-1"
                            value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="training">Training 🏃‍♂️</option>
                            <option value="match">Match Day ⚽</option>
                            <option value="meeting">Team Meeting 📋</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Date & Time</label>
                        <input type="datetime-local" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold mt-1" required
                            value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Location</label>
                        <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold mt-1" 
                            placeholder="e.g. Presint 16"
                            value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                        />
                    </div>
                    <button className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition-all">
                        + Add to Calendar
                    </button>
                </form>
            </div>

            {/* RIGHT: CALENDAR LIST VIEW */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-black text-gray-900">Upcoming Schedule</h2>
                
                <div className="grid gap-4">
                    {sortedEvents.map(event => {
                        const date = new Date(event.start_time);
                        const isMatch = event.type === 'match';
                        
                        return (
                            <div key={event.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                <div className="flex items-center gap-6">
                                    {/* Date Box */}
                                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${isMatch ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                        <span className="text-xs font-bold uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-2xl font-black">{date.getDate()}</span>
                                    </div>
                                    
                                    {/* Info */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isMatch ? 'bg-purple-600 text-white' : 'bg-green-100 text-green-700'}`}>
                                                {event.type}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                                        <p className="text-sm text-gray-500 font-medium">📍 {event.location || 'Location TBD'}</p>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button onClick={() => handleDelete(event.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        );
                    })}
                    
                    {sortedEvents.length === 0 && (
                        <div className="p-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">No upcoming events found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}