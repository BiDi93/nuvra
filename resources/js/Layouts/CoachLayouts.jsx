import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function CoachLayout() {
    const navigate = useNavigate();

    const coachName   = localStorage.getItem("coach_name")   || "Coach";
    const coachAvatar = localStorage.getItem("coach_avatar")  || null;

    const handleLogout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("coach_id");
        localStorage.removeItem("coach_name");
        localStorage.removeItem("coach_avatar");
        window.location.href = "/login";
    };

    const navLinks = [
        { to: "/coach-dashboard",               end: true,  icon: "⊞", label: "SQUAD" },
        { to: "/coach-dashboard/add-stats",      end: false, icon: "📊", label: "RECORD STATS" },
        { to: "/coach-dashboard/announcements",  end: false, icon: "📢", label: "NOTICES" },
        { to: "/coach-dashboard/schedule",       end: false, icon: "📅", label: "SCHEDULE" },
        { to: "/coach-dashboard/payment",        end: false, icon: "💳", label: "PAYMENT" },
    ];

    return (
        <div style={S.root}>
            <style>{`
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
                .coach-nav-link { display:flex; align-items:center; gap:10px; padding:10px 20px; background:transparent; border:none; color:rgba(255,255,255,0.45); font-size:11px; font-weight:700; letter-spacing:1.2px; cursor:pointer; font-family:inherit; text-align:left; width:100%; text-decoration:none; position:relative; transition: color 0.2s, background 0.2s; }
                .coach-nav-link:hover { color:rgba(255,255,255,0.8); background:rgba(255,255,255,0.05); }
                .coach-nav-link.active { color:#fff; background:rgba(255,255,255,0.08); }
                .coach-nav-link.active::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#a78bfa,#7c3aed); border-radius:0 2px 2px 0; }
            `}</style>

            {/* ── LEFT SIDEBAR ── */}
            <aside style={S.sidebar}>
                <div style={S.brand} onClick={() => navigate("/")}>
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" style={S.brandLogo} />
                    <div>
                        <div style={S.brandText}>NUVRA</div>
                        <div style={S.brandSub}>CLUB PORTAL</div>
                    </div>
                </div>

                <div style={S.divider} />

                <nav style={S.sideNav}>
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) => `coach-nav-link${isActive ? " active" : ""}`}
                        >
                            <span style={S.navIcon}>{link.icon}</span>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ flex: 1 }} />

                {/* ── PROFILE + SIGN OUT ── */}
                <div style={S.profileSection}>
                    <div style={S.divider} />
                    <div style={S.profileCard}>
                        {coachAvatar ? (
                            <img src={coachAvatar} alt={coachName} style={S.avatar} />
                        ) : (
                            <div style={S.avatarFallback}>
                                {coachName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={S.profileInfo}>
                            <div style={S.profileName}>{coachName}</div>
                            <div style={S.profileRole}>Head Coach</div>
                        </div>
                    </div>
                    <button style={S.logoutBtn} onClick={handleLogout}>
                        <span>↩</span>
                        <span>SIGN OUT</span>
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={S.main}>
                <div style={S.pageWrapper}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

const S = {
    root: {
        display: "flex",
        minHeight: "100vh",
        background: "#ffffff",
        color: "#1a1a2e",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
    },
    sidebar: {
        width: 220,
        minWidth: 220,
        minHeight: "100vh",
        background: "rgba(6,7,18,0.97)",
        borderRight: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
    },
    brand: {
        padding: "24px 20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    brandLogo: {
        width: 36, height: 36,
        objectFit: "contain",
        flexShrink: 0,
    },
    brandText: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 20,
        letterSpacing: 3,
        color: "#fff",
        lineHeight: 1,
    },
    brandSub: {
        fontSize: 8,
        letterSpacing: 2,
        color: "rgba(167,139,250,0.6)",
        marginTop: 2,
        textTransform: "uppercase",
    },
    divider: {
        height: 1,
        background: "rgba(255,255,255,0.05)",
        margin: "4px 0",
    },
    sideNav: {
        display: "flex",
        flexDirection: "column",
        gap: 1,
        padding: "8px 0",
    },
    navIcon: {
        fontSize: 14,
        width: 20,
        textAlign: "center",
        flexShrink: 0,
    },
    profileSection: {
        padding: "0 0 8px 0",
    },
    profileCard: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 16px",
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: "2px solid rgba(167,139,250,0.4)",
    },
    avatarFallback: {
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
    },
    profileInfo: {
        overflow: "hidden",
    },
    profileName: {
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        letterSpacing: 0.5,
    },
    profileRole: {
        fontSize: 9,
        color: "rgba(167,139,250,0.6)",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginTop: 2,
    },
    logoutBtn: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        background: "transparent",
        border: "none",
        color: "rgba(255,100,100,0.5)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.2,
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
        transition: "color 0.2s",
    },
    main: {
        marginLeft: 220,
        flex: 1,
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
        background: "#f8f9fb",
    },
    pageWrapper: {
        padding: "36px 40px 60px",
        maxWidth: 1200,
    },
};
