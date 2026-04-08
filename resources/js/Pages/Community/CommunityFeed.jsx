import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        open:      { label: "OPEN",      color: "#00ff87", bg: "rgba(0,255,135,0.1)" },
        full:      { label: "FULL",      color: "#ff4444", bg: "rgba(255,68,68,0.1)" },
        cancelled: { label: "CANCELLED", color: "#ff6b35", bg: "rgba(255,107,53,0.1)" },
        completed: { label: "DONE",      color: "#888",    bg: "rgba(255,255,255,0.05)" },
    };
    const s = map[status] || map.open;
    return (
        <span style={{
            padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800,
            letterSpacing: 0.8, background: s.bg, color: s.color,
            border: `1px solid ${s.color}33`,
        }}>
            {s.label}
        </span>
    );
}

// ── Slot Progress Bar ─────────────────────────────────────────────────────────
function SlotBar({ filled, max }) {
    const pct = Math.min((filled / max) * 100, 100);
    const remaining = max - filled;
    const isFull = remaining <= 0;
    const isLow  = remaining <= 5 && !isFull;
    const color  = isFull ? "#ff4444" : isLow ? "#ff6b35" : "#00ff87";
    return (
        <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 5, color: "rgba(255,255,255,0.35)" }}>
                <span style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>SLOTS</span>
                <span style={{ color, fontWeight: 700 }}>
                    {isFull ? "FULL" : `${remaining}/${max} left`}
                </span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${isFull ? "#ff4444" : "#00c9ff"})`, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
        </div>
    );
}

// ── Game Card (Grid style) ────────────────────────────────────────────────────
function GameCard({ game, onClick }) {
    const totalA = game.team_a_count ?? 0;
    const totalB = game.team_b_count ?? 0;
    const filled = totalA + totalB;
    const max    = game.max_slots_per_team * 2;
    const date   = new Date(game.game_date);
    const dayStr = date.toLocaleDateString("en-MY", { weekday: "short" }).toUpperCase();
    const dateNum = date.getDate();
    const timeStr = date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
    const isOpen  = game.status === "open";

    return (
        <div style={S.card} onClick={onClick} className="grid-card">
            {/* Gradient border glow on left */}
            <div style={S.cardAccent} />

            <div style={S.cardInner}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                        <div style={S.cardTitle}>{game.title}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                            📍 {game.venue}
                        </div>
                    </div>
                    <StatusBadge status={game.status} />
                </div>

                {/* Date/Time pill */}
                <div style={S.datePill}>
                    <span style={S.datePillDay}>{dayStr} {dateNum}</span>
                    <span style={S.datePillTime}>{timeStr}</span>
                </div>

                {/* VS row */}
                <div style={S.vsRow}>
                    <div style={S.teamSide}>
                        <span style={S.teamLabel}>{game.team_a_name}</span>
                        <span style={S.teamCount}>{totalA}/{game.max_slots_per_team}</span>
                    </div>
                    <div style={S.vsChip}>VS</div>
                    <div style={{ ...S.teamSide, textAlign: "right" }}>
                        <span style={S.teamLabel}>{game.team_b_name}</span>
                        <span style={S.teamCount}>{totalB}/{game.max_slots_per_team}</span>
                    </div>
                </div>

                <SlotBar filled={filled} max={max} />

                <button
                    style={{ ...S.joinBtn, ...(isOpen ? {} : S.joinBtnDisabled) }}
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                >
                    {isOpen ? "VIEW & JOIN" : game.status === "full" ? "GAME FULL" : game.status.toUpperCase()}
                </button>
            </div>
        </div>
    );
}

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }) {
    return (
        <button style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }} onClick={onClick}>
            <span style={S.navIcon}>{icon}</span>
            <span style={S.navLabel}>{label}</span>
            {active && <div style={S.navActiveLine} />}
        </button>
    );
}

// ── Main Feed ────────────────────────────────────────────────────────────────
export default function CommunityFeed() {
    const navigate  = useNavigate();
    const [games,   setGames]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [user,    setUser]    = useState(null);
    const [filter,  setFilter]  = useState("all"); // all | open | full | cancelled

    useEffect(() => {
        const stored = localStorage.getItem("community_user");
        if (stored) setUser(JSON.parse(stored));
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const res  = await fetch(`${API}/games`);
            const data = await res.json();
            setGames(Array.isArray(data) ? data : []);
        } catch {
            setGames([]);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        const token = localStorage.getItem("community_token");
        if (token) fetch(`${API}/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        localStorage.removeItem("community_token");
        localStorage.removeItem("community_user");
        navigate("/community");
    };

    const filtered = filter === "all" ? games : games.filter(g => g.status === filter);
    const openCount = games.filter(g => g.status === "open").length;

    return (
        <div style={S.root}>
            <PageLoader />
            <DynamicBackground />

            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
                .grid-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .grid-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,201,255,0.15); }
                .filter-btn { transition: all 0.2s ease; }
                .filter-btn:hover { background: rgba(255,255,255,0.08) !important; }
            `}</style>

            {/* ── LEFT SIDEBAR ── */}
            <aside style={S.sidebar}>
                {/* Brand */}
                <div style={S.brand} onClick={() => navigate("/")}>
                    <div style={S.brandText}>THE GRID</div>
                    <div style={S.brandSub}>FOOTBALL COMMUNITY</div>
                </div>

                {/* Nav */}
                <nav style={S.sideNav}>
                    <NavItem icon="⊞" label="DASHBOARD"     active={true}  onClick={() => {}} />
                    <NavItem icon="📅" label="FIXTURES"      active={false} onClick={() => {}} />
                    <NavItem icon="📢" label="ANNOUNCEMENTS" active={false} onClick={() => navigate("/community/announcements")} />
                    <NavItem icon="👥" label="COMMUNITY"     active={false} onClick={() => {}} />
                    {user?.role === "admin" && (
                        <NavItem icon="+" label="POST GAME" active={false} onClick={() => navigate("/community/admin/create-game")} />
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
                {/* Top bar */}
                <div style={S.topBar}>
                    <div>
                        <div style={S.topBarTitle}>THE GRID // DASHBOARD</div>
                    </div>
                    <div style={S.topBarRight}>
                        <div style={S.statChip}>
                            <span style={S.statChipNum}>{openCount}</span>
                            <span style={S.statChipLabel}>OPEN GAMES</span>
                        </div>
                        <div style={S.statChip}>
                            <span style={S.statChipNum}>{games.length}</span>
                            <span style={S.statChipLabel}>TOTAL</span>
                        </div>
                    </div>
                </div>

                {/* Section header + filters */}
                <div style={S.sectionHeader}>
                    <span style={S.sectionTitle}>UPCOMING MATCHES</span>
                    <div style={S.filterRow}>
                        {["all", "open", "full", "cancelled"].map(f => (
                            <button
                                key={f}
                                className="filter-btn"
                                onClick={() => setFilter(f)}
                                style={{
                                    ...S.filterBtn,
                                    ...(filter === f ? S.filterBtnActive : {}),
                                }}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Game grid */}
                {loading ? (
                    <div style={S.emptyState}>
                        <div style={S.emptyIcon}>⏳</div>
                        <div style={S.emptyText}>LOADING MATCHES...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={S.emptyState}>
                        <div style={S.emptyIcon}>⚽</div>
                        <div style={S.emptyText}>NO MATCHES FOUND</div>
                        <div style={S.emptySubText}>Check back soon — a Community Admin will post the next game.</div>
                    </div>
                ) : (
                    <div style={S.grid}>
                        {filtered.map(game => (
                            <GameCard
                                key={game.id}
                                game={game}
                                onClick={() => navigate(`/community/games/${game.id}`)}
                            />
                        ))}
                    </div>
                )}
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
        background: "linear-gradient(180deg, #00ff87, #00c9ff)",
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
        background: "linear-gradient(135deg, #00ff87, #00c9ff)",
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
        border: "1px solid rgba(0,255,135,0.3)",
        background: "rgba(0,255,135,0.05)",
        color: "#00ff87",
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
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "28px 0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: 28,
    },
    topBarTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 20,
        letterSpacing: 3,
        color: "rgba(255,255,255,0.6)",
    },
    topBarRight: {
        display: "flex",
        gap: 12,
        alignItems: "center",
    },
    statChip: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
    },
    statChipNum: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24,
        color: "#00ff87",
        lineHeight: 1,
    },
    statChipLabel: {
        fontSize: 9,
        letterSpacing: 1.2,
        color: "rgba(255,255,255,0.35)",
        marginTop: 2,
    },
    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.7)",
    },
    filterRow: {
        display: "flex",
        gap: 6,
    },
    filterBtn: {
        padding: "4px 10px",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "transparent",
        color: "rgba(255,255,255,0.35)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.8,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    filterBtnActive: {
        background: "rgba(0,255,135,0.1)",
        border: "1px solid rgba(0,255,135,0.3)",
        color: "#00ff87",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
    },
    emptyState: {
        textAlign: "center",
        padding: "80px 24px",
        color: "rgba(255,255,255,0.3)",
    },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 14, fontWeight: 800, letterSpacing: 2, marginBottom: 8 },
    emptySubText: { fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 },

    /* CARD */
    card: {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
        display: "flex",
    },
    cardAccent: {
        width: 3,
        background: "linear-gradient(180deg, #00ff87, #00c9ff)",
        flexShrink: 0,
    },
    cardInner: {
        flex: 1,
        padding: "16px 16px 16px 14px",
        display: "flex",
        flexDirection: "column",
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 0.3,
        color: "#fff",
        lineHeight: 1.3,
    },
    datePill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 4,
        padding: "4px 8px",
        marginBottom: 10,
        width: "fit-content",
    },
    datePillDay: { fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: "#00c9ff" },
    datePillTime: { fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)" },
    vsRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "8px 0",
    },
    teamSide: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    teamLabel: {
        fontSize: 12,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: 0.3,
    },
    teamCount: {
        fontSize: 10,
        color: "rgba(255,255,255,0.3)",
        fontWeight: 600,
        marginTop: 1,
    },
    vsChip: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 14,
        color: "#00ff87",
        flexShrink: 0,
        padding: "2px 6px",
        border: "1px solid rgba(0,255,135,0.2)",
        borderRadius: 4,
        letterSpacing: 1,
    },
    joinBtn: {
        marginTop: 14,
        padding: "9px",
        borderRadius: 6,
        border: "none",
        background: "linear-gradient(135deg, #00ff87, #00c9ff)",
        color: "#080810",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1.5,
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
    },
    joinBtnDisabled: {
        background: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.25)",
        cursor: "default",
    },
};
