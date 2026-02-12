import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios"; // Make sure to install axios if you haven't (npm install axios)

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Data & Check Status (The Gatekeeper)
    useEffect(() => {
        const token = localStorage.getItem("auth_token");

        // If no token, kick them out immediately
        if (!token) {
            navigate("/login");
            return;
        }

        // Fetch the logged-in player's data using the Token
        axios.get('/api/player/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => {
                const player = res.data;

                // --- 🛡️ GATEKEEPER LOGIC START ---
                if (player.status === 'pending') {
                    navigate('/waiting-room'); // Stop! Go to waiting room
                    return;
                }
                else if (player.status === 'rejected') {
                    alert("Your application was declined.");
                    localStorage.removeItem("auth_token");
                    navigate("/login");
                    return;
                }
                // --- 🛡️ GATEKEEPER LOGIC END ---

                // If Active, let them in!
                setData(player);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching player data:", err);
                // If the token is invalid (expired), kick them out
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem("auth_token");
                    navigate("/login");
                }
            });
    }, [navigate]);

    const handleLogout = () => {
        // 1. Wipe the keys from storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');

        // 2. Kill the session in Axios (Optional but good practice)
        if (window.axios) {
            delete window.axios.defaults.headers.common['Authorization'];
        }

        // 3. THE FIX: Force a Hard Redirect 🛑
        // Do NOT use navigate('/login').
        // This forces the browser to load the Login page as a fresh new page.
        window.location.href = '/login';
    };

    if (loading || !data)
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-500 font-bold">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                Checking Access Level...
            </div>
        );

    const { profile } = data;

    // Helper for Sidebar Links
    const SidebarLink = ({ path, icon, text }) => {
        const isActive = location.pathname === path;
        return (
            <div
                onClick={() => navigate(path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer mb-1 ${isActive
                    ? "bg-purple-50 text-purple-700 font-bold"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
                    }`}
            >
                <div className="w-5">{icon}</div>
                <span>{text}</span>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div
                    className="p-8 flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <img
                        src="/images/logoImage/NUVRA_LOGO.png"
                        alt="NUVRA"
                        className="h-12 w-12 object-cover object-left"
                    />
                    <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                        NUVRA
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <SidebarLink
                        path="/dashboard"
                        text="Dashboard"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        }
                    />
                    <SidebarLink
                        path="/dashboard/announcements"
                        text="Announcements"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 018.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.32 1.3-.816 1.73" />
                            </svg>
                        }
                    />
                    <SidebarLink
                        path="/dashboard/settings"
                        text="Profile Settings"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                    />
                    <SidebarLink
                        path="/dashboard/payment"
                        text="My Fees"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                        }
                    />
                    <SidebarLink
                        path="/dashboard/schedule"
                        text="My Schedule"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008H14.25V15zm0 2.25h.008v.008H14.25v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
                            </svg>
                        }
                    />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-all font-bold text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto bg-gray-50 relative flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        Player Dashboard
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                                {profile.name}
                            </div>
                            <div className="text-xs font-medium text-gray-500">
                                {profile.position}
                            </div>
                        </div>
                        <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-200">
                            <img
                                src={
                                    profile.profile_image
                                        ? profile.profile_image
                                        : "/images/playerImage/beckam.jpg"
                                }
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </header>

                <Outlet context={data} />
            </main>
        </div>
    );
}