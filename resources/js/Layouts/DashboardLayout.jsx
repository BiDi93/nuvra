import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconGrid = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
);
const IconBell = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
);
const IconCalendar = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const IconCreditCard = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
);
const IconSettings = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
);
const IconLogOut = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

// ── Layout ─────────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (!token) { navigate("/login"); return; }

        axios.get("/api/player/me", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                const status = res.data.profile?.status;
                if (status === "pending") {
                    localStorage.setItem("player_status", "pending");
                    navigate("/waiting-room");
                    return;
                }
                if (status === "rejected") {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("player_status");
                    navigate("/login");
                    return;
                }
                localStorage.setItem("player_status", "active");
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                if (err.response?.status === 401) {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("player_status");
                    navigate("/login");
                }
            });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("player_status");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
    };

    if (loading || !data) return (
        <div style={{
            minHeight: "100vh",
            background: "#0d0d10",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#72727e",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13,
            letterSpacing: 3,
        }}>
            CHECKING ACCESS...
        </div>
    );

    const { profile } = data;

    const navLinks = [
        { path: "/dashboard",                label: "OVERVIEW",    icon: <IconGrid /> },
        { path: "/dashboard/announcements",  label: "NOTICES",     icon: <IconBell /> },
        { path: "/dashboard/schedule",       label: "MY SCHEDULE", icon: <IconCalendar /> },
        { path: "/dashboard/payment",        label: "MY FEES",     icon: <IconCreditCard /> },
        { path: "/dashboard/settings",       label: "SETTINGS",    icon: <IconSettings /> },
    ];

    return (
        <div style={S.root}>
            <style>{`
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 2px; }
                .dash-nav-btn:hover { background: rgba(255,255,255,0.04) !important; color: #F5F5F7 !important; }
                .dash-logout-btn:hover { color: #F5F5F7 !important; }
            `}</style>

            {/* ── SIDEBAR ── */}
            <aside style={S.sidebar}>

                {/* Brand */}
                <div style={S.brand} onClick={() => navigate("/")}>
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" style={S.brandLogo} />
                    <div>
                        <div style={S.brandText}>NUVRA</div>
                        <div style={S.brandSub}>PLAYER PORTAL</div>
                    </div>
                </div>

                <div style={S.divider} />

                {/* Nav */}
                <nav style={S.sideNav}>
                    {navLinks.map(link => {
                        const active = location.pathname === link.path;
                        return (
                            <button
                                key={link.path}
                                className="dash-nav-btn"
                                onClick={() => navigate(link.path)}
                                style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }}
                            >
                                {active && <div style={S.navActiveLine} />}
                                <span style={{ ...S.navIcon, color: active ? "#00D4EC" : "inherit" }}>
                                    {link.icon}
                                </span>
                                <span>{link.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div style={{ flex: 1 }} />
                <div style={S.divider} />

                {/* User */}
                <div style={S.userBox}>
                    <div style={S.userAvatar}>
                        {profile.profile_image ? (
                            <img
                                src={profile.profile_image}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                            />
                        ) : (
                            profile.name?.[0]?.toUpperCase()
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.userName}>{profile.name}</div>
                        <div style={S.userRole}>{profile.position?.toUpperCase() || "PLAYER"}</div>
                    </div>
                    <button
                        className="dash-logout-btn"
                        style={S.logoutBtn}
                        onClick={handleLogout}
                        title="Sign out"
                    >
                        <IconLogOut />
                    </button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main style={S.main}>
                <Outlet context={data} />
            </main>
        </div>
    );
}

const S = {
    root: {
        display: "flex",
        minHeight: "100vh",
        background: "#0d0d10",
        color: "#F5F5F7",
        fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
        width: 220,
        minWidth: 220,
        minHeight: "100vh",
        background: "#0f0f13",
        borderRight: "1px solid #222228",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
    },
    brand: {
        padding: "22px 18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 11,
    },
    brandLogo: {
        width: 30, height: 30,
        objectFit: "contain",
        flexShrink: 0,
    },
    brandText: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: 3,
        color: "#F5F5F7",
        lineHeight: 1,
    },
    brandSub: {
        fontSize: 8,
        letterSpacing: 2,
        color: "#72727e",
        marginTop: 3,
        textTransform: "uppercase",
    },
    divider: {
        height: 1,
        background: "#222228",
    },
    sideNav: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "10px 10px",
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        background: "transparent",
        border: "none",
        color: "#72727e",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.2,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        textAlign: "left",
        width: "100%",
        position: "relative",
        transition: "color 0.15s, background 0.15s",
        borderRadius: 4,
    },
    navItemActive: {
        color: "#F5F5F7",
        background: "rgba(0,212,236,0.06)",
    },
    navActiveLine: {
        position: "absolute",
        left: 0, top: 6, bottom: 6,
        width: 2,
        background: "#00D4EC",
        borderRadius: "0 2px 2px 0",
    },
    navIcon: {
        width: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    userBox: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px 16px",
    },
    userAvatar: {
        width: 32, height: 32,
        borderRadius: "50%",
        background: "#00D4EC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 800,
        color: "#0d0d10",
        flexShrink: 0,
        overflow: "hidden",
    },
    userName: {
        fontSize: 12,
        fontWeight: 600,
        color: "#F5F5F7",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userRole: {
        fontSize: 9,
        letterSpacing: 1,
        color: "#72727e",
        marginTop: 2,
    },
    logoutBtn: {
        background: "none",
        border: "none",
        color: "#72727e",
        cursor: "pointer",
        padding: "4px",
        flexShrink: 0,
        transition: "color 0.15s",
        display: "flex",
        alignItems: "center",
    },
    main: {
        marginLeft: 220,
        flex: 1,
        minHeight: "100vh",
    },
};
