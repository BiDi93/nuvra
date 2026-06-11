import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api/community";
const BRAND_BLUE = "#00D4EC";

function StatusBadge({ status }) {
    const map = {
        open: { label: "OPEN", color: BRAND_BLUE, bg: "rgba(0,212,236,0.1)" },
        full: { label: "FULL", color: "#6b7280", bg: "rgba(107,114,128,0.05)" },
        cancelled: { label: "CANCELLED", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        completed: { label: "COMPLETED", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    };
    const s = map[status] || map.open;
    return (
        <span style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 900,
            letterSpacing: 0.5, background: s.bg, color: s.color,
            border: `1px solid ${s.color}33`, textTransform: "uppercase",
        }}>
            {s.label}
        </span>
    );
}

function MatchCard({ game, onClick }) {
    const filled = game.filled_slots ?? 0;
    const max = game.total_slots ?? 22;
    const remaining = max - filled;
    const progress = (filled / max) * 100;
    const maxPerTeam = Math.ceil(max / 2);
    const teamASlots = Math.ceil(filled / 2);
    const teamBSlots = Math.floor(filled / 2);

    return (
        <div style={S.card} onClick={onClick} className="pub-card">
            <div style={S.cardHeader}>
                <div style={S.gameTitle}>{game.title}</div>
                <StatusBadge status={game.status || "open"} />
            </div>

            <div style={S.matchDisplay}>
                <div style={S.teamCircle}><div style={S.shieldA}>A</div></div>
                <div style={S.scoreArea}>VS</div>
                <div style={S.teamCircle}><div style={S.shieldB}>B</div></div>
            </div>

            <div style={S.teamLabels}>
                <span style={S.teamLabel}>TEAM A ({teamASlots}/{maxPerTeam})</span>
                <span style={S.teamLabel}>TEAM B ({teamBSlots}/{maxPerTeam})</span>
            </div>

            <div style={S.progressWrapper}>
                <div style={{ ...S.progressBar, width: `${progress}%` }} />
            </div>

            <div style={S.slotsLeft}>SLOTS: {remaining}/{max} left</div>

            <button style={S.viewBtn}>VIEW & JOIN →</button>
        </div>
    );
}

export default function PublicGames() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        fetch(`${API}/games`)
            .then(r => r.json())
            .then(d => setGames(Array.isArray(d) ? d : []))
            .catch(() => setGames([]))
            .finally(() => setLoading(false));
    }, []);

    const handleGameClick = (gameId) => {
        const token = localStorage.getItem("community_token");
        if (!token) {
            navigate("/community");
        } else {
            navigate(`/community/games/${gameId}`);
        }
    };

    const filtered = games.filter(g => {
        if (filter === "ALL") return true;
        const gDate = new Date(g.game_date);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (filter === "UPCOMING") return gDate >= today;
        if (filter === "PAST") return gDate < today;
        return true;
    });

    return (
        <div style={S.root}>
            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 2px; }
                .pub-card { transition: transform 0.2s, border-color 0.2s; cursor: pointer; }
                .pub-card:hover { transform: translateY(-4px); border-color: ${BRAND_BLUE}88 !important; }
                .pub-tab-btn { transition: color 0.2s; background: none; border: none; cursor: pointer; }
                .signin-btn:hover { background: #33DDFF !important; transform: translateY(-1px); }
                @media (max-width: 640px) {
                    .pub-grid    { grid-template-columns: 1fr !important; }
                    .pub-filters { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
                }
            `}</style>

            {/* ── Top Nav ── */}
            <nav style={{ ...S.nav, ...(scrolled ? S.navScrolled : {}) }}>
                <div style={S.navLeft} onClick={() => navigate("/")}>
                    <img src="/images/logoImage/NUVRA_LOGO.webp" alt="Nuvra" style={{ height: 36 }} />

                </div>
                <button
                    className="signin-btn"
                    style={S.signInBtn}
                    onClick={() => {
                        const token = localStorage.getItem("community_token");
                        navigate(token ? "/community/feed" : "/community");
                    }}
                >
                    {localStorage.getItem("community_token") ? "Go to Dashboard" : "Sign In"}
                </button>
            </nav>

            {/* ── Main content ── */}
            <main style={S.main}>
                <header style={S.pageHeader}>
                    <div>
                        <h1 style={S.pageTitle}>GAMES</h1>
                        <p style={S.pageSubtitle}>Browse open matches and book your slot</p>
                    </div>
                    <div style={S.statRow}>
                        <div style={S.statBadgeBlue}>
                            OPEN: {games.filter(g => g.status === "open").length}
                        </div>
                        <div style={S.statBadgeWhite}>
                            TOTAL: {games.length}
                        </div>
                    </div>
                </header>

                <div style={S.filterBar} className="pub-filters">
                    <span style={S.filterLabel}>MATCHES</span>
                    <div style={{ display: "flex", gap: 24 }}>
                        {["ALL", "UPCOMING", "PAST"].map(t => (
                            <button
                                key={t}
                                className="pub-tab-btn"
                                style={{ ...S.tabBtn, ...(filter === t ? S.tabBtnActive : {}) }}
                                onClick={() => setFilter(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={S.empty}>LOADING GAMES...</div>
                ) : filtered.length === 0 ? (
                    <div style={S.empty}>NO MATCHES FOUND</div>
                ) : (
                    <div style={S.grid} className="pub-grid">
                        {filtered.map(game => (
                            <MatchCard
                                key={game.id}
                                game={game}
                                onClick={() => handleGameClick(game.id)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

const S = {
    root: { background: "#0d0d10", minHeight: "100vh", color: "#F5F5F7", fontFamily: "'Inter', sans-serif" },

    nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", transition: "all 0.25s" },
    navScrolled: { background: "rgba(13,13,16,0.96)", borderBottom: "1px solid #222228", padding: "12px 48px" },
    navLeft: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
    navBrand: { fontSize: 18, fontWeight: 800, letterSpacing: 2 },
    signInBtn: { padding: "8px 20px", background: BRAND_BLUE, color: "#0d0d10", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" },

    main: { maxWidth: 1200, margin: "0 auto", padding: "110px 24px 60px" },

    pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 16 },
    pageTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 52, fontWeight: 900, letterSpacing: 1 },
    pageSubtitle: { color: "#72727e", fontSize: 14, marginTop: 4 },
    statRow: { display: "flex", gap: 12 },
    statBadgeBlue: { background: BRAND_BLUE, padding: "10px 18px", borderRadius: 10, color: "#000", fontSize: 13, fontWeight: 800 },
    statBadgeWhite: { background: "#fff", padding: "10px 18px", borderRadius: 10, color: "#000", fontSize: 13, fontWeight: 800 },

    filterBar: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16, marginBottom: 32 },
    filterLabel: { fontSize: 18, fontWeight: 800 },
    tabBtn: { fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.4)", padding: "4px 0" },
    tabBtnActive: { color: BRAND_BLUE, borderBottom: `2px solid ${BRAND_BLUE}` },

    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 },
    empty: { padding: "100px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 16, fontWeight: 800 },

    card: { background: "linear-gradient(145deg, #2a2d34, #1e2025)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", padding: 24, display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
    gameTitle: { fontSize: 20, fontWeight: 800, color: "#fff", maxWidth: "70%", lineHeight: 1.3 },

    matchDisplay: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 28 },
    teamCircle: { width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 },
    shieldA: { width: "100%", height: "100%", borderRadius: 12, border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff" },
    shieldB: { width: "100%", height: "100%", borderRadius: 12, border: `2px solid ${BRAND_BLUE}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: BRAND_BLUE },
    scoreArea: { fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.8)", letterSpacing: 2 },

    teamLabels: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
    teamLabel: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" },
    progressWrapper: { height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 10 },
    progressBar: { height: "100%", background: BRAND_BLUE, borderRadius: 4 },
    slotsLeft: { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 20 },
    viewBtn: { width: "100%", padding: 16, borderRadius: 12, border: "none", background: BRAND_BLUE, color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer" },
};
