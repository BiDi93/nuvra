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
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 900, color: "#fff", letterSpacing: 1, marginBottom: 8 },
    subtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 40 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
    card: {
        background: "rgba(30, 31, 35, 0.8)",
        borderRadius: 20,
        padding: "24px",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        transition: "all 0.2s ease"
    },
    avatar: { width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: BRAND_BLUE, overflow: "hidden", border: `2px solid ${BRAND_BLUE}33` },
    avatarWrapper: { position: "relative", marginBottom: 16 },
    logoBadgeWrapper: { position: "absolute", bottom: -4, right: -4, width: 32, height: 32, borderRadius: "50%", background: "#1e2330", border: "2px solid #0d111a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: 10 },
    logoBadgeImg: { width: "100%", height: "100%", objectFit: "cover" },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    info: { marginBottom: 20 },
    name: { fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 },
    role: { fontSize: 11, fontWeight: 700, color: BRAND_BLUE, letterSpacing: 1 },
    joined: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 },
    stats: { display: "flex", gap: 24, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16, width: "100%", justifyContent: "center" },
    statItem: { display: "flex", flexDirection: "column", gap: 2 },
    statVal: { fontSize: 16, fontWeight: 900, color: "#fff" },
    statLabel: { fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)" },
    searchInput: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        fontSize: 14,
        outline: "none"
    },
    vellarIdTag: {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        background: "rgba(0,212,236,0.15)",
        color: BRAND_BLUE,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.5,
        marginTop: 4
    },
    positionTag: {
        fontSize: 10,
        fontWeight: 700,
        color: "#10b981",
        background: "rgba(16,185,129,0.1)",
        padding: "2px 6px",
        borderRadius: 4
    },
    clubTag: {
        fontSize: 10,
        fontWeight: 600,
        color: "rgba(255,255,255,0.6)",
        background: "rgba(255,255,255,0.05)",
        padding: "2px 6px",
        borderRadius: 4
    },
    emptyState: { padding: "100px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 700 }
};
