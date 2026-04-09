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
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8, color: "rgba(255,255,255,0.4)" }}>
                <span style={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>SLOTS</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                    {isFull ? "FULL" : `${remaining}/${max} left`}
                </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, #00D4EC, #D040EF)`, borderRadius: 3, transition: "width 0.6s ease" }} />
            </div>
        </div>
    );
}

// ── Team Logo ─────────────────────────────────────────────────────────────
function TeamLogo({ name, color, size = 36 }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: `linear-gradient(135deg, ${color}, #222)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.45, fontWeight: 900, color: "#fff",
            fontFamily: "'Inter', sans-serif",
            border: "2px solid rgba(255,255,255,0.1)",
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
    const timeStr = date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
    const isOpen = game.status === "open";

    return (
        <div style={S.card} onClick={onClick} className="grid-card">
            <div style={S.cardInner}>
                <div style={S.cardTitle}>{game.title}</div>
                
                <div style={S.matchupRow}>
                    <div style={S.teamSide}>
                        <TeamLogo name={game.team_a_name} color="#00D4EC" />
                        <div style={S.teamName}>{game.team_a_name}</div>
                    </div>
                    <div style={S.vsBlock}>
                        <div style={S.vsText}>VS</div>
                        <div style={S.gameTime}>{timeStr}</div>
                    </div>
                    <div style={{ ...S.teamSide, alignItems: "flex-end" }}>
                        <TeamLogo name={game.team_b_name} color="#D040EF" />
                        <div style={S.teamName}>{game.team_b_name}</div>
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

// ── Main Feed ────────────────────────────────────────────────────────────────
export default function CommunityFeed() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState("all");

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

    const filtered = filter === "all" ? games : games.filter(g => g.status === filter);
    const openCount = games.filter(g => g.status === "open").length;

    return (
        <>
            <style>{`
                .grid-card { transition: transform 0.2s ease; cursor: pointer; }
                .grid-card:hover { transform: translateY(-4px); }
                .filter-btn { transition: all 0.2s ease; }
            `}</style>

            {/* ── TOP BAR ── */}
            <div style={S.topBar}>
                <div style={S.topBarTitle}>THE GRID // DASHBOARD</div>
                <div style={S.topBarRight}>
                    <div style={S.statChip}>
                        <span style={S.statChipText}>{openCount} OPEN GAMES</span>
                    </div>
                    <div style={S.statChip}>
                        <span style={S.statChipText}>{games.length} TOTAL</span>
                    </div>
                </div>
            </div>

            {/* Section header + filters */}
            <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>UPCOMING MATCHES</span>
            </div>

            {/* Game grid */}
            {loading ? (
                <div style={S.emptyState}>
                    <div style={S.emptyText}>LOADING MATCHES...</div>
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
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 24,
        marginBottom: 32,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    topBarTitle: {
        fontSize: 22,
        fontWeight: 800,
        color: "rgba(255,255,255,0.7)",
        letterSpacing: 1,
    },
    topBarRight: {
        display: "flex",
        gap: 12,
    },
    statChip: {
        padding: "8px 16px",
        background: "#333",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.1)",
    },
    statChipText: {
        fontSize: 12,
        fontWeight: 700,
        color: "rgba(255,255,255,0.8)",
        letterSpacing: 1,
    },
    sectionHeader: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: "rgba(255,255,255,0.9)",
        letterSpacing: 1,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 24,
    },
    card: {
        background: "#2a2a2a",
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.05)",
    },
    cardInner: {
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: "#fff",
    },
    matchupRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    teamSide: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        flex: 1,
    },
    vsBlock: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
    },
    vsText: {
        fontSize: 13,
        fontWeight: 900,
        color: "rgba(255,255,255,0.25)",
        letterSpacing: 1,
    },
    teamName: {
        fontSize: 13,
        fontWeight: 700,
        color: "#fff",
    },
    gameTime: {
        fontSize: 11,
        color: "rgba(255,255,255,0.4)",
    },
    joinBtn: {
        padding: "14px",
        borderRadius: 20,
        border: "none",
        background: "linear-gradient(90deg, #A78BFA, #60A5FA)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 1,
        cursor: "pointer",
        width: "100%",
    },
    joinBtnDisabled: {
        background: "#444",
        color: "rgba(255,255,255,0.3)",
    },
    emptyState: {
        textAlign: "center",
        padding: "80px 24px",
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 700,
        color: "rgba(255,255,255,0.3)",
        letterSpacing: 1,
    },
};

