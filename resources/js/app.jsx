import "./bootstrap";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// --- 1. IMPORT THE GATEKEEPER ---
import ProtectedRoute from "./Components/ProtectedRoute";
import PlayerRoute    from "./Components/PlayerRoute";

// Auth Page
import AuthPage from "./Pages/Authentication/AuthPage.jsx";
import Login from "./Pages/Login"; // Ensure this path is correct if different from AuthPage
import GoogleCallback from "./Pages/Authentication/GoogleCallback.jsx";

// Import Waiting Room & Onboarding
import WaitingRoom from "./Pages/WaitingRoom.jsx";
import Onboarding from "./Pages/Onboarding";

// Import Pages
import CoachPlayerView from "./Pages/CoachPlayerView";
import CoachSchedule from "./Pages/CoachModules/CoachSchedule.jsx";

// Import New Layout and Modules
import CoachLayout from "./Layouts/CoachLayouts";
import SquadManagement from "./Pages/CoachModules/SquadManagement.jsx";
import RecordStats from "./Pages/CoachModules/RecordStats.jsx";

import DashboardLayout from "./Layouts/DashboardLayout";
import Overview from "./Pages/Modules/Overview";
import Announcements from "./Pages/Modules/Announcements";
import Settings from "./Pages/Modules/Settings";
import CoachAddStats from "./Pages/CoachAddStats";
import CoachAnnouncements from "./Pages/CoachModules/CoachAnnouncements.jsx";
import PlayerSchedule from "./Pages/Modules/PlayerShedule.jsx";

//Import Payment Modules
import PlayerPayment from "./Pages/Modules/PlayerPayment.jsx";
import CoachPayment from "./Pages/CoachModules/CoachPayment.jsx";

// --- NUVRA PORTAL & COMMUNITY ---
import NuvraPortal from "./Pages/NuvraPortal.jsx";
import CommunityLayout from "./Layouts/CommunityLayout.jsx";
import CommunityHome from "./Pages/Community/CommunityHome.jsx";
import CommunityFeed from "./Pages/Community/CommunityFeed.jsx";
import GameDetail from "./Pages/Community/GameDetail.jsx";
import CommunityAnnouncements from "./Pages/Community/CommunityAnnouncements.jsx";
import CreateGame from "./Pages/Community/Admin/CreateGame.jsx";
import PostAnnouncement from "./Pages/Community/Admin/PostAnnouncement.jsx";

// Community Protected Route (uses community_token, not auth_token)
const CommunityAdminRoute = () => {
    const user = JSON.parse(localStorage.getItem("community_user") || "null");
    if (!user || user.role !== "admin") return <Navigate to="/community" replace />;
    return <React.Suspense fallback={null}>{React.createElement(React.Fragment, null, <Navigate to="/community" replace />)}</React.Suspense>;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* =========================================
                    0. NUVRA PORTAL (Public Entry Point)
                   ========================================= */}
                <Route path="/" element={<NuvraPortal />} />

                {/* =========================================
                    1. PUBLIC ROUTES — Club Portal
                   ========================================= */}
                <Route path="/login" element={<AuthPage />} />
                <Route path="/club" element={<AuthPage />} />
                <Route path="/auth/callback" element={<GoogleCallback />} />

                {/* =========================================
                    2. COMMUNITY ROUTES (separate auth)
                   ========================================= */}
                <Route path="/community" element={<CommunityHome />} />
                
                <Route path="/community" element={<CommunityLayout />}>
                    <Route path="feed" element={<CommunityFeed />} />
                    <Route path="games/:id" element={<GameDetail />} />
                    <Route path="announcements" element={<CommunityAnnouncements />} />
                    <Route path="admin/create-game" element={<CreateGame />} />
                    <Route path="admin/post-announcement" element={<PostAnnouncement />} />
                </Route>

                {/* =========================================
                    3. PROTECTED ROUTES — Club Portal
                    Only accessible if 'auth_token' exists
                   ========================================= */}
                <Route element={<ProtectedRoute />}>

                    {/* Setup Pages */}
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/waiting-room" element={<WaitingRoom />} />

                    {/* COACH DASHBOARD */}
                    <Route path="/coach-dashboard" element={<CoachLayout />}>
                        <Route index element={<SquadManagement />} />
                        <Route path="add-stats" element={<RecordStats />} />
                        <Route path="announcements" element={<CoachAnnouncements />} />
                        <Route path="schedule" element={<CoachSchedule />} />
                        <Route path="payment" element={<CoachPayment />} />
                    </Route>

                    {/* Coach Specific Actions */}
                    <Route path="/coach/player/:id" element={<CoachPlayerView />} />
                    <Route path="/coach/add-stats" element={<CoachAddStats />} />

                    {/* PLAYER DASHBOARD — extra gate: blocks pending players */}
                    <Route element={<PlayerRoute />}>
                        <Route path="/dashboard" element={<DashboardLayout />}>
                            <Route index element={<Overview />} />
                            <Route path="announcements" element={<Announcements />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="schedule" element={<PlayerSchedule />} />
                            <Route path="payment" element={<PlayerPayment />} />
                        </Route>
                    </Route>

                </Route>
                {/* End of Protected Routes */}

            </Routes>
        </BrowserRouter>
    );
}

if (document.getElementById("app")) {
    createRoot(document.getElementById("app")).render(<App />);
}