import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import DynamicBackground from "../Components/DynamicBackground";
import PageLoader from "../Components/PageLoader";

const API = "/api/community";

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({ label, active, onClick }) {
    return (
        <button style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }} onClick={onClick}>
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
                {/* Brand / Logo */}
                <div style={S.brand} onClick={() => navigate("/")}>
                    <div style={S.logoContainer}>
                        <img 
                            src="/images/logoImage/NUVRA_LOGO.png" 
                            alt="Nuvra Logo" 
                            style={S.logoImg} 
                        />
                        <div style={S.brandTextCol}>
                            <div style={S.brandText}>NUVRA</div>
                            <div style={S.brandSubText}>FOOTBALL COMMUNITY</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={S.sideNav}>
                    <NavItem 
                        label="DASHBOARD" 
                        active={isActive("/community/feed")} 
                        onClick={() => navigate("/community/feed")} 
                    />
                    <NavItem 
                        label="ANNOUNCEMENTS" 
                        active={isActive("/community/announcements")} 
                        onClick={() => navigate("/community/announcements")} 
                    />

                    {/* ADMIN ONLY */}
                    {user?.role === "admin" && (
                        <>
                            <div style={S.navDivider}>ADMIN CONTROL</div>
                            <NavItem 
                                label="CREATE GAME" 
                                active={isActive("/community/admin/create-game")} 
                                onClick={() => navigate("/community/admin/create-game")} 
                            />
                            <NavItem 
                                label="POST NEWS" 
                                active={isActive("/community/admin/post-announcement")} 
                                onClick={() => navigate("/community/admin/post-announcement")} 
                            />
                            <NavItem 
                                label="ANALYTICS" 
                                active={isActive("/community/admin/analytics")} 
                                onClick={() => navigate("/community/admin/analytics")} 
                            />
                        </>
                    )}
                </nav>

                <div style={{ flex: 1 }} />

                {/* User section */}
                {user ? (
                    <div style={S.userBox}>
                        <div style={S.userAvatar}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" style={S.avatarImg} />
                            ) : (
                                user.name?.[0]?.toUpperCase()
                            )}
                        </div>
                        <div style={S.userInfo}>
                            <div style={S.userName}>{user.name}</div>
                            <button style={S.logoutBtn} onClick={logout}>Sign out</button>
                        </div>
                    </div>
                ) : (
                    <button style={S.signInBtn} onClick={() => navigate("/community")}>
                        SIGN IN
                    </button>
                )}
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={S.main}>
                <div style={S.bgImage} />
                <div style={S.bgOverlay} />
                <div style={S.contentWrapper}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
    root: {
        display: "flex",
        minHeight: "100vh",
        background: "#121212",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
    },

    /* SIDEBAR */
    sidebar: {
        width: 260,
        minWidth: 260,
        background: "#1e1e1e",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        borderRight: "1px solid rgba(255,255,255,0.05)",
    },
    brand: {
        padding: "32px 24px",
        cursor: "pointer",
    },
    logoContainer: {
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    logoImg: {
        width: 50,
        height: 50,
        objectFit: "contain",
        filter: "brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(90deg)", // Make it green-ish to match logo in ref
    },
    brandTextCol: {
        display: "flex",
        flexDirection: "column",
    },
    brandText: {
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: 1,
        lineHeight: 1,
        color: "#fff",
    },
    brandSubText: {
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1,
        color: "rgba(255,255,255,0.3)",
        marginTop: 4,
        textTransform: "uppercase",
    },
    sideNav: {
        padding: "0 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        padding: "12px 20px",
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.4)",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        borderRadius: 12,
        transition: "all 0.2s ease",
        textAlign: "left",
    },
    navItemActive: {
        background: "rgba(16, 185, 129, 0.1)", // Soft Emerald Green
        color: "#10b981", // Emerald Green
    },
    navDivider: {
        fontSize: 10,
        fontWeight: 800,
        color: "rgba(255,255,255,0.15)",
        letterSpacing: 1.5,
        padding: "24px 20px 8px 20px",
        textTransform: "uppercase",
    },
    userBox: {
        padding: "24px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "#444",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 800,
        overflow: "hidden",
    },
    avatarImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    userName: {
        fontSize: 14,
        fontWeight: 600,
        color: "rgba(255,255,255,0.8)",
    },
    logoutBtn: {
        marginTop: 4,
        background: "none",
        border: "none",
        color: "rgba(255,255,255,0.3)",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        padding: 0,
        textAlign: "left",
        transition: "color 0.2s",
    },
    signInBtn: {
        margin: "24px",
        padding: "12px",
        borderRadius: 12,
        border: "none",
        background: "linear-gradient(135deg, #00D4EC, #D040EF)",
        color: "#000",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
    },

    /* MAIN */
    main: {
        marginLeft: 260,
        flex: 1,
        background: "#121212",
        minHeight: "100vh",
        position: "relative",
    },
    bgImage: {
        position: "fixed",
        inset: 0,
        marginLeft: 260,
        backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1600')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: 0,
    },
    bgOverlay: {
        position: "fixed",
        inset: 0,
        marginLeft: 260,
        background: "linear-gradient(135deg, rgba(18,18,18,0.9) 0%, rgba(18,18,18,0.96) 100%)",
        zIndex: 1,
    },
    contentWrapper: {
        position: "relative",
        zIndex: 2,
        padding: "40px",
    },
};
