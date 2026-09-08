import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";
const BRAND_CYAN = "#00D4EC";

function TournamentCard({ tournament, onClick }) {
    return (
        <div style={S.card} onClick={onClick} className="pub-tournament-card">
            <div style={S.cardHeader}>
                <span style={S.formatBadge}>{tournament.format?.toUpperCase() || "LEAGUE"}</span>
                <span style={S.seasonBadge}>{tournament.season || "SEASON 2026"}</span>
            </div>

            <h3 style={S.title}>{tournament.name}</h3>
            
            <div style={S.meta}>
                <div>📍 {tournament.venue || "Lokasi Rasmi"}</div>
                {tournament.organizer && <div>👑 {tournament.organizer.name}</div>}
            </div>

            <div style={S.statsBox}>
                <div style={S.statCol}>
                    <span style={S.statVal}>{tournament.teams_count || 0}</span>
                    <span style={S.statLbl}>PASUKAN</span>
                </div>
                <div style={S.statDivider} />
                <div style={S.statCol}>
                    <span style={S.statVal}>{tournament.matches_count || 0}</span>
                    <span style={S.statLbl}>PERLAWANAN</span>
                </div>
                <div style={S.statDivider} />
                <div style={S.statCol}>
                    <span style={{ ...S.statVal, color: BRAND_CYAN }}>AUTO</span>
                    <span style={S.statLbl}>STANDINGS</span>
                </div>
            </div>

            <button style={S.viewBtn}>
                LIHAT KEDUDUKAN & JADUAL →
            </button>
        </div>
    );
}

export default function PublicGames() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/tournaments`)
            .then(r => r.json())
            .then(d => setTournaments(Array.isArray(d) ? d : []))
            .catch(() => setTournaments([]))
            .finally(() => setLoading(false));
    }, []);

    const handleCardClick = (id) => {
        navigate(`/community/tournaments/${id}`);
    };

    if (loading) return <PageLoader />;

    return (
        <div style={S.root}>
            <style>{`
                .pub-tournament-card {
                    transition: transform 0.2s, border-color 0.2s;
                }
                .pub-tournament-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(0, 212, 236, 0.4) !important;
                }
            `}</style>

            <nav style={S.nav}>
                <div style={S.navLogo} onClick={() => navigate("/")}>
                    <img src="/images/logoImage/NUVRA_LOGO.webp" alt="Nuvra" style={{ height: 36 }} />
                </div>
                <div style={S.navActions}>
                    <button style={S.signInBtn} onClick={() => navigate("/community")}>
                        Log Masuk Penganjur
                    </button>
                </div>
            </nav>

            <div style={S.content}>
                <div style={S.heroArea}>
                    <span style={S.heroTag}>🏆 TOURNAMENT HUB</span>
                    <h1 style={S.heroTitle}>Kejohanan & Liga Rasmi</h1>
                    <p style={S.heroSub}>
                        Pantau kedudukan mata, jadual gameweek, dan statistik kejohanan tempatan secara langsung.
                    </p>
                </div>

                <div style={S.grid}>
                    {tournaments.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#666", padding: 60, gridColumn: "1 / -1" }}>
                            Tiada kejohanan aktif pada masa ini.
                        </div>
                    ) : (
                        tournaments.map((t) => (
                            <TournamentCard
                                key={t.id}
                                tournament={t}
                                onClick={() => handleCardClick(t.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

const S = {
    root: {
        minHeight: "100vh",
        background: "#0d1117",
        fontFamily: "'Inter', sans-serif",
        color: "#fff",
    },
    nav: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(13, 17, 23, 0.9)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
    },
    navLogo: {
        cursor: "pointer",
    },
    navActions: {
        display: "flex",
        gap: 12,
    },
    signInBtn: {
        background: "none",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
    },
    content: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "40px 16px 100px",
    },
    heroArea: {
        textAlign: "center",
        marginBottom: 40,
    },
    heroTag: {
        display: "inline-block",
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 1,
        color: BRAND_CYAN,
        background: "rgba(0, 212, 236, 0.1)",
        padding: "4px 10px",
        borderRadius: 20,
        marginBottom: 10,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 900,
        marginBottom: 8,
    },
    heroSub: {
        fontSize: 14,
        color: "rgba(255,255,255,0.5)",
        maxWidth: 560,
        margin: "0 auto",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 20,
    },
    card: {
        background: "rgba(22, 27, 38, 0.75)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 22,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    formatBadge: {
        background: "rgba(0, 212, 236, 0.1)",
        color: BRAND_CYAN,
        fontSize: 10,
        fontWeight: 900,
        padding: "3px 8px",
        borderRadius: 4,
    },
    seasonBadge: {
        fontSize: 10,
        color: "#888",
        fontWeight: 700,
    },
    title: {
        fontSize: 18,
        fontWeight: 800,
        marginBottom: 8,
        lineHeight: 1.3,
    },
    meta: {
        fontSize: 12,
        color: "rgba(255,255,255,0.5)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginBottom: 16,
    },
    statsBox: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 8,
        padding: "10px 16px",
        marginBottom: 16,
    },
    statCol: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    statVal: {
        fontSize: 15,
        fontWeight: 900,
        color: "#fff",
    },
    statLbl: {
        fontSize: 9,
        fontWeight: 800,
        color: "rgba(255,255,255,0.35)",
        letterSpacing: 0.5,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        background: "rgba(255,255,255,0.06)",
    },
    viewBtn: {
        marginTop: "auto",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        textAlign: "center",
        letterSpacing: 0.5,
    },
};
