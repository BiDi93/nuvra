import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        open: { label: "OPEN", color: "#00D4EC", bg: "rgba(0,212,236,0.1)" },
        full: { label: "FULL", color: "#ff4444", bg: "rgba(255,68,68,0.1)" },
        cancelled: { label: "CANCELLED", color: "#ff6b35", bg: "rgba(255,107,53,0.1)" },
        completed: { label: "DONE", color: "#888", bg: "rgba(255,255,255,0.05)" },
    };
    const s = map[status] || map.open;
    return (
        <span style={{
            padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 800,
            letterSpacing: 0.8, background: s.bg, color: s.color,
            border: `1px solid ${s.color}33`,
            fontFamily: "'Inter', sans-serif",
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
    const isLow = remaining <= 5 && !isFull;
    const color = isFull ? "#ff4444" : isLow ? "#ff6b35" : "#00D4EC";
    return (
        <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, color: "rgba(255,255,255,0.4)" }}>
                <span style={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>SLOTS</span>
                <span style={{ color, fontWeight: 700 }}>
                    {isFull ? "FULL" : `${remaining}/${max} left`}
                </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${isFull ? "#ff4444" : "#00D4EC"})`, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
        </div>
    );
}

// ── Team Logo ─────────────────────────────────────────────────────────────
function TeamLogo({ name, color }) {
    return (
        <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${color}, #080a12)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "#fff",
            fontFamily: "'Inter', sans-serif",
            border: `1px solid ${color}44`,
            flexShrink: 0
        }}>
            {name?.[0]?.toUpperCase() || "T"}
        </div>
    );
}

// ── Game Card (Grid style) ────────────────────────────────────────────────────
function GameCard({ game, onClick, isAdmin }) {
    const totalA = game.team_a_count ?? 0;
    const totalB = game.team_b_count ?? 0;
    const filled = totalA + totalB;
    const max = game.max_slots_per_team * 2;
    const date = new Date(game.game_date);
    const dayStr = date.toLocaleDateString("en-MY", { weekday: "short" }).toUpperCase();
    const dateNum = date.getDate();
    const timeStr = date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
    const isOpen = game.status === "open";

    return (
        <div style={S.card} onClick={onClick} className="grid-card">
            {/* Gradient border glow on left */}
            <div style={S.cardAccent} />

            <div style={S.cardInner}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                        <div style={S.cardTitle}>{game.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
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
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <TeamLogo name={game.team_a_name} color="#00D4EC" />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={S.teamLabel}>{game.team_a_name}</span>
                                <span style={S.teamCount}>{totalA}/{game.max_slots_per_team}</span>
                            </div>
                        </div>
                    </div>
                    <div style={S.vsChip}>VS</div>
                    <div style={{ ...S.teamSide, textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={S.teamLabel}>{game.team_b_name}</span>
                                <span style={S.teamCount}>{totalB}/{game.max_slots_per_team}</span>
                            </div>
                            <TeamLogo name={game.team_b_name} color="#D040EF" />
                        </div>
                    </div>
                </div>

                <SlotBar filled={filled} max={max} />

                <button
                    style={{ ...S.joinBtn, ...(isOpen ? {} : S.joinBtnDisabled) }}
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                >
                    {isAdmin ? "VIEW →" : isOpen ? "VIEW & JOIN →" : game.status === "full" ? "GAME FULL" : game.status.toUpperCase()}
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
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState("all"); // all | open | full | cancelled

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

    const filtered = filter === "all" ? games : games.filter(g => g.status === filter);
    const openCount = games.filter(g => g.status === "open").length;

    return (
        <>
            <style>{`
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
                .grid-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .grid-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,201,255,0.15); }
                .filter-btn { transition: all 0.2s ease; }
                .filter-btn:hover { background: rgba(255,255,255,0.08) !important; }
            `}</style>

            {/* ── TOP BAR ── */}
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
                            isAdmin={user?.role === "admin"}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
    /* TOP BAR */
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "28px 0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: 28,
    },
    topBarTitle: {
        fontFamily: "'Inter', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 1.5,
        color: "rgba(255,255,255,0.7)",
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
        fontFamily: "'Inter', sans-serif",
        fontSize: 24,
        fontWeight: 800,
        color: "#00D4EC",
        lineHeight: 1,
    },
    statChipLabel: {
        fontSize: 9,
        fontWeight: 700,
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
        fontSize: 14,
        fontWeight: 900,
        letterSpacing: 1.5,
        color: "rgba(255,255,255,0.8)",
        fontFamily: "'Inter', sans-serif",
    },
    filterRow: {
        display: "flex",
        gap: 6,
    },
    filterBtn: {
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "transparent",
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
    },
    filterBtnActive: {
        background: "rgba(0,212,236,0.12)",
        border: "1px solid rgba(0,212,236,0.4)",
        color: "#00D4EC",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
        gap: 20,
    },
    emptyState: {
        textAlign: "center",
        padding: "80px 24px",
        color: "rgba(255,255,255,0.3)",
    },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 16, fontWeight: 800, letterSpacing: 1.5, marginBottom: 8 },
    emptySubText: { fontSize: 14, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 },

    /* CARD */
    card: {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    },
    cardAccent: {
        width: 4,
        background: "linear-gradient(180deg, #00D4EC, #D040EF)",
        flexShrink: 0,
    },
    cardInner: {
        flex: 1,
        padding: "20px 20px 20px 18px",
        display: "flex",
        flexDirection: "column",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 800,
        color: "#fff",
        lineHeight: 1.3,
        fontFamily: "'Inter', sans-serif",
    },
    datePill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(255,255,255,0.07)",
        borderRadius: 6,
        padding: "6px 12px",
        marginBottom: 14,
        width: "fit-content",
    },
    datePillDay: { fontSize: 11, fontWeight: 800, color: "#00D4EC", fontFamily: "'Inter', sans-serif" },
    datePillTime: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif" },
    vsRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "12px 0",
    },
    teamSide: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    teamLabel: {
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: 0.3,
        textTransform: "uppercase",
        lineHeight: 1.1,
    },
    teamCount: {
        fontSize: 11,
        color: "rgba(255,255,255,0.4)",
        fontWeight: 600,
        marginTop: 2,
    },
    vsChip: {
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        fontWeight: 900,
        color: "#00D4EC",
        flexShrink: 0,
        padding: "3px 8px",
        background: "rgba(0,212,236,0.05)",
        border: "1px solid rgba(0,212,236,0.2)",
        borderRadius: 6,
    },
    joinBtn: {
        marginTop: 18,
        padding: "12px",
        borderRadius: 8,
        border: "none",
        background: "linear-gradient(135deg, #00D4EC, #D040EF)",
        color: "#080810",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 1,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        width: "100%",
        transition: "all 0.2s ease",
    },
    joinBtnDisabled: {
        background: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.25)",
        cursor: "default",
    },
};

