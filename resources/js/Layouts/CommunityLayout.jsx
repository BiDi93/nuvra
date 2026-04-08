import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import DynamicBackground from "../Components/DynamicBackground";
import PageLoader from "../Components/PageLoader";

const API = "/api/community";

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }) {
    return (
        <button style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }} onClick={onClick}>
            {active && <div style={S.navActiveLine} />}
            <span style={S.navIcon}>{icon}</span>
            <span style={S.navLabel}>{label}</span>
        </button>
    );
}

export default function CommunityLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem("community_user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const logout = () => {
        const token = localStorage.getItem("community_token");
        if (token) fetch(`${API}/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        localStorage.removeItem("community_token");
        localStorage.removeItem("community_user");
        navigate("/community");
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div style={S.root}>
            <PageLoader />
            <DynamicBackground />

            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
            `}</style>

            {/* ── LEFT SIDEBAR ── */}
            <aside style={S.sidebar}>
                {/* Brand */}
                <div style={S.brand} onClick={() => navigate("/")}>
                    <div style={S.brandText}>NUVRA</div>
                    <div style={S.brandSub}>FOOTBALL COMMUNITY</div>
                </div>

                {/* Nav */}
                <nav style={S.sideNav}>
                    <NavItem 
                        icon="⊞" 
                        label="DASHBOARD" 
                        active={isActive("/community/feed")} 
                        onClick={() => navigate("/community/feed")} 
                    />
                    <NavItem 
                        icon="📢" 
                        label="ANNOUNCEMENTS" 
                        active={isActive("/community/announcements")} 
                        onClick={() => navigate("/community/announcements")} 
                    />
                    {user?.role === "admin" && (
                        <NavItem 
                            icon="+" 
                            label="POST GAME" 
                            active={isActive("/community/admin/create-game")} 
                            onClick={() => navigate("/community/admin/create-game")} 
                        />
                    )}
                </nav>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* User section */}
                {user ? (
                    <div style={S.userBox}>
                        <div style={S.userAvatar}>{user.name?.[0]?.toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={S.userName}>{user.name}</div>
                            <div style={S.userRole}>{user.role?.toUpperCase() || "MEMBER"}</div>
                        </div>
                        <button style={S.logoutBtn} onClick={logout} title="Sign out">↩</button>
                    </div>
                ) : (
                    <button style={S.signInBtn} onClick={() => navigate("/community")}>
                        SIGN IN
                    </button>
                )}
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={S.main}>
                <Outlet />
            </main>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
    root: {
        display: "flex",
        minHeight: "100vh",
        background: "#080a12",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
    },

    /* SIDEBAR */
    sidebar: {
        width: 210,
        minWidth: 210,
        maxWidth: 210,
        minHeight: "100vh",
        background: "rgba(6,7,18,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        backdropFilter: "blur(20px)",
    },
    brand: {
        padding: "28px 20px 20px",
        cursor: "pointer",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: 8,
    },
    brandText: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22,
        letterSpacing: 3,
        color: "#fff",
        lineHeight: 1,
    },
    brandSub: {
        fontSize: 9,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.3)",
        marginTop: 3,
        textTransform: "uppercase",
    },
    sideNav: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 0",
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.2,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        position: "relative",
        transition: "color 0.2s, background 0.2s",
        borderRadius: 0,
        width: "100%",
    },
    navItemActive: {
        color: "#fff",
        background: "rgba(255,255,255,0.04)",
    },
    navIcon: {
        fontSize: 14,
        width: 20,
        textAlign: "center",
    },
    navLabel: {
        flex: 1,
    },
    navActiveLine: {
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: "linear-gradient(180deg, #00D4EC, #D040EF)",
        borderRadius: "0 2px 2px 0",
    },
    userBox: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "16px 20px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #00D4EC, #D040EF)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 800,
        color: "#080810",
        flexShrink: 0,
    },
    userName: {
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userRole: {
        fontSize: 9,
        letterSpacing: 1,
        color: "rgba(255,255,255,0.3)",
        marginTop: 1,
    },
    logoutBtn: {
        background: "none",
        border: "none",
        color: "rgba(255,255,255,0.3)",
        fontSize: 16,
        cursor: "pointer",
        padding: "2px 4px",
        transition: "color 0.2s",
        flexShrink: 0,
    },
    signInBtn: {
        margin: "12px 16px 20px",
        padding: "10px",
        borderRadius: 6,
        border: "1px solid rgba(0,212,236,0.3)",
        background: "rgba(0,212,236,0.05)",
        color: "#00D4EC",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.5,
        cursor: "pointer",
        fontFamily: "inherit",
    },

    /* MAIN */
    main: {
        marginLeft: 210,
        flex: 1,
        padding: "0 32px 48px",
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
    },
};
