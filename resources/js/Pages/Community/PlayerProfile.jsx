import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

export default function PlayerProfile() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem("community_token");
        if (!token) return navigate("/community");

        try {
            const res = await fetch(`${API}/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            if (res.ok) setData(json);
            else throw new Error("Failed to fetch");
        } catch (err) {
            console.error(err);
            navigate("/community/feed");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!data) return null;

    const { user, stats, history } = data;

    return (
        <div style={S.container}>
            <header style={S.header}>
                <button onClick={() => navigate("/community/feed")} style={S.backBtn}>← FEED</button>
                <div style={S.userHero}>
                    <div style={S.avatarLarge}>{user.name[0].toUpperCase()}</div>
                    <div style={S.userMeta}>
                        <h1 style={S.userName}>{user.name}</h1>
                        <p style={S.userEmail}>{user.email} • <span style={{ color: '#00D4EC', fontWeight: 800 }}>{user.role.toUpperCase()}</span></p>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div style={S.statsGrid}>
                <StatCard label="Matches" value={stats.total_matches} />
                <StatCard label="Goals" value={stats.total_goals} />
                <StatCard label="Assists" value={stats.total_assists} />
                <StatCard label="Avg Rating" value={stats.avg_rating} />
            </div>

            {/* History Table */}
            <div style={S.section}>
                <h2 style={S.sectionTitle}>Game History</h2>
                <div className="glass-panel" style={S.historyCard}>
                    {history.length === 0 ? (
                        <p style={S.emptyText}>No games played yet.</p>
                    ) : (
                        <table style={S.table}>
                            <thead>
                                <tr style={S.tableHeadRow}>
                                    <th style={S.th}>DATE</th>
                                    <th style={S.th}>MATCH</th>
                                    <th style={S.th}>VENUE</th>
                                    <th style={S.th}>LEAGUE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(m => (
                                    <tr key={m.id} style={S.tableRow}>
                                        <td style={S.td}>{m.date}</td>
                                        <td style={{ ...S.td, color: '#fff', fontWeight: 700 }}>{m.title}</td>
                                        <td style={S.td}>{m.venue}</td>
                                        <td style={{ ...S.td, color: '#D040EF' }}>{m.league}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="glass-panel" style={S.statCard}>
            <span style={S.statValue}>{value}</span>
            <span style={S.statLabel}>{label}</span>
        </div>
    );
}

const S = {
    container: { maxWidth: 900, margin: "0 auto", padding: "40px 20px" },
    header: { marginBottom: 40 },
    backBtn: { background: "none", border: "none", color: "#00D4EC", fontWeight: 800, fontSize: 12, cursor: "pointer", marginBottom: 30 },
    userHero: { display: "flex", alignItems: "center", gap: 24 },
    avatarLarge: { width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #00D4EC, #D040EF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#080810" },
    userName: { fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4 },
    userEmail: { fontSize: 14, color: "rgba(255,255,255,0.4)" },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 },
    statCard: { padding: 24, textAlign: "center", display: "flex", flexDirection: "column", gap: 4 },
    statValue: { fontSize: 28, fontWeight: 900, color: "#00D4EC", fontFamily: "'Barlow Condensed', sans-serif" },
    statLabel: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 },
    section: { marginBottom: 40 },
    sectionTitle: { fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 },
    historyCard: { padding: 0, overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeadRow: { borderBottom: "1px solid rgba(255,255,255,0.05)" },
    th: { textAlign: "left", padding: "16px 24px", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 800 },
    tableRow: { borderBottom: "1px solid rgba(255,255,255,0.03)" },
    td: { padding: "16px 24px", fontSize: 13, color: "rgba(255,255,255,0.6)" },
    emptyText: { padding: 40, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }
};
