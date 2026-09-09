import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";
const BRAND_CYAN = "#00D4EC";

const authHeaders = () => {
    const token = localStorage.getItem("community_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function TournamentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("standings"); // standings, fixtures, teams, info
    const [selectedGameweek, setSelectedGameweek] = useState("");
    
    // Quick score edit modal for organizer
    const [editingMatch, setEditingMatch] = useState(null);
    const [scoreHome, setScoreHome] = useState(0);
    const [scoreAway, setScoreAway] = useState(0);
    const [savingScore, setSavingScore] = useState(false);

    useEffect(() => {
        fetchTournament();
    }, [id]);

    const fetchTournament = async () => {
        try {
            const res = await fetch(`${API}/tournaments/${id}`, {
                headers: { ...authHeaders() }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                const gws = Object.keys(json.gameweeks || {});
                if (gws.length > 0 && !selectedGameweek) {
                    setSelectedGameweek(gws[0]);
                }
            }
        } catch (err) {
            console.error("Error fetching tournament:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveScore = async (e) => {
        e.preventDefault();
        if (!editingMatch) return;
        setSavingScore(true);
        try {
            const res = await fetch(`${API}/matches/${editingMatch.id}/score`, {
                method: "PATCH",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    home_score: parseInt(scoreHome),
                    away_score: parseInt(scoreAway),
                    status: "completed"
                })
            });
            if (res.ok) {
                setEditingMatch(null);
                fetchTournament(); // Auto refreshes standings & fixtures!
            } else {
                const errData = await res.json();
                alert(errData.message || "Failed to update score");
            }
        } catch (err) {
            alert("Error updating score");
        } finally {
            setSavingScore(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!data || !data.tournament) {
        return (
            <div style={{ textAlign: "center", padding: "100px 20px", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
                <h2>Kejohanan Tidak Dijumpai</h2>
                <button 
                    onClick={() => navigate("/community/feed")}
                    style={{ marginTop: 20, padding: "10px 20px", background: BRAND_CYAN, border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                >
                    Kembali ke Senarai
                </button>
            </div>
        );
    }

    const { tournament, teams, gameweeks, standings, is_organizer } = data;
    const gameweekKeys = Object.keys(gameweeks || {});
    const currentFixtures = gameweeks[selectedGameweek] || [];

    return (
        <div style={S.container}>
            <style>{`
                @media (max-width: 768px) {
                    .tournament-hero-title { font-size: 26px !important; }
                    .tournament-tabs { overflow-x: auto; white-space: nowrap; }
                    .standings-table th, .standings-table td { padding: 8px 6px !important; font-size: 12px !important; }
                }
                .tab-btn:hover { color: #fff !important; }
                .gw-pill:hover { border-color: ${BRAND_CYAN} !important; }
            `}</style>

            {/* Top Navigation & Breadcrumbs */}
            <div style={S.topBar}>
                <button onClick={() => navigate("/community/feed")} style={S.backBtn}>
                    ← KEMBALI KE LIGA
                </button>
                {is_organizer && (
                    <button 
                        onClick={() => navigate(`/community/admin/tournaments/${tournament.id}/manage`)}
                        style={S.manageBtn}
                    >
                        ⚙️ URUS KEJOHANAN
                    </button>
                )}
            </div>

            {/* Tournament Hero Header */}
            <div style={S.heroCard}>
                <div style={S.heroBadgeRow}>
                    <span style={S.badgeFormat}>{tournament.format.toUpperCase()}</span>
                    <span style={S.badgeSeason}>{tournament.season || "SEASON 2026"}</span>
                    <span style={S.badgeStatus}>{tournament.status.toUpperCase()}</span>
                </div>
                <h1 style={S.title} className="tournament-hero-title">{tournament.name}</h1>
                <div style={S.heroMeta}>
                    <span>📍 {tournament.venue || "Lokasi Rasmi"}</span>
                    <span>•</span>
                    <span>👥 {teams?.length || 0} Pasukan Bertanding</span>
                    {tournament.organizer && (
                        <>
                            <span>•</span>
                            <span>👑 {tournament.organizer.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={S.tabsWrapper} className="tournament-tabs">
                <button 
                    style={{ ...S.tabBtn, ...(activeTab === "standings" ? S.activeTabBtn : {}) }}
                    onClick={() => setActiveTab("standings")}
                    className="tab-btn"
                >
                    📊 KEDUDUKAN (TABLE)
                </button>
                <button 
                    style={{ ...S.tabBtn, ...(activeTab === "fixtures" ? S.activeTabBtn : {}) }}
                    onClick={() => setActiveTab("fixtures")}
                    className="tab-btn"
                >
                    📅 JADUAL & KEPUTUSAN ({gameweekKeys.length} WEEKS)
                </button>
                <button 
                    style={{ ...S.tabBtn, ...(activeTab === "teams" ? S.activeTabBtn : {}) }}
                    onClick={() => setActiveTab("teams")}
                    className="tab-btn"
                >
                    🛡️ PASUKAN ({teams?.length || 0})
                </button>
                <button 
                    style={{ ...S.tabBtn, ...(activeTab === "info" ? S.activeTabBtn : {}) }}
                    onClick={() => setActiveTab("info")}
                    className="tab-btn"
                >
                    ℹ️ INFO & FORMAT
                </button>
            </div>

            {/* TAB CONTENT: 1. STANDINGS */}
            {activeTab === "standings" && (
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        <h2 style={S.cardTitle}>Jadual Kedudukan Terkini</h2>
                        <span style={S.cardSub}>Kiraan mata automatik (Menang: 3, Seri: 1, Kalah: 0)</span>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={S.table} className="standings-table">
                            <thead>
                                <tr style={S.thRow}>
                                    <th style={{ ...S.th, textAlign: "center", width: 40 }}>#</th>
                                    <th style={S.th}>PASUKAN</th>
                                    <th style={{ ...S.th, textAlign: "center" }}>P</th>
                                    <th style={{ ...S.th, textAlign: "center" }}>W</th>
                                    <th style={{ ...S.th, textAlign: "center" }}>D</th>
                                    <th style={{ ...S.th, textAlign: "center" }}>L</th>
                                    <th style={{ ...S.th, textAlign: "center" }}>GF</th>
                                    <th style={{ ...S.th, textAlign: "center" }}>GA</th>
                                    <th style={{ ...S.th, textAlign: "center" }}>GD</th>
                                    <th style={{ ...S.th, textAlign: "center", color: "#0284c7", fontWeight: 900 }}>PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!standings || standings.length === 0) ? (
                                    <tr>
                                        <td colSpan={10} style={{ textAlign: "center", padding: 30, color: "#64748b" }}>
                                            Belum ada rekod kedudukan perlawanan.
                                        </td>
                                    </tr>
                                ) : (
                                    standings.map((row) => {
                                        const isTop = row.position === 1;
                                        const isPodium = row.position <= 3;
                                        return (
                                            <tr key={row.name} style={{ ...S.tr, ...(isTop ? S.trLeader : {}) }}>
                                                <td style={{ ...S.td, textAlign: "center" }}>
                                                    <span style={{
                                                        ...S.posBadge,
                                                        background: isTop ? "#f59e0b" : (row.position === 2 ? "#64748b" : (row.position === 3 ? "#d97706" : "#f1f5f9")),
                                                        color: isPodium ? "#fff" : "#475569",
                                                        fontWeight: isPodium ? 900 : 700
                                                    }}>
                                                        {row.position}
                                                    </span>
                                                </td>
                                                <td style={S.td}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <div style={S.teamLogo}>
                                                            {row.logo ? (
                                                                <img src={row.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            ) : (
                                                                <span>{row.name.substring(0, 2).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <span style={{ fontWeight: 800, color: "#0f172a" }}>
                                                            {row.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ ...S.td, textAlign: "center", color: "#334155" }}>{row.played}</td>
                                                <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: "#16a34a" }}>{row.won}</td>
                                                <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: "#d97706" }}>{row.drawn}</td>
                                                <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{row.lost}</td>
                                                <td style={{ ...S.td, textAlign: "center", color: "#334155" }}>{row.gf}</td>
                                                <td style={{ ...S.td, textAlign: "center", color: "#334155" }}>{row.ga}</td>
                                                <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: row.gd > 0 ? "#16a34a" : (row.gd < 0 ? "#dc2626" : "#64748b") }}>
                                                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                                                </td>
                                                <td style={{ ...S.td, textAlign: "center", fontWeight: 900, fontSize: 15, color: "#0284c7" }}>
                                                    {row.points}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 2. FIXTURES & RESULTS */}
            {activeTab === "fixtures" && (
                <div>
                    {/* Gameweek Pills Selector */}
                    <div style={S.gwPillsRow}>
                        {gameweekKeys.map((gw) => (
                            <button
                                key={gw}
                                onClick={() => setSelectedGameweek(gw)}
                                style={{
                                    ...S.gwPill,
                                    ...(selectedGameweek === gw ? S.activeGwPill : {})
                                }}
                                className="gw-pill"
                            >
                                {gw}
                            </button>
                        ))}
                    </div>

                    {/* Matches List for Selected Gameweek */}
                    <div style={S.fixturesGrid}>
                        {currentFixtures.length === 0 ? (
                            <div style={{ ...S.card, textAlign: "center", padding: 40, color: "#666" }}>
                                Tiada perlawanan dijadualkan untuk {selectedGameweek}.
                            </div>
                        ) : (
                            currentFixtures.map((m) => {
                                const isPlayed = m.home_score !== null && m.away_score !== null;
                                return (
                                    <div key={m.id} style={S.fixtureCard}>
                                        <div style={S.fixtureMeta}>
                                            <span>📅 {m.match_date} • ⏰ {m.match_time?.substring(0, 5)}</span>
                                            <span>📍 {m.venue}</span>
                                            <span style={{
                                                ...S.statusMini,
                                                color: isPlayed ? "#4ade80" : "#38bdf8"
                                            }}>
                                                {m.status?.toUpperCase() || (isPlayed ? "COMPLETED" : "SCHEDULED")}
                                            </span>
                                        </div>

                                        <div style={S.fixtureMatchRow}>
                                            <div style={S.teamHome}>
                                                <span style={S.teamNameText}>{m.home_team_name}</span>
                                            </div>

                                            <div style={S.scoreBox}>
                                                {isPlayed ? (
                                                    <div style={S.scoreText}>
                                                        <span>{m.home_score}</span>
                                                        <span style={{ color: "rgba(255,255,255,0.3)" }}>-</span>
                                                        <span>{m.away_score}</span>
                                                    </div>
                                                ) : (
                                                    <div style={S.vsText}>VS</div>
                                                )}
                                            </div>

                                            <div style={S.teamAway}>
                                                <span style={S.teamNameText}>{m.away_team_name}</span>
                                            </div>
                                        </div>

                                        {is_organizer && (
                                            <div style={S.organizerFixtureAction}>
                                                <button
                                                    style={S.quickScoreBtn}
                                                    onClick={() => {
                                                        setEditingMatch(m);
                                                        setScoreHome(m.home_score ?? 0);
                                                        setScoreAway(m.away_score ?? 0);
                                                    }}
                                                >
                                                    ✏️ {isPlayed ? "Kemas Kini Skor" : "Masukkan Skor"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 3. TEAMS */}
            {activeTab === "teams" && (
                <div style={S.teamsGrid}>
                    {(!teams || teams.length === 0) ? (
                        <div style={{ ...S.card, textAlign: "center", padding: 40, color: "#666", gridColumn: "1 / -1" }}>
                            Belum ada pasukan didaftarkan.
                        </div>
                    ) : (
                        teams.map((t) => (
                            <div key={t.id} style={S.teamCard}>
                                <div style={S.teamCardLogo}>
                                    {t.logo ? (
                                        <img src={t.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <span style={{ fontSize: 24, fontWeight: 900, color: BRAND_CYAN }}>
                                            {t.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <h3 style={S.teamCardName}>{t.name}</h3>
                                {t.group_name && <span style={S.teamGroupBadge}>{t.group_name}</span>}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* TAB CONTENT: 4. INFO & FORMAT */}
            {activeTab === "info" && (
                <div style={S.card}>
                    <h2 style={S.cardTitle}>Maklumat Kejohanan</h2>
                    <div style={S.infoGrid}>
                        <div style={S.infoItem}>
                            <span style={S.infoLabel}>Nama Kejohanan</span>
                            <span style={S.infoVal}>{tournament.name}</span>
                        </div>
                        <div style={S.infoItem}>
                            <span style={S.infoLabel}>Format Pertandingan</span>
                            <span style={S.infoVal}>
                                {tournament.format === "league" ? "Liga Satu Pusingan / Round-Robin" : tournament.format}
                            </span>
                        </div>
                        <div style={S.infoItem}>
                            <span style={S.infoLabel}>Musim / Edisi</span>
                            <span style={S.infoVal}>{tournament.season || "2026"}</span>
                        </div>
                        <div style={S.infoItem}>
                            <span style={S.infoLabel}>Gelanggang / Lokasi</span>
                            <span style={S.infoVal}>{tournament.venue}</span>
                        </div>
                    </div>
                    {tournament.description && (
                        <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                            <span style={S.infoLabel}>Penerangan / Syarat Kejohanan</span>
                            <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
                                {tournament.description}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* QUICK SCORE ENTRY MODAL */}
            {editingMatch && (
                <div style={S.modalOverlay}>
                    <div style={S.modalContent}>
                        <h3 style={S.modalTitle}>Kemas Kini Keputusan Perlawanan</h3>
                        <p style={S.modalSub}>{editingMatch.gameweek}: {editingMatch.match_date}</p>

                        <form onSubmit={handleSaveScore}>
                            <div style={S.scoreEditRow}>
                                <div style={S.teamInputBox}>
                                    <label style={S.teamInputLabel}>{editingMatch.home_team_name}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={scoreHome}
                                        onChange={(e) => setScoreHome(e.target.value)}
                                        style={S.scoreInput}
                                        required
                                    />
                                </div>

                                <div style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.3)" }}>:</div>

                                <div style={S.teamInputBox}>
                                    <label style={S.teamInputLabel}>{editingMatch.away_team_name}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={scoreAway}
                                        onChange={(e) => setScoreAway(e.target.value)}
                                        style={S.scoreInput}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={S.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setEditingMatch(null)}
                                    style={S.cancelBtn}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingScore}
                                    style={S.saveScoreBtn}
                                >
                                    {savingScore ? "Menyimpan..." : "Simpan Keputusan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const S = {
    container: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "20px 16px 80px",
        fontFamily: "'Inter', sans-serif",
        color: "#0f172a",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    backBtn: {
        background: "none",
        border: "none",
        color: "#0284c7",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.5,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
    },
    manageBtn: {
        background: "#0284c7",
        border: "none",
        color: "#fff",
        padding: "8px 18px",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
        transition: "background 0.2s",
    },
    heroCard: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: "28px 24px",
        marginBottom: 24,
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
    },
    heroBadgeRow: {
        display: "flex",
        gap: 8,
        marginBottom: 12,
    },
    badgeFormat: {
        background: "rgba(2, 132, 199, 0.08)",
        color: "#0284c7",
        border: "1px solid rgba(2, 132, 199, 0.2)",
        fontSize: 10,
        fontWeight: 900,
        padding: "4px 8px",
        borderRadius: 6,
        letterSpacing: 0.5,
    },
    badgeSeason: {
        background: "#f1f5f9",
        color: "#475569",
        border: "1px solid #e2e8f0",
        fontSize: 10,
        fontWeight: 800,
        padding: "4px 8px",
        borderRadius: 6,
    },
    badgeStatus: {
        background: "rgba(22, 163, 74, 0.08)",
        color: "#16a34a",
        border: "1px solid rgba(22, 163, 74, 0.2)",
        fontSize: 10,
        fontWeight: 800,
        padding: "4px 8px",
        borderRadius: 6,
    },
    title: {
        fontSize: 32,
        fontWeight: 900,
        letterSpacing: -0.5,
        color: "#0f172a",
        marginBottom: 8,
    },
    heroMeta: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        color: "#64748b",
        fontSize: 13,
    },
    tabsWrapper: {
        display: "flex",
        gap: 8,
        borderBottom: "1px solid #e2e8f0",
        marginBottom: 24,
        paddingBottom: 4,
    },
    tabBtn: {
        background: "none",
        border: "none",
        color: "#64748b",
        fontSize: 13,
        fontWeight: 800,
        padding: "10px 16px",
        borderRadius: 8,
        cursor: "pointer",
        letterSpacing: 0.5,
        transition: "all 0.2s",
    },
    activeTabBtn: {
        color: "#0284c7",
        background: "rgba(2, 132, 199, 0.08)",
        borderBottom: "2px solid #0284c7",
    },
    card: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 800,
        color: "#0f172a",
    },
    cardSub: {
        fontSize: 12,
        color: "#64748b",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
    },
    thRow: {
        borderBottom: "2px solid #e2e8f0",
        background: "#f8fafc",
    },
    th: {
        padding: "12px 10px",
        color: "#64748b",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.5,
        textAlign: "left",
    },
    tr: {
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.2s",
    },
    trLeader: {
        background: "rgba(2, 132, 199, 0.03)",
    },
    td: {
        padding: "12px 10px",
        color: "#334155",
    },
    posBadge: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 6,
        fontSize: 11,
    },
    teamLogo: {
        width: 28,
        height: 28,
        borderRadius: 6,
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 800,
        color: "#64748b",
        overflow: "hidden",
    },
    gwPillsRow: {
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 12,
        marginBottom: 16,
    },
    gwPill: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        color: "#475569",
        padding: "8px 16px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
    },
    activeGwPill: {
        background: "#0284c7",
        color: "#ffffff",
        border: "1px solid #0284c7",
        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
    },
    fixturesGrid: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    fixtureCard: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 18,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
    },
    fixtureMeta: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        fontSize: 11,
        color: "#64748b",
        marginBottom: 12,
    },
    statusMini: {
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 0.5,
    },
    fixtureMatchRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0",
    },
    teamHome: {
        flex: 1,
        textAlign: "right",
        paddingRight: 16,
    },
    teamAway: {
        flex: 1,
        textAlign: "left",
        paddingLeft: 16,
    },
    teamNameText: {
        fontSize: 15,
        fontWeight: 800,
        color: "#0f172a",
    },
    scoreBox: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "6px 16px",
        borderRadius: 8,
        minWidth: 70,
        textAlign: "center",
    },
    scoreText: {
        display: "flex",
        gap: 8,
        justifyContent: "center",
        alignItems: "center",
        fontSize: 18,
        fontWeight: 900,
        color: "#0f172a",
    },
    vsText: {
        fontSize: 12,
        fontWeight: 900,
        color: "#94a3b8",
    },
    organizerFixtureAction: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 12,
        borderTop: "1px solid #f1f5f9",
        paddingTop: 8,
    },
    quickScoreBtn: {
        background: "none",
        border: "none",
        color: "#0284c7",
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
    },
    teamsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
    },
    teamCard: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 24,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
    },
    teamCardLogo: {
        width: 64,
        height: 64,
        borderRadius: 16,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        overflow: "hidden",
        fontSize: 18,
        fontWeight: 900,
        color: "#64748b",
    },
    teamCardName: {
        fontSize: 15,
        fontWeight: 800,
        color: "#0f172a",
    },
    teamGroupBadge: {
        marginTop: 6,
        fontSize: 10,
        color: "#64748b",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        padding: "2px 8px",
        borderRadius: 4,
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
    },
    infoItem: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    infoLabel: {
        fontSize: 11,
        color: "#64748b",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    infoVal: {
        fontSize: 14,
        fontWeight: 700,
        color: "#0f172a",
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: 16,
    },
    modalContent: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 420,
        textAlign: "center",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 900,
        marginBottom: 4,
        color: "#0f172a",
    },
    modalSub: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 20,
    },
    scoreEditRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        marginBottom: 24,
    },
    teamInputBox: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
    },
    teamInputLabel: {
        fontSize: 12,
        fontWeight: 800,
        color: "#334155",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 120,
    },
    scoreInput: {
        width: 70,
        height: 50,
        background: "#f8fafc",
        border: "2px solid #0284c7",
        borderRadius: 8,
        fontSize: 22,
        fontWeight: 900,
        color: "#0f172a",
        textAlign: "center",
        outline: "none",
    },
    modalActions: {
        display: "flex",
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        color: "#64748b",
        padding: 12,
        borderRadius: 8,
        fontWeight: 800,
        cursor: "pointer",
    },
    saveScoreBtn: {
        flex: 2,
        background: "#0284c7",
        border: "none",
        color: "#ffffff",
        padding: 12,
        borderRadius: 8,
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
    },
};
