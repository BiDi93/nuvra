import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WaitingRoom = () => {
    const navigate = useNavigate();
    const [player, setPlayer] = useState(null);

    // Fetch basic info just to show the Name/Avatar in the header
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/login');
            return;
        }

        axios.get('/api/player/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                // Even if pending, we get the profile data
                setPlayer(res.data.profile || res.data);

                // If they are suddenly active, auto-redirect!
                if (res.data.profile?.status === 'active' || res.data.status === 'active') {
                    navigate('/dashboard');
                }
            })
            .catch(() => {
                // If fetch fails, just ignore. We will show placeholders.
            });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        navigate('/login');
    };

    // A "Fake" Sidebar Link that looks real but doesn't click
    const DisabledSidebarLink = ({ icon, text, active = false }) => (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 cursor-not-allowed opacity-50 ${active ? "bg-purple-50 text-purple-700 font-bold" : "text-gray-400"}`}>
            <div className="w-5">{icon}</div>
            <span>{text}</span>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">

            {/* --- 1. LOCKED SIDEBAR --- */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 opacity-70 grayscale-[0.5]">
                <div className="p-8 flex items-center gap-3">
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" className="h-14 w-14 object-cover object-left" />
                    <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                        NUVRA
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2 select-none">
                    <DisabledSidebarLink active={true} text="Dashboard" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>} />
                    <DisabledSidebarLink text="Announcements" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 018.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.32 1.3-.816 1.73" /></svg>} />
                    <DisabledSidebarLink text="Profile Settings" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-all font-bold text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* --- 2. MAIN CONTENT AREA --- */}
            <main className="flex-1 overflow-y-auto bg-gray-50 relative flex flex-col">

                {/* Header (Visual Only - Matches Dashboard) */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center select-none">
                    <h2 className="text-xl font-bold text-gray-800">
                        Player Dashboard <span className="text-yellow-500 text-sm ml-2 font-normal">(Locked)</span>
                    </h2>
                    <div className="flex items-center gap-4 opacity-80">
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{player?.name || 'Pending Player'}</div>
                            <div className="text-xs font-medium text-gray-500">{player?.position || '...'}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-200">
                            <img src={player?.profile_image || "https://ui-avatars.com/api/?name=User&background=random"} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                {/* --- 3. THE WAITING CONTENT --- */}
                <div className="flex-1 flex items-center justify-center p-6 relative">

                    {/* Background Blur to simulate locked content */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664')] bg-cover bg-center opacity-5 filter blur-sm"></div>

                    <div className="relative bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-gray-100 z-10">

                        {/* Status Icon */}
                        <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-yellow-100">
                            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Pending</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Welcome to the team, <span className="font-bold text-gray-800">{player?.name}</span>! <br />
                            Your coach is currently reviewing your request. You will gain full access to the dashboard once approved.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-gray-900 text-white hover:bg-black py-3 rounded-xl font-bold transition shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                Check Status Again
                            </button>

                            <p className="text-xs text-gray-400 mt-4">
                                If this is taking too long, please contact your coach directly.
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div >
    );
};

export default WaitingRoom;