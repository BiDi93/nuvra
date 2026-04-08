import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PendingRequests from './PendingRequest';

export default function SquadManagement() {
    const navigate = useNavigate();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const user = JSON.parse(localStorage.getItem("community_user") || "{}");
    const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");
    const coachId = user.id || 1;

    const fetchTeam = () => {
        const headers = { Authorization: `Bearer ${token}` };
        fetch(`/api/coach/${coachId}/players`, { headers })
            .then(res => res.json())
            .then(data => { setTeam(data); setLoading(false); })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchTeam(); }, [coachId, token]);

    if (loading) return (
        <div style={S.loading}>LOADING ROSTER...</div>
    );

    return (
        <div style={S.page}>
            <Toaster position="top-right" />
            {/* Top bar */}
            <div style={S.topBar}>
                <div style={S.topBarTitle}>NUVRA // SQUAD MANAGEMENT</div>
                <div style={S.statChip}>
                    <span style={S.statNum}>{team.length}</span>
                    <span style={S.statLabel}>PLAYERS</span>
                </div>
            </div>

            {/* Pending Requests */}
            <PendingRequests coachId={coachId} onActionComplete={fetchTeam} />

            {/* Section header */}
            <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>ACTIVE ROSTER</span>
            </div>

            {/* Roster grid */}
            {team.length === 0 ? (
                <div style={S.empty}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                    <div style={S.emptyText}>NO ACTIVE PLAYERS</div>
                    <div style={S.emptySubText}>Players will appear here once approved.</div>
                </div>
            ) : (
                <div style={S.grid}>
                    {team.map(player => (
                        <div key={player.id} style={S.card}>
                            <div style={S.cardAccent} />
                            <div style={S.cardInner}>
                                {/* Avatar + jersey */}
                                <div style={S.cardTop}>
                                    <div style={S.avatar}>
                                        <img
                                            src={player.profile_image || "/avatar-placeholder.png"}
                                            alt={player.name}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                        />
                                    </div>
                                    <div style={S.jerseyNum}>#{player.jersey_number || "–"}</div>
                                </div>

                                {/* Info */}
                                <div style={S.playerName}>{player.name}</div>
                                <div style={S.playerEmail}>{player.email}</div>
                                <div style={S.positionBadge}>{player.position || "PLAYER"}</div>

                                {/* Actions */}
                                <div style={S.cardActions}>
                                    <button
                                        style={S.viewBtn}
                                        onClick={() => navigate(`/coach/player/${player.id}`)}
                                    >
                                        VIEW STATS →
                                    </button>
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
    loading: {
        padding: "80px 32px",
        textAlign: "center",
        color: "rgba(255,255,255,0.3)",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 2,
        fontFamily: "Inter, sans-serif",
    },
    page: {
        padding: "0 32px 60px",
        minHeight: "100vh",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "28px 0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: 28,
    },
    topBarTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 20,
        letterSpacing: 3,
        color: "rgba(255,255,255,0.6)",
    },
    statChip: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
    },
    statNum: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24,
        color: "#a78bfa",
        lineHeight: 1,
    },
    statLabel: {
        fontSize: 9,
        letterSpacing: 1.2,
        color: "rgba(255,255,255,0.35)",
        marginTop: 2,
    },
    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 2,
        color: "rgba(255,255,255,0.5)",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 14,
    },
    card: {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        overflow: "hidden",
        display: "flex",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
    },
    cardAccent: {
        width: 3,
        background: "linear-gradient(180deg, #a78bfa, #7c3aed)",
        flexShrink: 0,
    },
    cardInner: {
        flex: 1,
        padding: "16px 16px 14px",
        display: "flex",
        flexDirection: "column",
    },
    cardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    avatar: {
        width: 44, height: 44,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
        border: "2px solid rgba(255,255,255,0.1)",
    },
    jerseyNum: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 28,
        color: "rgba(255,255,255,0.08)",
        lineHeight: 1,
        letterSpacing: 1,
    },
    playerName: {
        fontSize: 14,
        fontWeight: 800,
        color: "#fff",
        marginBottom: 2,
    },
    playerEmail: {
        fontSize: 11,
        color: "rgba(255,255,255,0.3)",
        marginBottom: 10,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    positionBadge: {
        display: "inline-block",
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1.2,
        color: "#a78bfa",
        background: "rgba(167,139,250,0.1)",
        border: "1px solid rgba(167,139,250,0.2)",
        padding: "3px 8px",
        borderRadius: 4,
        textTransform: "uppercase",
        marginBottom: 14,
    },
    cardActions: {
        borderTop: "1px solid rgba(255,255,255,0.05)",
        paddingTop: 12,
        marginTop: "auto",
    },
    viewBtn: {
        background: "none",
        border: "none",
        color: "#a78bfa",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1,
        cursor: "pointer",
        fontFamily: "inherit",
        padding: 0,
    },
    empty: {
        textAlign: "center",
        padding: "60px 24px",
        color: "rgba(255,255,255,0.25)",
    },
    emptyText: {
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 2,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 12,
        color: "rgba(255,255,255,0.2)",
    },
};
