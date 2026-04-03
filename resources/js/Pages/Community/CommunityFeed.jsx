import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api/community";

// ── Slot Bar ────────────────────────────────────────────────────────────────
function SlotBar({ filled, max, label }) {
    const pct = Math.min((filled / max) * 100, 100);
    const remaining = max - filled;
    const isLow = remaining <= 5;
    const isFull = remaining <= 0;
    const color = isFull ? "#ff4444" : isLow ? "#ff6b35" : "#00ff87";
    return (
        <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5, color: "rgba(255,255,255,0.45)" }}>
                <span>{label}</span>
                <span style={{ color, fontWeight: 700 }}>
                    {isFull ? "FULL" : `${remaining}/${max} slots left`}
                </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${isFull ? "#ff4444" : isLow ? "#ffa500" : "#00c9ff"})`, borderRadius: 4, transition: "width 0.6s ease" }} />
            </div>
        </div>
    );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        open:      { label: "Open",      bg: "rgba(0,255,135,0.1)",  color: "#00ff87" },
        full:      { label: "Full",      bg: "rgba(255,68,68,0.1)",  color: "#ff4444" },
        cancelled: { label: "Cancelled", bg: "rgba(255,107,53,0.1)", color: "#ff6b35" },
        completed: { label: "Done",      bg: "rgba(255,255,255,0.05)", color: "#aaa" },
    };
    const s = map[status] || map.open;
    return (
        <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
            {s.label}
        </span>
    );
}

// ── Game Card ─────────────────────────────────────────────────────────────────
function GameCard({ game, onClick }) {
    const totalA = game.team_a_count ?? 0;
    const totalB = game.team_b_count ?? 0;
    const max = game.max_slots_per_team;
    const date = new Date(game.game_date);
    const dateStr = date.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
    const timeStr = date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });

    return (
        <div style={styles.card} onClick={onClick}>
            <div style={styles.cardTop}>
                <div>
                    <div style={styles.cardTitle}>{game.title}</div>
                    <div style={styles.cardMeta}>
                        <span>📍 {game.venue}</span>
                        <span>📅 {dateStr}</span>
                        <span>⏰ {timeStr}</span>
                    </div>
                </div>
                <StatusBadge status={game.status} />
            </div>

            <div style={styles.vsRow}>
                <div style={styles.teamPill}>
                    <span style={styles.teamName}>{game.team_a_name}</span>
                    <span style={styles.teamCount}>{totalA}/{max}</span>
                </div>
                <span style={styles.vsText}>VS</span>
                <div style={styles.teamPill}>
                    <span style={styles.teamName}>{game.team_b_name}</span>
                    <span style={styles.teamCount}>{totalB}/{max}</span>
                </div>
            </div>

            <SlotBar filled={totalA + totalB} max={max * 2} label="Total Slots" />

            {game.description && (
                <p style={styles.cardDesc}>{game.description}</p>
            )}

            <button style={{ ...styles.joinBtn, ...(game.status !== "open" ? styles.joinBtnDisabled : {}) }}>
                {game.status === "open" ? "View & Join →" : game.status === "full" ? "Game Full" : "Cancelled"}
            </button>
        </div>
    );
}

// ── Main Feed ─────────────────────────────────────────────────────────────────
export default function CommunityFeed() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem("community_user");
        if (stored) setUser(JSON.parse(stored));
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const res = await fetch(`${API}/games`);
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

    return (
        <div style={styles.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #080810; }
                ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
            `}</style>

            {/* BG */}
            <div style={styles.bgGlow} />

            {/* Nav */}
            <nav style={styles.nav}>
                <div style={styles.navLeft}>
                    <span style={styles.navLogo} onClick={() => navigate("/")}>NUVRA</span>
                    <span style={styles.navSep}>/</span>
                    <span style={styles.navPage}>Community</span>
                </div>
                <div style={styles.navRight}>
                    {user?.role === "admin" && (
                        <button style={styles.adminBtn} onClick={() => navigate("/community/admin/create-game")}>
                            + Post Game
                        </button>
                    )}
                    <button style={styles.announcementBtn} onClick={() => navigate("/community/announcements")}>
                        📢 Announcements
                    </button>
                    {user ? (
                        <div style={styles.userPill}>
                            <span style={styles.userAvatar}>{user.name?.[0]?.toUpperCase()}</span>
                            <span style={styles.userName}>{user.name}</span>
                            <button style={styles.logoutBtn} onClick={logout}>Out</button>
                        </div>
                    ) : (
                        <button style={styles.loginBtn} onClick={() => navigate("/community")}>Sign In</button>
                    )}
                </div>
            </nav>

            {/* Content */}
            <div style={styles.content}>
                <div style={styles.pageHeader}>
                    <div>
                        <h1 style={styles.pageTitle}>Upcoming Games</h1>
                        <p style={styles.pageSubtitle}>Pick a game, pick a side, show up and play.</p>
                    </div>
                    <div style={styles.gamesCount}>
                        <span style={styles.gamesCountNum}>{games.filter(g => g.status === "open").length}</span>
                        <span style={styles.gamesCountLabel}>Open</span>
                    </div>
                </div>

                {loading ? (
                    <div style={styles.empty}>Loading games...</div>
                ) : games.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Games Yet</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                            Check back soon — a Community Admin will post the next game!
                        </div>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {games.map(game => (
                            <GameCard key={game.id} game={game} onClick={() => navigate(`/community/games/${game.id}`)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    root: { fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#080810", color: "#fff" },
    bgGlow: {
        position: "fixed", top: 0, left: 0, right: 0, height: "50vh", zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,135,0.07) 0%, transparent 70%)",
    },
    nav: {
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        background: "rgba(8,8,16,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    navLeft: { display: "flex", alignItems: "center", gap: 10 },
    navLogo: { fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 2, cursor: "pointer", color: "#fff" },
    navSep: { color: "rgba(255,255,255,0.2)", fontSize: 18 },
    navPage: { fontSize: 14, fontWeight: 600, color: "#00ff87" },
    navRight: { display: "flex", alignItems: "center", gap: 12 },
    adminBtn: {
        padding: "6px 14px", borderRadius: 8, border: "none",
        background: "linear-gradient(135deg, #00ff87, #00c9ff)",
        color: "#080810", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    },
    announcementBtn: {
        padding: "6px 14px", borderRadius: 8,
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    },
    loginBtn: {
        padding: "6px 16px", borderRadius: 8,
        background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.3)",
        color: "#00ff87", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    },
    userPill: { display: "flex", alignItems: "center", gap: 8 },
    userAvatar: {
        width: 30, height: 30, borderRadius: "50%",
        background: "linear-gradient(135deg, #00ff87, #00c9ff)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#080810", fontSize: 12, fontWeight: 800,
    },
    userName: { fontSize: 13, fontWeight: 600 },
    logoutBtn: {
        padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
        background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
    },
    content: { position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" },
    pageHeader: {
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36,
    },
    pageTitle: { fontSize: 32, fontWeight: 800, lineHeight: 1 },
    pageSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 },
    gamesCount: {
        display: "flex", flexDirection: "column", alignItems: "center",
        background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)",
        borderRadius: 14, padding: "12px 20px",
    },
    gamesCountNum: { fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: "#00ff87", lineHeight: 1 },
    gamesCountLabel: { fontSize: 10, fontWeight: 700, color: "rgba(0,255,135,0.6)", textTransform: "uppercase", letterSpacing: 1 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 },
    empty: {
        textAlign: "center", padding: "80px 24px",
        color: "rgba(255,255,255,0.4)", fontSize: 16,
    },

    // Card styles
    card: {
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: 24, cursor: "pointer",
        transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
        display: "flex", flexDirection: "column", gap: 0,
    },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
    cardTitle: { fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 },
    cardMeta: { display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: "rgba(255,255,255,0.4)" },
    vsRow: { display: "flex", alignItems: "center", gap: 12, margin: "12px 0" },
    teamPill: {
        flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    teamName: { fontSize: 13, fontWeight: 700 },
    teamCount: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 },
    vsText: { fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: "#00ff87", flexShrink: 0 },
    cardDesc: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 12, lineHeight: 1.5 },
    joinBtn: {
        marginTop: 16, padding: "10px", borderRadius: 10, border: "none",
        background: "linear-gradient(135deg, #00ff87, #00c9ff)",
        color: "#080810", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        width: "100%",
    },
    joinBtnDisabled: {
        background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", cursor: "default",
    },
};
