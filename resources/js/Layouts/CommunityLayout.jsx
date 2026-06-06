import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import DynamicBackground from "../Components/DynamicBackground";
import PageLoader from "../Components/PageLoader";

const API = "/api/community";

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({ label, icon, active, onClick }) {
    return (
        <button style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }} onClick={onClick}>
            {icon && <span style={S.navIcon}>{icon}</span>}
            <span style={S.navLabel}>{label}</span>
            {active && <div style={S.activeIndicator} />}
        </button>
    );
}

// ── Bottom Nav Item (mobile) ──────────────────────────────────────────────────
function BottomNavItem({ icon, label, active, onClick }) {
    return (
        <button className={`bnav-item${active ? " bnav-active" : ""}`} onClick={onClick}>
            <span className="bnav-icon">{icon}</span>
            <span className="bnav-label">{label}</span>
        </button>
    );
}

export default function CommunityLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

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

                /* ── Mobile: hide sidebar, remove main margin ── */
                @media (max-width: 768px) {
                    .nuvra-sidebar { display: none !important; }
                    .nuvra-main   { margin-left: 0 !important; }
                    .nuvra-content { padding: 24px 16px 90px !important; }
                    .nuvra-bottom-nav { display: flex !important; }
                }

                /* ── Bottom Nav ── */
                .nuvra-bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    height: 68px;
                    background: #121620;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    z-index: 100;
                    align-items: center;
                    justify-content: space-around;
                    padding: 0 8px;
                }
                .bnav-item {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 4px; flex: 1; background: none; border: none;
                    color: rgba(255,255,255,0.35); cursor: pointer;
                    padding: 8px 4px; border-radius: 12px;
                    transition: color 0.2s;
                }
                .bnav-item.bnav-active { color: #00D4EC; }
                .bnav-icon { font-size: 22px; line-height: 1; }
                .bnav-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; font-family: 'Inter', sans-serif; }
            `}</style>

            {/* ── LEFT SIDEBAR ── */}
            <aside style={S.sidebar} className="nuvra-sidebar">
                {/* Brand / Logo */}
                <div style={S.brand} onClick={() => navigate("/")}>
                    <div style={S.logoContainer}>
                        <img 
                            src="/images/logoImage/NUVRA_LOGO.png" 
                            alt="Nuvra Logo" 
                            style={S.logoImg} 
                        />
                        <div style={S.brandText}>NUVRA</div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={S.sideNav}>
                    <NavItem 
                        label="DASHBOARD" 
                        icon="📊"
                        active={isActive("/community/feed")} 
                        onClick={() => navigate("/community/feed")} 
                    />
                    <NavItem 
                        label="COMMUNITY" 
                        icon="✨" // New prettier icon
                        active={isActive("/community/members")} 
                        onClick={() => navigate("/community/members")} 
                    />
                    <NavItem 
                        label="PROFILE" 
                        icon="👤"
                        active={isActive("/community/profile")} 
                        onClick={() => navigate("/community/profile")} 
                    />

                    {/* ADMIN / ORGANIZER ONLY */}
                    {(user?.role === "club_owner" || user?.role === "admin") && (
                        <>
                            <div style={S.navDivider}>ORGANIZER CONTROL</div>
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
                    <div style={S.userBox} onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div style={S.userAvatar}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="" style={S.avatarImg} />
                            ) : (
                                <div style={S.avatarPlaceholder}>{user.name[0].toUpperCase()}</div>
                            )}
                        </div>
                        <div style={S.userInfo}>
                            <div style={S.userName}>{user.name}</div>
                            <div style={S.userRole}>{user.role?.toUpperCase() || "PLAYER"}</div>
                        </div>
                        <div style={S.dropdownArrow}>⌄</div>
                        
                        {showUserMenu && (
                            <div style={S.userMenu}>
                                <button style={S.menuItem} onClick={logout}>Sign out</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button style={S.signInBtn} onClick={() => navigate("/community")}>
                        SIGN IN
                    </button>
                )}
            </aside>

            {/* ── MOBILE BOTTOM NAV ── */}
            <nav className="nuvra-bottom-nav">
                <BottomNavItem icon="📊" label="HOME" active={isActive("/community/feed")} onClick={() => navigate("/community/feed")} />
                <BottomNavItem icon="✨" label="COMMUNITY" active={isActive("/community/members")} onClick={() => navigate("/community/members")} />
                <BottomNavItem icon="👤" label="PROFILE" active={isActive("/community/profile")} onClick={() => navigate("/community/profile")} />
                {(user?.role === "club_owner" || user?.role === "admin") && (
                    <BottomNavItem icon="⚙️" label="ADMIN" active={location.pathname.startsWith("/community/admin")} onClick={() => navigate("/community/admin/create-game")} />
                )}
            </nav>

            {/* ── MAIN CONTENT ── */}
            <main style={S.main} className="nuvra-main">
                <div style={S.bgImage} />
                <div style={S.bgOverlay} />
                <div style={S.contentWrapper} className="nuvra-content">
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
        background: "#121620", // Deep Navy
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        borderRight: "1px solid rgba(255,255,255,0.03)",
    },
    brand: {
        padding: "40px 24px",
        cursor: "pointer",
    },
    logoContainer: {
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    logoImg: {
        width: 40,
        height: 40,
        objectFit: "contain",
    },
    brandText: {
        fontSize: 24,
        fontWeight: 900,
        letterSpacing: 1,
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
    },
    sideNav: {
        padding: "0 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        padding: "14px 20px",
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.4)",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        borderRadius: 12,
        transition: "all 0.2s ease",
        textAlign: "left",
        gap: 12,
        position: "relative",
    },
    navItemActive: {
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
    },
    navIcon: {
        fontSize: 18,
        filter: "grayscale(1) brightness(2)",
    },
    activeIndicator: {
        position: "absolute",
        left: 0,
        top: "20%",
        bottom: "20%",
        width: 4,
        background: "#00D4EC",
        borderRadius: "0 4px 4px 0",
    },
    navDivider: {
        fontSize: 10,
        fontWeight: 800,
        color: "rgba(255,255,255,0.15)",
        letterSpacing: 1.5,
        padding: "32px 20px 8px 20px",
        textTransform: "uppercase",
    },
    userBox: {
        margin: "12px",
        padding: "16px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.02)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        position: "relative",
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarPlaceholder: {
        fontSize: 16,
        fontWeight: 900,
        color: "#00D4EC",
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
        fontWeight: 700,
        color: "#fff",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userRole: {
        fontSize: 11,
        fontWeight: 600,
        color: "rgba(255,255,255,0.3)",
        marginTop: 2,
        letterSpacing: 0.5,
    },
    dropdownArrow: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 18,
    },
    userMenu: {
        position: "absolute",
        bottom: "100%",
        left: 0,
        right: 0,
        background: "#1e2330",
        borderRadius: 12,
        padding: 8,
        marginBottom: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.05)",
    },
    menuItem: {
        width: "100%",
        padding: "10px",
        background: "none",
        border: "none",
        color: "#fff",
        textAlign: "left",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        borderRadius: 8,
    },
    signInBtn: {
        margin: "24px",
        padding: "12px",
        borderRadius: 12,
        border: "none",
        background: "#00D4EC", // Match lime theme
        color: "#000",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
    },

    /* MAIN */
    main: {
        marginLeft: 260,
        flex: 1,
        background: "#0d111a", // Master Background
        minHeight: "100vh",
        position: "relative",
    },
    bgImage: {
        display: "none", // Hide the old image
    },
    bgOverlay: {
        position: "fixed",
        inset: 0,
        marginLeft: 260,
        background: "radial-gradient(circle at top right, rgba(0, 212, 236, 0.03), transparent 40%), radial-gradient(circle at bottom left, rgba(0, 212, 236, 0.02), transparent 40%)",
        zIndex: 1,
    },
    contentWrapper: {
        position: "relative",
        zIndex: 2,
        padding: "60px 48px", // More spacious
    },
};
