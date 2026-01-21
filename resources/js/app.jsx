import "./bootstrap";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import Pages
import LandingPage from "./Pages/LandingPage";
import CoachLogin from "./Pages/CoachLogin";
import CoachDashboard from "./Pages/CoachDashboard";
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

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 1. Public Routes */}
                <Route path="/" element={<LandingPage />} />

                {/* 2. Coach Routes */}
                {/* The /coach URL now shows the Login Screen */}
                <Route path="/coach" element={<CoachLogin />} />
                {/* After login, they get sent here */}
                {/* COACH DASHBOARD (Nested Routes) */}
                <Route path="/coach-dashboard" element={<CoachLayout />}>
                    <Route index element={<SquadManagement />} />
                    <Route path="add-stats" element={<RecordStats />} />
                    <Route path="announcements" element={<CoachAnnouncements />} />
                    <Route path="schedule" element={<CoachSchedule />} />
                </Route>

                <Route path="/coach/player/:id" element={<CoachPlayerView />} />
                <Route path="/coach/add-stats" element={<CoachAddStats />} />

                {/* 3. Player Dashboard (Nested Routes) */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
                
            </Routes>
        </BrowserRouter>
    );
}

if (document.getElementById("app")) {
    createRoot(document.getElementById("app")).render(<App />);
}
