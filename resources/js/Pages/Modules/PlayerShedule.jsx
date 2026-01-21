import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

// 1. Import FullCalendar and Plugins
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Month view
import timeGridPlugin from '@fullcalendar/timegrid'; // Week/Day view
import interactionPlugin from '@fullcalendar/interaction'; // Needed for clicking events

export default function PlayerSchedule() {
    const { profile } = useOutletContext();
    const coachId = profile?.coach_id;
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (coachId) {
            fetch(`/api/coach/${coachId}/schedule`)
                .then(res => res.json())
                .then(data => {
                    // TRANSFORM DATA
                    // FullCalendar needs specific keys: 'title', 'start', 'backgroundColor'
                    const formattedEvents = data.map(event => ({
                        id: event.id,
                        title: `${event.type === 'match' ? '⚽' : '🏃'} ${event.title}`, // Add emoji based on type
                        start: event.start_time,
                        // end: event.end_time, // If you have an end time in DB, add it here
                        backgroundColor: event.type === 'match' ? '#9333ea' : '#10b981', // Purple for Match, Green for Training
                        borderColor: event.type === 'match' ? '#7e22ce' : '#059669',
                        extendedProps: {
                            location: event.location,
                            type: event.type
                        }
                    }));
                    setEvents(formattedEvents);
                });
        }
    }, [coachId]);

    // Optional: Handle Event Click
    const handleEventClick = (info) => {
        const { title, extendedProps, start } = info.event;
        const time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        alert(`${title}\n🕒 ${time}\n📍 ${extendedProps.location || 'No Location'}`);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Team Schedule</h1>
                    <p className="text-gray-400 font-medium">Monthly Calendar</p>
                </div>
            </div>

            {/* 4. CALENDAR CONTAINER */}
            {/* FullCalendar needs a height to render correctly. We use 'flex-1' to fill the page. */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex-1 font-sans">
                <style>{`
                    /* Custom Overrides for that "Clean Google" Look */
                    .fc-toolbar-title { font-size: 1.5rem !important; font-weight: 800 !important; color: #1f2937; }
                    .fc-button { background-color: white !important; color: #4b5563 !important; border: 1px solid #e5e7eb !important; font-weight: bold !important; box-shadow: none !important; }
                    .fc-button:hover { background-color: #f9fafb !important; color: #111827 !important; }
                    .fc-button-active { background-color: #f3f4f6 !important; color: #7c3aed !important; border-color: #7c3aed !important; }
                    .fc-daygrid-day-number { font-weight: 600; color: #6b7280; text-decoration: none !important; }
                    .fc-col-header-cell-cushion { text-transform: uppercase; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; color: #9ca3af; padding-bottom: 10px !important; }
                    .fc-event { border-radius: 4px; padding: 2px 4px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; }
                `}</style>
                
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek' // User can switch between Month and Week view
                    }}
                    events={events}
                    eventClick={handleEventClick}
                    height="100%" // Important: Fills the container
                    dayMaxEvents={true} // Show "more" link if too many events
                />
            </div>
        </div>
    );
}