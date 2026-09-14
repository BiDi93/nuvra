import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";
import { IconSearch } from "../../Components/Icons";

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
                .member-search::placeholder { color: var(--text-muted); }
            `}</style>

            <div style={S.headerRow}>
                <div>
                    <h1 style={S.title}>PLAYERS & MEMBERS</h1>
                    <p style={S.subtitle}>Directory of official Vellar League players and tournament members ({members.length} registered)</p>
                </div>
                <div style={S.searchWrap}>
                    <span style={S.searchIcon}><IconSearch size={16} /></span>
                    <input
                        type="text"
                        placeholder="Search name, Vellar ID, club..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={S.searchInput}
                        className="member-search"
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
                                <div style={S.tagRow}>
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
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 38, fontWeight: 800, color: "var(--text-primary)", letterSpacing: 0.5, marginBottom: 6 },
    subtitle: { fontSize: 14, color: "var(--text-muted)" },

    searchWrap: { position: "relative", width: "100%", maxWidth: 320 },
    searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", pointerEvents: "none" },
    searchInput: {
        width: "100%",
        padding: "12px 16px 12px 40px",
        borderRadius: 12,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        color: "var(--text-primary)",
        fontSize: 14,
        outline: "none",
    },

    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
    card: {
        background: "var(--bg-surface)",
        borderRadius: 16,
        padding: "24px",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        transition: "transform 0.2s ease, border-color 0.2s ease",
    },
    avatar: { width: 80, height: 80, borderRadius: "50%", background: "var(--bg-surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: BRAND_BLUE, overflow: "hidden", border: "1px solid var(--border-default)" },
    avatarWrapper: { position: "relative", marginBottom: 16 },
    logoBadgeWrapper: { position: "absolute", bottom: -4, right: -4, width: 32, height: 32, borderRadius: "50%", background: "var(--bg-surface-raised)", border: "2px solid var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: 10 },
    logoBadgeImg: { width: "100%", height: "100%", objectFit: "cover" },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    info: { marginBottom: 20 },
    name: { fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 },
    tagRow: { display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 },
    stats: { display: "flex", gap: 24, borderTop: "1px solid var(--border-subtle)", paddingTop: 16, width: "100%", justifyContent: "center" },
    statItem: { display: "flex", flexDirection: "column", gap: 2 },
    statVal: { fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" },
    statLabel: { fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 0.5 },

    vellarIdTag: {
        display: "inline-block",
        padding: "2px 9px",
        borderRadius: 6,
        background: "var(--bg-surface-raised)",
        border: "1px solid var(--border-subtle)",
        color: BRAND_BLUE,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.5,
        marginTop: 4,
    },
    positionTag: {
        fontSize: 10,
        fontWeight: 700,
        color: "var(--color-success)",
        background: "rgba(34, 197, 94, 0.12)",
        padding: "2px 7px",
        borderRadius: 4,
    },
    clubTag: {
        fontSize: 10,
        fontWeight: 600,
        color: "var(--text-dim)",
        background: "var(--bg-surface-raised)",
        border: "1px solid var(--border-subtle)",
        padding: "2px 7px",
        borderRadius: 4,
    },
    emptyState: { padding: "100px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14, fontWeight: 600 },
};
