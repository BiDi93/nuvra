import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";
const LIME = "#C1FF00";

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        open: { label: "OPEN", color: LIME, bg: "rgba(193, 255, 0, 0.1)" },
        live: { label: "LIVE", color: "#FF3B3B", bg: "rgba(255, 59, 59, 0.1)" },
        full: { label: "FULL", color: "#6b7280", bg: "rgba(107,114,128,0.05)" },
        cancelled: { label: "CANCELLED", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    };
    const s = map[status] || map.open;
    return (
        <span style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 900,
            letterSpacing: 0.5, background: s.bg, color: s.color,
            border: `1px solid ${s.color}33`,
            fontFamily: "'Inter', sans-serif",
            textTransform: "uppercase"
        }}>
            {s.label}
        </span>
    );
}

// ── Match Card ──────────────────────────────────────────────────────────────
function MatchCard({ game, onClick }) {
    const filled = game.filled_slots ?? 0;
    const max = game.total_slots ?? 22;
    const remaining = max - filled;
    const progress = (filled / max) * 100;
    
    // Split slots per team for display
    const teamASlots = Math.ceil(filled / 2);
    const teamBSlots = Math.floor(filled / 2);
    const maxPerTeam = Math.ceil(max / 2);

    return (
        <div style={S.card} onClick={onClick} className="match-card">
            <div style={S.cardHeader}>
                <div style={S.gameTitle}>{game.title}</div>
                <StatusBadge status={game.status || 'open'} />
            </div>

            <div style={S.matchDisplay}>
                <div style={S.teamCol}>
                    <div style={S.teamIcon}>A</div>
                </div>
                <div style={S.scoreArea}>
                    {game.status === 'live' ? "3 - 3" : "VS"}
                </div>
                <div style={S.teamCol}>
                    <div style={S.teamIcon}>B</div>
                </div>
            </div>

            <div style={S.teamLabels}>
                <div style={S.teamLabel}>TEAM A ({teamASlots}/{maxPerTeam})</div>
                <div style={S.teamLabel}>TEAM B ({teamBSlots}/{maxPerTeam})</div>
            </div>

            <div style={S.progressWrapper}>
                <div style={{ ...S.progressBar, width: `${progress}%` }} />
            </div>

            <div style={S.slotsLeft}>
                SLOTS: {remaining}/{max} left
            </div>

            <button style={S.viewBtn}>
                VIEW & JOIN →
            </button>
        </div>
    );
}

export default function CommunityFeed() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
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

    const filteredGames = games.filter(g => {
        if (filter === "ALL") return true;
        return g.status?.toUpperCase() === filter;
    });

    return (
        <div style={S.container}>
            <PageLoader />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&display=swap');
                .match-card { transition: all 0.2s ease; cursor: pointer; }
                .match-card:hover { transform: translateY(-4px); border-color: ${LIME}88 !important; }
                .filter-btn { transition: color 0.2s; }
            `}</style>

            <header style={S.header}>
                <h1 style={S.title}>DASHBOARD</h1>
                <div style={S.statsRow}>
                    <div style={S.statBadgeLime}>
                        <div style={S.statIcon}>⚽</div>
                        OPEN GAMES: {games.filter(g => g.status === 'open').length}
                    </div>
                    <div style={S.statBadgeWhite}>
                        <div style={S.statIconLime}>🎾</div>
                        TOTAL: {games.length}
                    </div>
                </div>
            </header>

            <div style={S.filterBar}>
                <div style={S.sectionLabel}>UPCOMING MATCHES</div>
                <div style={S.tabs}>
                    {["ALL", "OPEN", "LIVE", "FULL"].map(t => (
                        <button
                            key={t}
                            style={{ ...S.tabBtn, ...(filter === t ? S.tabBtnActive : {}) }}
                            onClick={() => setFilter(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={S.emptyState}>LOADING THE GRID...</div>
            ) : filteredGames.length === 0 ? (
                <div style={S.emptyState}>NO MATCHES FOUND IN THIS CATEGORY</div>
            ) : (
                <div style={S.grid}>
                    {filteredGames.map(game => (
                        <MatchCard
                            key={game.id}
                            game={game}
                            onClick={() => navigate(`/community/games/${game.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const S = {
    container: { maxWidth: 1200, margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 60 },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 48, fontWeight: 900, color: "#fff", letterSpacing: 1 },
    statsRow: { display: "flex", gap: 12 },
    statBadgeLime: { background: LIME, padding: "12px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, color: "#000", fontSize: 13, fontWeight: 800 },
    statBadgeWhite: { background: "#fff", padding: "12px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, color: "#000", fontSize: 13, fontWeight: 800 },
    statIcon: { fontSize: 16 },
    statIconLime: { fontSize: 16, color: LIME },

    filterBar: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16, marginBottom: 32 },
    sectionLabel: { fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: 0.5 },
    tabs: { display: "flex", gap: 24 },
    tabBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 800, cursor: "pointer", position: "relative", padding: "4px 0" },
    tabBtnActive: { color: LIME, borderBottom: `2px solid ${LIME}` },

    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 },
    card: { background: "rgba(30, 31, 35, 0.8)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", padding: 24, display: "flex", flexDirection: "column" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
    gameTitle: { fontSize: 20, fontWeight: 800, color: "#fff", maxWidth: "70%" },
    
    matchDisplay: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 24 },
    teamCol: { display: "flex", flexDirection: "column", alignItems: "center" },
    teamIcon: { width: 64, height: 64, borderRadius: 16, border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: LIME },
    scoreArea: { fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.8)", letterSpacing: 2 },

    teamLabels: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
    teamLabel: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" },
    progressWrapper: { height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 12 },
    progressBar: { height: "100%", background: LIME, borderRadius: 4 },
    slotsLeft: { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 20 },
    
    viewBtn: { width: "100%", padding: "16px", borderRadius: 12, border: "none", background: LIME, color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer", transition: "transform 0.1s" },

    emptyState: { padding: "100px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 16, fontWeight: 800 }
};
