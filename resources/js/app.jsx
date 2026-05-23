import "./bootstrap";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Page
import AuthPage from "./Pages/Authentication/AuthPage.jsx";
import GoogleCallback from "./Pages/Authentication/GoogleCallback.jsx";
import ResetPassword from "./Pages/Authentication/ResetPassword.jsx";

// --- NUVRA PORTAL & COMMUNITY ---
import NuvraPortal from "./Pages/NuvraPortal.jsx";
import CommunityLayout from "./Layouts/CommunityLayout.jsx";
import CommunityHome from "./Pages/Community/CommunityHome.jsx";
import CommunityGoogleCallback from "./Pages/Community/CommunityGoogleCallback.jsx";
import CommunityFeed from "./Pages/Community/CommunityFeed.jsx";
import CommunityMembers from "./Pages/Community/CommunityMembers.jsx";
import GameDetail from "./Pages/Community/GameDetail.jsx";
import PlayerProfile from "./Pages/Community/PlayerProfile.jsx";
import CommunityAnnouncements from "./Pages/Community/CommunityAnnouncements.jsx";
import CreateGame from "./Pages/Community/Admin/CreateGame.jsx";
import PostAnnouncement from "./Pages/Community/Admin/PostAnnouncement.jsx";
import Analytics from "./Pages/Community/Admin/Analytics.jsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* =========================================
                    1. NUVRA PORTAL (Public Entry Point)
                   ========================================= */}
                <Route path="/" element={<NuvraPortal />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<GoogleCallback />} />

                {/* =========================================
                    2. COMMUNITY ROUTES
                   ========================================= */}
                <Route path="/community" element={<CommunityHome />} />
                <Route path="/community/auth/callback" element={<CommunityGoogleCallback />} />
                
                <Route path="/community" element={<CommunityLayout />}>
                    <Route path="feed" element={<CommunityFeed />} />
                    <Route path="members" element={<CommunityMembers />} />
                    <Route path="profile" element={<PlayerProfile />} />
                    <Route path="games/:id" element={<GameDetail />} />
                    <Route path="announcements" element={<CommunityAnnouncements />} />
                    
                    {/* Admin/Organizer Routes */}
                    <Route path="admin/create-game" element={<CreateGame />} />
                    <Route path="admin/post-announcement" element={<PostAnnouncement />} />
                    <Route path="admin/analytics" element={<Analytics />} />
                </Route>

                {/* Default redirect for legacy routes */}
                <Route path="/coach-dashboard/*" element={<Navigate to="/community/feed" replace />} />
                <Route path="/dashboard/*" element={<Navigate to="/community/feed" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

if (document.getElementById("app")) {
    createRoot(document.getElementById("app")).render(<App />);
}
