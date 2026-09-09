import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";
const BRAND_BLUE = "#00D4EC";

export default function CommunityMembers() {
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem("community_token");
            const res = await fetch(`${API}/members`, {
                headers: { 
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            if (res.status === 401) {
                localStorage.removeItem("community_token");
                localStorage.removeItem("community_user");
                window.location.href = "/community";
                return;
            }
            const data = await res.json();
            setMembers(Array.isArray(data) ? data : []);
        } catch {
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = members.filter(m => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (m.name && m.name.toLowerCase().includes(term)) ||
            (m.vellar_id && m.vellar_id.toLowerCase().includes(term)) ||
            (m.position && m.position.toLowerCase().includes(term)) ||
            (m.club_name && m.club_name.toLowerCase().includes(term))
        );
    });

    return (
        <div style={S.container}>
            <PageLoader />
            <style>{`
                .member-card:hover { transform: translateY(-4px); border-color: ${BRAND_BLUE}88 !important; cursor: pointer; }
            `}</style>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
                <div>
                    <h1 style={S.title}>PLAYERS & MEMBERS</h1>
                    <p style={S.subtitle}>Directory of official Vellar League players and tournament members ({members.length} registered)</p>
                </div>
                <div style={{ width: '100%', maxWidth: 320 }}>
                    <input
                        type="text"
                        placeholder="🔍 Search name, Vellar ID, club..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={S.searchInput}
                    />
                </div>
            </div>

            {loading ? (
                <div style={S.emptyState}>LOADING MEMBERS...</div>
            ) : filtered.length === 0 ? (
                <div style={S.emptyState}>NO PLAYERS FOUND MATCHING "{searchTerm}"</div>
            ) : (
                <div style={S.grid}>
                    {filtered.map(m => (
                        <div key={m.id} style={S.card} className="member-card" onClick={() => navigate(`/community/members/${m.id}`)}>
                            <div style={S.avatarWrapper}>
                                <div style={S.avatar}>
                                    {m.avatar ? (
                                        <img src={m.avatar} alt="" style={S.avatarImg} />
                                    ) : (
                                        (m.name || "U")[0].toUpperCase()
                                    )}
                                </div>
                                {m.club_logo && (
                                    <div style={S.logoBadgeWrapper}>
                                        <img src={m.club_logo} alt="Club Logo" style={S.logoBadgeImg} />
                                    </div>
                                )}
                            </div>
                            <div style={S.info}>
                                <div style={S.name}>{m.name}</div>
                                {m.vellar_id && (
                                    <div style={S.vellarIdTag}>{m.vellar_id}</div>
                                )}
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                                    {m.position && (
                                        <span style={S.positionTag}>{m.position}</span>
                                    )}
                                    {m.club_name && (
                                        <span style={S.clubTag}>{m.club_name}</span>
                                    )}
                                </div>
                            </div>
                            <div style={S.stats}>
                                <div style={S.statItem}>
                                    <span style={S.statVal}>{m.games}</span>
                                    <span style={S.statLabel}>GAMES</span>
                                </div>
                                <div style={S.statItem}>
                                    <span style={S.statVal}>{m.goals}</span>
                                    <span style={S.statLabel}>GOALS</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const S = {
    container: { maxWidth: 1200, margin: "0 auto" },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 900, color: "#0f172a", letterSpacing: 1, marginBottom: 8 },
    subtitle: { fontSize: 14, color: "#64748b", marginBottom: 32 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
    card: {
        background: "#ffffff",
        borderRadius: 16,
        padding: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        transition: "all 0.2s ease"
    },
    avatar: { width: 80, height: 80, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#0284c7", overflow: "hidden", border: "2px solid rgba(2, 132, 199, 0.25)" },
    avatarWrapper: { position: "relative", marginBottom: 16 },
    logoBadgeWrapper: { position: "absolute", bottom: -4, right: -4, width: 32, height: 32, borderRadius: "50%", background: "#f8fafc", border: "2px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" },
    logoBadgeImg: { width: "100%", height: "100%", objectFit: "cover" },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    info: { marginBottom: 20 },
    name: { fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 },
    role: { fontSize: 11, fontWeight: 700, color: "#0284c7", letterSpacing: 1 },
    joined: { fontSize: 11, color: "#64748b", marginTop: 4 },
    stats: { display: "flex", gap: 24, borderTop: "1px solid #f1f5f9", paddingTop: 16, width: "100%", justifyContent: "center" },
    statItem: { display: "flex", flexDirection: "column", gap: 2 },
    statVal: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
    statLabel: { fontSize: 9, fontWeight: 700, color: "#64748b" },
    searchInput: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        color: "#0f172a",
        fontSize: 14,
        outline: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    vellarIdTag: {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        background: "rgba(2, 132, 199, 0.1)",
        color: "#0284c7",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.5,
        marginTop: 4
    },
    positionTag: {
        fontSize: 10,
        fontWeight: 700,
        color: "#16a34a",
        background: "rgba(22, 163, 74, 0.1)",
        padding: "2px 6px",
        borderRadius: 4
    },
    clubTag: {
        fontSize: 10,
        fontWeight: 600,
        color: "#475569",
        background: "#f1f5f9",
        padding: "2px 6px",
        borderRadius: 4
    },
    emptyState: { padding: "100px 0", textAlign: "center", color: "#64748b", fontSize: 14, fontWeight: 700 }
};
