import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";
const BRAND_CYAN = "#00D4EC";

function TournamentCard({ tournament, onClick }) {
    return (
        <div style={S.card} onClick={onClick} className="tournament-card">
            <div style={S.cardHeader}>
                <div style={S.badgeRow}>
                    <span style={S.formatBadge}>{tournament.format?.toUpperCase() || "LEAGUE"}</span>
                    <span style={S.seasonBadge}>{tournament.season || "SEASON 2026"}</span>
                </div>
                <span style={S.statusBadge}>
                    {tournament.status === "active" ? "🟢 SEDANG BERLANGSUNG" : tournament.status?.toUpperCase()}
                </span>
            </div>

            <h3 style={S.tournamentTitle}>{tournament.name}</h3>
            
            <div style={S.metaRow}>
                <span>📍 {tournament.venue || "Lokasi Rasmi"}</span>
                {tournament.organizer && (
                    <span>👑 {tournament.organizer.name}</span>
                )}
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

export default function CommunityFeed() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, LEAGUE, KNOCKOUT

    const user = JSON.parse(localStorage.getItem("community_user") || "null");
    const isOrganizer = user && (user.role === "club_owner" || user.role === "admin");

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await fetch(`${API}/tournaments`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setTournaments(data);
            }
        } catch (err) {
            console.error("Failed to load tournaments", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = tournaments.filter(t => {
        if (filter === "ALL") return true;
        return t.format?.toLowerCase() === filter.toLowerCase();
    });

    if (loading) return <PageLoader />;

    return (
        <div style={S.container}>
            <style>{`
                .tournament-card {
                    transition: transform 0.2s, border-color 0.2s;
                }
                .tournament-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(0, 212, 236, 0.4) !important;
                }
                @media (max-width: 768px) {
                    .feed-grid { grid-template-columns: 1fr !important; }
                    .feed-header-row { flex-direction: column; align-items: flex-start !important; gap: 12px; }
                }
            `}</style>

            {/* Header / Intro */}
            <div style={S.headerRow} className="feed-header-row">
                <div>
                    <h1 style={S.pageTitle}>Kejohanan & Liga Bola Sepak</h1>
                    <p style={S.pageSubtitle}>
                        Ikuti jadual perlawanan, keputusan rasmi, dan jadual kedudukan mata automatik.
                    </p>
                </div>

                {isOrganizer && (
                    <button
                        onClick={() => navigate("/community/admin/create-tournament")}
                        style={S.createBtn}
                    >
                        + CIPTA KEJOHANAN
                    </button>
                )}
            </div>

            {/* Filter Pills */}
            <div style={S.filterBar}>
                {["ALL", "LEAGUE", "KNOCKOUT"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            ...S.filterPill,
                            ...(filter === f ? S.activeFilterPill : {})
                        }}
                    >
                        {f === "ALL" ? "SEMUA FORMAT" : (f === "LEAGUE" ? "LIGA (ROUND-ROBIN)" : "KALAH MATI")}
                    </button>
                ))}
            </div>

            {/* Tournaments Grid */}
            <div style={S.grid} className="feed-grid">
                {filtered.length === 0 ? (
                    <div style={S.emptyState}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#888" }}>
                            Tiada kejohanan ditemui.
                        </p>
                        {isOrganizer && (
                            <button
                                onClick={() => navigate("/community/admin/create-tournament")}
                                style={{ ...S.createBtn, marginTop: 16 }}
                            >
                                Cipta Kejohanan Pertama Anda
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map((t) => (
                        <TournamentCard
                            key={t.id}
                            tournament={t}
                            onClick={() => navigate(`/community/tournaments/${t.id}`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

const S = {
    container: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "16px 0 80px",
        fontFamily: "'Inter', sans-serif",
        color: "#fff",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: -0.5,
        color: "#0f172a",
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 13,
        color: "#64748b",
    },
    createBtn: {
        background: "#0284c7",
        border: "none",
        color: "#ffffff",
        padding: "10px 18px",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 0.5,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
    },
    filterBar: {
        display: "flex",
        gap: 8,
        marginBottom: 24,
        overflowX: "auto",
        paddingBottom: 4,
    },
    filterPill: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        color: "#64748b",
        padding: "6px 14px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
        letterSpacing: 0.5,
    },
    activeFilterPill: {
        background: "#0284c7",
        color: "#ffffff",
        border: "1px solid #0284c7",
        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
        gap: 20,
    },
    card: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 22,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    badgeRow: {
        display: "flex",
        gap: 6,
    },
    formatBadge: {
        background: "rgba(2, 132, 199, 0.08)",
        color: "#0284c7",
        fontSize: 10,
        fontWeight: 900,
        padding: "3px 8px",
        borderRadius: 4,
        letterSpacing: 0.5,
    },
    seasonBadge: {
        background: "#f1f5f9",
        color: "#475569",
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 6px",
        borderRadius: 4,
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: 800,
        color: "#16a34a",
    },
    tournamentTitle: {
        fontSize: 18,
        fontWeight: 800,
        marginBottom: 8,
        color: "#0f172a",
        lineHeight: 1.3,
    },
    metaRow: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: 12,
        color: "#64748b",
        marginBottom: 18,
    },
    statsBox: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
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
        color: "#0f172a",
    },
    statLbl: {
        fontSize: 9,
        fontWeight: 800,
        color: "#64748b",
        letterSpacing: 0.5,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        background: "#e2e8f0",
    },
    viewBtn: {
        marginTop: "auto",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#0284c7",
        padding: "10px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        textAlign: "center",
        letterSpacing: 0.5,
        transition: "all 0.2s",
    },
    emptyState: {
        gridColumn: "1 / -1",
        textAlign: "center",
        padding: "60px 20px",
        background: "#ffffff",
        borderRadius: 14,
        border: "1px dashed #cbd5e1",
        color: "#64748b",
    },
};
