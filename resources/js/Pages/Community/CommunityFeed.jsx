import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";
import TeamLogo from "../../Components/TeamLogo";

const API = "/api/community";

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        open: { label: "OPEN", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
        full: { label: "FULL", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
        cancelled: { label: "CANCELLED", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        completed: { label: "DONE", color: "#6b7280", bg: "rgba(107,114,128,0.05)" },
    };
    const s = map[status] || map.open;
    return (
        <span style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800,
            letterSpacing: 0.5, background: s.bg, color: s.color,
            border: `1px solid ${s.color}33`,
            fontFamily: "'Inter', sans-serif",
            textTransform: "uppercase"
        }}>
            {s.label}
        </span>
    );
}

// ── Match Card (Redesigned based on reference) ────────────────────────────────────────────────────
function MatchCard({ game, onClick }) {
    const totalA = game.team_a_count ?? 0;
    const totalB = game.team_b_count ?? 0;
    const filled = totalA + totalB;
    const max = game.max_slots_per_team * 2;
    const remaining = max - filled;
    
    const date = new Date(game.game_date);
    const timeStr = date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
    const isToday = new Date().toDateString() === date.toDateString();
    const dateLabel = isToday ? "Today" : date.toLocaleDateString("en-MY", { day: 'numeric', month: 'short' });

    return (
        <div style={S.card} onClick={onClick} className="match-card">
            <div style={S.cardHeader}>
                <div style={S.gameTitle}>
                    {game.title}
                </div>
                <div style={S.matchupRow}>
                    <div style={S.teamPair}>
                        <TeamLogo name={game.team_a_name} size={28} />
                        <span style={S.vsText}>vs.</span>
                        <TeamLogo name={game.team_b_name} size={28} />
                    </div>
                    <div style={S.matchNames}>
                        {game.team_a_name} vs. {game.team_b_name}
                    </div>
                </div>
            </div>

            <div style={S.cardBody}>
                <div style={S.venueRow}>
                    <span style={S.venueText}>📍 {game.venue}</span>
                </div>
                <div style={S.infoRow}>
                    <span style={S.kickoffLabel}>Kick-off: {timeStr} {dateLabel}</span>
                    <div style={S.slotBadge}>
                        {remaining > 0 ? `${remaining}/${max} SLOTS AVAILABLE` : "GAME FULL"}
                    </div>
                </div>
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

    return (
        <div style={S.container}>
            <style>{`
                .match-card { transition: all 0.2s ease; cursor: pointer; }
                .match-card:hover { transform: translateY(-4px); background: rgba(60, 62, 68, 0.9) !important; border-color: rgba(16,185,129,0.5) !important; }
            `}</style>

            <header style={S.header}>
                <h1 style={S.title}>Dashboard</h1>
                <div style={S.profileIcon}>
                    {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
            </header>

            <section>
                <h2 style={S.sectionTitle}>ACTIVE MATCHES</h2>
                {loading ? (
                    <div style={S.emptyState}>LOADING...</div>
                ) : games.length === 0 ? (
                    <div style={S.emptyState}>NO UPCOMING MATCHES FOUND</div>
                ) : (
                    <div style={S.grid}>
                        {games.map(game => (
                            <MatchCard
                                key={game.id}
                                game={game}
                                onClick={() => navigate(`/community/games/${game.id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
    container: {
        maxWidth: 1200,
        margin: "0 auto",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: -0.5,
    },
    profileIcon: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.1)",
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 800,
        color: "rgba(255,255,255,0.5)",
        letterSpacing: 1,
        marginBottom: 24,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: 20,
    },
    card: {
        background: "rgba(42, 43, 46, 0.7)", 
        backdropFilter: "blur(12px)", 
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
    },
    cardHeader: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    gameTitle: {
        fontSize: 18,
        fontWeight: 800,
        color: "#10b981", // Brand green
        letterSpacing: -0.5,
    },
    matchupRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
    },
    teamPair: {
        display: "flex",
        alignItems: "center",
        gap: 4,
    },
    vsText: {
        fontSize: 10,
        fontWeight: 800,
        color: "rgba(255,255,255,0.2)",
    },
    matchNames: {
        fontSize: 14,
        fontWeight: 600,
        color: "rgba(255,255,255,0.7)",
        letterSpacing: -0.2,
    },
    cardBody: {
        marginTop: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    venueRow: {
        display: "flex",
        alignItems: "center",
    },
    venueText: {
        fontSize: 12,
        color: "rgba(255,255,255,0.4)",
        fontWeight: 500,
    },
    infoRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    kickoffLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.5)",
        fontWeight: 600,
    },
    slotBadge: {
        padding: "6px 14px",
        borderRadius: 20,
        background: "rgba(16,185,129,0.15)",
        color: "#10b981",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.5,
        border: "1px solid rgba(16,185,129,0.2)",
    },
    emptyState: {
        padding: "80px 0",
        textAlign: "center",
        color: "rgba(255,255,255,0.3)",
        fontWeight: 700,
        letterSpacing: 1,
        fontSize: 14,
    }
};
