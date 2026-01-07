import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import LandingPage from './Pages/LandingPage';
import CoachDashboard from './Pages/CoachDashboard';

// Import New Layout and Modules
import DashboardLayout from './Layouts/DashboardLayout';
import Overview from './Pages/Modules/Overview';
import Team from './Pages/Modules/Team';
import Announcements from './Pages/Modules/Announcements';
import Settings from './Pages/Modules/Settings';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 1. Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/coach" element={<CoachDashboard />} />

                {/* 2. Player Dashboard (Nested Routes) */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                    {/* Default view: Stats Overview */}
                    <Route index element={<Overview />} />
                    
                    {/* Sub-pages */}
                    <Route path="team" element={<Team />} />
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

if (document.getElementById('app')) {
    createRoot(document.getElementById('app')).render(<App />);
}