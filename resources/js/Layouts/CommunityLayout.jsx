import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import DynamicBackground from "../Components/DynamicBackground";
import PageLoader from "../Components/PageLoader";
import {
    IconTrophy, IconUsers, IconUser, IconBell, IconPlusCircle, IconMegaphone,
    IconBarChart, IconUserCheck, IconChevronDown, IconCheck, IconX, IconSettings,
} from "../Components/Icons";

const API = "/api/community";

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({ label, icon, active, onClick, noIndicator, badge, badgeVariant = "accent" }) {
    return (
        <button
            style={{ ...S.navItem, ...((active && !noIndicator) ? S.navItemActive : {}) }}
            onClick={onClick}
            className={noIndicator ? "notif-nav-btn" : ""}
        >
            {icon && <span style={S.navIcon}>{icon}</span>}
            <span style={S.navLabel}>{label}</span>
            {!!badge && (
                <span style={{ ...S.navBadge, ...(badgeVariant === "warn" ? S.navBadgeWarn : S.navBadgeAccent) }}>
                    {badge}
                </span>
            )}
            {active && !noIndicator && <div style={S.activeIndicator} />}
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
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const fetchPendingCount = async () => {
        const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("community_user");
        if (!token || !storedUser) return;
        const u = JSON.parse(storedUser);
        if (u?.role !== "club_owner" && u?.role !== "admin") return;
        try {
            const res = await fetch(`${API}/admin/pending-players`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingCount(data.count ?? 0);
            }
        } catch { /* silent */ }
    };


    const fetchNotifications = async () => {
        const token = localStorage.getItem("community_token");
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 401) {
                localStorage.removeItem("community_token");
                localStorage.removeItem("community_user");
                window.location.href = "/community";
                return;
            }
            const data = await res.json();
            if (res.ok) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem("community_user");
        if (stored) setUser(JSON.parse(stored));

        fetchNotifications();
        fetchPendingCount();
        const interval = setInterval(() => {
            fetchNotifications();
            fetchPendingCount();
        }, 20000);


        const handleClickOutside = (e) => {
            if (showNotifications && !e.target.closest(".notifications-dropdown") && !e.target.closest(".notif-nav-btn")) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("click", handleClickOutside);

        return () => {
            clearInterval(interval);
            document.removeEventListener("click", handleClickOutside);
        };
    }, [showNotifications]);

    const handleMarkAsRead = async (id, matchId) => {
        const token = localStorage.getItem("community_token");
        try {
            await fetch(`${API}/notifications/${id}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
            setShowNotifications(false);
            if (matchId) {
                navigate(`/community/games/${matchId}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

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

                .notifications-dropdown {
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ── Mobile: hide sidebar, remove main margin ── */
                @media (max-width: 768px) {
                    .nuvra-sidebar { display: none !important; }
                    .nuvra-main   { margin-left: 0 !important; }
                    .nuvra-content { padding: 24px 16px 90px !important; }
                    .nuvra-bottom-nav { display: flex !important; }
                    .notifications-dropdown {
                        position: fixed !important;
                        left: 16px !important;
                        right: 16px !important;
                        top: 20px !important;
                        width: auto !important;
                        z-index: 200 !important;
                    }
                }

                /* ── Bottom Nav ── */
                .nuvra-bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    height: 68px;
                    background: var(--bg-sidebar, #0f0f13);
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
                .bnav-icon { display: flex; align-items: center; justify-content: center; line-height: 1; }
                .bnav-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; font-family: 'Inter', sans-serif; }
            `}</style>

            {/* ── LEFT SIDEBAR ── */}
            <aside style={S.sidebar} className="nuvra-sidebar">
                {/* Brand / Logo */}
                <div style={S.brand} onClick={() => navigate("/")}>
                    <div style={S.logoContainer}>
                        <img
                            src="/images/logoImage/NUVRA_LOGO.webp"
                            alt="Nuvra Logo"
                            style={S.logoImg}
                        />
                        <div style={S.brandText}>NUVRA</div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={S.sideNav}>
                    <NavItem
                        label="TOURNAMENTS"
                        icon={<IconTrophy size={17} />}
                        active={isActive("/community/feed")}
                        onClick={() => navigate("/community/feed")}
                    />
                    <NavItem
                        label="MEMBERS"
                        icon={<IconUsers size={17} />}
                        active={isActive("/community/members")}
                        onClick={() => navigate("/community/members")}
                    />
                    <NavItem
                        label="PROFILE"
                        icon={<IconUser size={17} />}
                        active={isActive("/community/profile")}
                        onClick={() => navigate("/community/profile")}
                    />

                    {user && (
                        <div style={{ position: "relative" }}>
                            <NavItem
                                label="NOTIFICATIONS"
                                icon={<IconBell size={17} />}
                                active={showNotifications}
                                noIndicator={true}
                                badge={unreadCount > 0 ? unreadCount : null}
                                badgeVariant="accent"
                                onClick={() => setShowNotifications(!showNotifications)}
                            />

                            {showNotifications && (
                                <div style={S.notificationsDropdown} className="notifications-dropdown">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <h4 style={S.notifTitle}>RECENT NOTIFICATIONS</h4>
                                        {unreadCount > 0 && (
                                            <button 
                                                style={{ background: "none", border: "none", color: "#00D4EC", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                                                onClick={async () => {
                                                    const token = localStorage.getItem("community_token");
                                                    await fetch(`${API}/notifications/read-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                    fetchNotifications();
                                                }}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div style={S.notifList}>
                                        {notifications.length === 0 ? (
                                            <p style={S.emptyNotif}>No recent notifications.</p>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    style={{ ...S.notifItem, opacity: n.read_at ? 0.5 : 1 }} 
                                                    onClick={() => handleMarkAsRead(n.id, n.data?.match_id)}
                                                >
                                                    <div style={{ ...S.notifIcon, ...(n.data?.status === "approved" ? S.notifIconOk : S.notifIconNo) }}>
                                                        {n.data?.status === "approved" ? <IconCheck size={13} /> : <IconX size={13} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={S.notifMessage}>{n.data?.message}</div>
                                                        <div style={S.notifTime}>{n.created_at}</div>
                                                    </div>
                                                    {!n.read_at && <div style={S.unreadDot} />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADMIN / ORGANIZER ONLY */}
                    {(user?.role === "club_owner" || user?.role === "admin") && (
                        <>
                            <div style={S.navDivider}>ORGANIZER CONTROL</div>
                            <NavItem
                                label="CREATE TOURNAMENT"
                                icon={<IconPlusCircle size={17} />}
                                active={isActive("/community/admin/create-tournament")}
                                onClick={() => navigate("/community/admin/create-tournament")}
                            />
                            <NavItem
                                label="POST NEWS"
                                icon={<IconMegaphone size={17} />}
                                active={isActive("/community/admin/post-announcement")}
                                onClick={() => navigate("/community/admin/post-announcement")}
                            />
                            <NavItem
                                label="ANALYTICS"
                                icon={<IconBarChart size={17} />}
                                active={isActive("/community/admin/analytics")}
                                onClick={() => navigate("/community/admin/analytics")}
                            />
                            <NavItem
                                label="PENDING PLAYERS"
                                icon={<IconUserCheck size={17} />}
                                active={isActive("/community/admin/pending-players")}
                                badge={pendingCount > 0 ? pendingCount : null}
                                badgeVariant="warn"
                                onClick={() => navigate("/community/admin/pending-players")}
                            />
                        </>
                    )}

                </nav>

                <div style={{ flex: 1 }} />

                {/* User section */}
                {user ? (
                    <div style={S.userBox} onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div style={S.avatarRing}>
                            <div style={S.userAvatar}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" style={S.avatarImg} />
                                ) : (
                                    <div style={S.avatarPlaceholder}>{user.name[0].toUpperCase()}</div>
                                )}
                            </div>
                        </div>
                        <div style={S.userInfo}>
                            <div style={S.userName}>{user.name}</div>
                            <div style={S.userRole}>{user.role?.toUpperCase() || "PLAYER"}</div>
                        </div>
                        <div style={S.dropdownArrow}><IconChevronDown size={14} /></div>

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
                <BottomNavItem icon={<IconTrophy size={20} />} label="LEAGUES" active={isActive("/community/feed")} onClick={() => navigate("/community/feed")} />
                <BottomNavItem icon={<IconUsers size={20} />} label="MEMBERS" active={isActive("/community/members")} onClick={() => navigate("/community/members")} />
                <BottomNavItem icon={<IconUser size={20} />} label="PROFILE" active={isActive("/community/profile")} onClick={() => navigate("/community/profile")} />
                {(user?.role === "club_owner" || user?.role === "admin") && (
                    <BottomNavItem icon={<IconSettings size={20} />} label="ADMIN" active={location.pathname.startsWith("/community/admin")} onClick={() => navigate("/community/admin/create-tournament")} />
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
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
    },

    /* SIDEBAR (Glossy Dark Glassmorphism) */
    sidebar: {
        width: 260,
        minWidth: 260,
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(10, 15, 29, 0.98) 100%)",
        backdropFilter: "blur(24px) saturate(190%)",
        WebkitBackdropFilter: "blur(24px) saturate(190%)",
        boxShadow: "inset -1px 0 0 0 rgba(255, 255, 255, 0.08), 4px 0 30px rgba(0, 0, 0, 0.15)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
    },
    brand: {
        padding: "36px 24px 28px",
        cursor: "pointer",
    },
    logoContainer: {
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    logoImg: {
        width: 38,
        height: 38,
        objectFit: "contain",
        filter: "drop-shadow(0 2px 8px rgba(0, 212, 236, 0.3))",
    },
    brandText: {
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: 1.5,
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
        padding: "10px 16px",
        background: "transparent",
        border: "1px solid transparent",
        color: "rgba(255,255,255,0.55)",
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: 0.3,
        cursor: "pointer",
        fontFamily: "inherit",
        borderRadius: 10,
        transition: "background 0.15s ease, color 0.15s ease",
        textAlign: "left",
        gap: 11,
        position: "relative",
    },
    navItemActive: {
        background: "rgba(0, 212, 236, 0.08)",
        color: "#fff",
    },
    navIcon: {
        display: "flex",
        alignItems: "center",
        color: "inherit",
    },
    activeIndicator: {
        position: "absolute",
        left: 0,
        top: "22%",
        bottom: "22%",
        width: 2.5,
        background: "#00D4EC",
        borderRadius: "0 4px 4px 0",
    },
    navBadge: {
        marginLeft: "auto",
        fontSize: 10.5,
        fontWeight: 800,
        padding: "2.5px 8px",
        borderRadius: 20,
        flexShrink: 0,
    },
    navBadgeAccent: {
        background: "rgba(0, 212, 236, 0.15)",
        color: "#00D4EC",
    },
    navBadgeWarn: {
        background: "rgba(251, 191, 36, 0.16)",
        color: "#FBBF24",
    },
    navDivider: {
        fontSize: 10,
        fontWeight: 800,
        color: "rgba(255,255,255,0.3)",
        letterSpacing: 1.5,
        padding: "24px 18px 8px 18px",
        textTransform: "uppercase",
    },
    userBox: {
        margin: "12px",
        padding: "14px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
    },
    avatarRing: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "var(--accent-gradient)",
        padding: 2,
        flexShrink: 0,
    },
    userAvatar: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        overflow: "hidden",
        background: "#0d0d10",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarPlaceholder: {
        fontSize: 14,
        fontWeight: 800,
        color: "#fff",
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
        display: "flex",
        alignItems: "center",
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
        background: "var(--accent-gradient)",
        color: "#0a0e16",
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 0.5,
        cursor: "pointer",
    },

    /* MAIN (dark canvas — continuous with the sidebar, no light seam) */
    main: {
        marginLeft: 260,
        flex: 1,
        background: "var(--bg-base)",
        minHeight: "100vh",
        position: "relative",
        color: "var(--text-primary)",
    },
    bgImage: {
        display: "none",
    },
    bgOverlay: {
        position: "fixed",
        inset: 0,
        marginLeft: 260,
        background: "radial-gradient(circle at top right, rgba(0, 212, 236, 0.06), transparent 45%), radial-gradient(circle at bottom left, rgba(208, 64, 239, 0.05), transparent 45%)",
        zIndex: 1,
        pointerEvents: "none",
    },
    contentWrapper: {
        position: "relative",
        zIndex: 2,
        padding: "40px 48px 80px",
    },
    notificationsDropdown: {
        position: "absolute",
        left: 250,
        top: 0,
        width: 320,
        background: "#1e2330",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 12
    },
    notifTitle: {
        fontSize: 11,
        fontWeight: 800,
        color: "rgba(255,255,255,0.3)",
        letterSpacing: 1,
        textTransform: "uppercase",
        margin: 0
    },
    notifList: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: 280,
        overflowY: "auto"
    },
    notifItem: {
        display: "flex",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "background 0.2s",
        alignItems: "center"
    },
    notifIcon: {
        width: 26,
        height: 26,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    notifIconOk: {
        background: "rgba(34, 197, 94, 0.14)",
        color: "#22C55E",
    },
    notifIconNo: {
        background: "rgba(239, 68, 68, 0.14)",
        color: "#EF4444",
    },
    notifMessage: {
        fontSize: 13,
        fontWeight: 600,
        color: "#fff",
        lineHeight: "1.4",
        textAlign: "left"
    },
    notifTime: {
        fontSize: 10,
        color: "rgba(255,255,255,0.3)",
        marginTop: 4,
        textAlign: "left"
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#00D4EC",
        flexShrink: 0
    },
    emptyNotif: {
        fontSize: 12,
        color: "rgba(255,255,255,0.3)",
        textAlign: "center",
        padding: "20px 0",
        width: "100%"
    }
};
