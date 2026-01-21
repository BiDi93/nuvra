import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function CoachLayout() {
    const navigate = useNavigate();
    const coachName = "Coach Carter";
    const teamName = "NUVRA Varsity";

    const handleLogout = () => {
        navigate("/coach");
    };

    // Style for sidebar links
    const linkStyle = ({ isActive }) =>
        `flex items-center gap-3 w-full px-4 py-4 rounded-xl font-bold transition-all ${
            isActive
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`;

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-72 bg-[#1a1c23] flex flex-col shadow-xl z-20">
                <div className="p-8">
                    <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        NUVRA
                    </h1>
                    <p className="text-gray-500 text-xs font-bold tracking-widest mt-1">
                        STAFF PORTAL
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-3">
                    <NavLink to="/coach-dashboard" end className={linkStyle}>
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        Squad Management
                    </NavLink>

                    <NavLink
                        to="/coach-dashboard/add-stats"
                        className={linkStyle}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                        </svg>
                        Record Match Stats
                    </NavLink>
                    <NavLink
                        to="/coach-dashboard/announcements"
                        className={linkStyle}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                            />
                        </svg>
                        Announcements
                    </NavLink>
                    <NavLink
                        to="/coach-dashboard/schedule"
                        className={linkStyle}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        Team Schedule
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-white/5 rounded-xl transition-colors font-bold text-sm"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto relative flex flex-col">
                {/* HEADER */}
                <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">
                            {teamName}
                        </h2>
                        <p className="text-gray-400 font-medium">
                            Head Coach:{" "}
                            <span className="text-gray-900">{coachName}</span>
                        </p>
                    </div>
                </header>

                {/* DYNAMIC CONTENT LOADS HERE */}
                <div className="p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
