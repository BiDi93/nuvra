import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = "/api/community";
const BRAND_BLUE = "#00D4EC";

export default function PublicPlayerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("community_token");
            const res = await fetch(`${API}/members/${id}`, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const data = await res.json();
            if (!res.ok || !data.user) {
                setError(data.message || "Player not found.");
                setProfile(null);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
            setError("Failed to load player profile.");
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoader />;
    if (error || !profile || !profile.user) {
        return (
            <div style={S.container}>
                <button style={S.backBtn} onClick={() => navigate("/community/members")}>← Back to Members</button>
                <div style={S.empty}>{error || "Player not found."}</div>
            </div>
        );
    }

    const { user, stats = {}, history = [] } = profile;

    return (
        <div style={S.container}>
            <button style={S.backBtn} onClick={() => navigate("/community/members")}>← Back to Members</button>
            
            <header style={S.header}>
                <div style={S.profileMain}>
                    <div style={S.avatarWrapper}>
                        <div style={S.avatarLarge}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="" style={S.avatarImg} />
                            ) : (
                                (user.name || "U")[0].toUpperCase()
                            )}
                        </div>
                        {user.club_logo && (
                            <div style={S.logoBadgeWrapper}>
                                <img src={user.club_logo} alt="Club Logo" style={S.logoBadgeImg} />
                            </div>
                        )}
                    </div>
                    <div style={S.userMeta}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                            <h1 style={S.name}>{user.name}</h1>
                            {user.vellar_id && (
                                <span style={S.vellarBadge}>{user.vellar_id}</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            <span style={S.roleBadge}>{user.role?.toUpperCase()}</span>
                            {user.position && (
                                <span style={S.positionBadge}>📍 {user.position}</span>
                            )}
                            {user.club_name && (
                                <span style={S.clubBadge}>🛡️ {user.club_name}</span>
                            )}
                        </div>
                        <p style={S.joined}>Registered Member · Joined {user.joined || "2026"}</p>
                    </div>
                </div>
            </header>

            <div style={S.content}>
                {/* SECTION 1: Stats */}
                <section style={S.section}>
                    <h2 style={S.sectionTitle}>CAREER STATS</h2>
                    <div style={S.statsGrid}>
                        <StatCard label="MATCHES" value={stats.total_matches ?? 0} />
                        <StatCard label="GOALS" value={stats.total_goals ?? 0} />
                        <StatCard label="ASSISTS" value={stats.total_assists ?? 0} />
                        <StatCard label="AVG RATING" value={stats.avg_rating ?? 0} />
                    </div>
                </section>

                {/* SECTION 2: Graph */}
                {history && history.length > 0 ? (
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>PERFORMANCE TREND</h2>
                        <div style={S.graphCard}>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="colorRatingPublic" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={BRAND_BLUE} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={BRAND_BLUE} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString('en-MY', {day:'numeric', month:'short'})} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} domain={[0, 10]} />
                                    <Tooltip 
                                        contentStyle={{ background: '#1e2025', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                                        itemStyle={{ color: BRAND_BLUE, fontSize: 12, fontWeight: 700 }}
                                        labelStyle={{ color: '#fff', marginBottom: 4 }}
                                    />
                                    <Area type="monotone" dataKey="rating" stroke={BRAND_BLUE} strokeWidth={3} fillOpacity={1} fill="url(#colorRatingPublic)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                ) : null}

                {/* SECTION 3: Match History */}
                <section style={S.section}>
                    <h2 style={S.sectionTitle}>RECENT GAMES</h2>
                    {history && history.length > 0 ? (
                        <div style={S.historyList}>
                            {history.map(m => (
                                <div key={m.id} style={S.historyItem}>
                                    <div style={S.historyDate}>{new Date(m.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</div>
                                    <div style={S.historyMain}>
                                        <div style={S.historyTitle}>{m.title}</div>
                                        <div style={S.historyVenue}>📍 {m.venue}</div>
                                    </div>
                                    <div style={S.historyStats}>
                                        <span style={S.historyStatBadge}>⚽ {m.goals}</span>
                                        <span style={{...S.historyStatBadge, color: BRAND_BLUE}}>⭐ {m.rating}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
                            No individual match performances logged yet for this tournament season.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div style={S.statCard}>
            <div style={S.statVal}>{value}</div>
            <div style={S.statLabel}>{label}</div>
        </div>
    );
}

const S = {
    container: { maxWidth: 1000, margin: "0 auto", paddingBottom: 80 },
    backBtn: { background: 'none', border: 'none', color: BRAND_BLUE, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 32 },
    header: { marginBottom: 48 },
    profileMain: { display: "flex", alignItems: "center", gap: 32 },
    avatarLarge: { width: 120, height: 120, borderRadius: 32, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900, color: BRAND_BLUE, overflow: "hidden" },
    avatarWrapper: { position: "relative" },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    logoBadgeWrapper: { position: "absolute", bottom: -8, right: -8, width: 52, height: 52, borderRadius: "50%", background: "#1e2330", border: "3px solid #0d111a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: 10 },
    logoBadgeImg: { width: "100%", height: "100%", objectFit: "cover" },
    userMeta: { flex: 1 },
    name: { fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 0, letterSpacing: -0.5 },
    vellarBadge: { display: "inline-block", padding: "4px 10px", borderRadius: 8, background: "rgba(0,212,236,0.15)", border: "1px solid rgba(0,212,236,0.4)", color: BRAND_BLUE, fontSize: 12, fontWeight: 800, letterSpacing: 0.5 },
    positionBadge: { display: "inline-block", padding: "4px 10px", borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 11, fontWeight: 700 },
    clubBadge: { display: "inline-block", padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700 },
    roleBadge: { display: "inline-block", padding: "4px 12px", borderRadius: 8, background: "rgba(0,212,236,0.1)", color: BRAND_BLUE, fontSize: 10, fontWeight: 800, letterSpacing: 1 },
    joined: { color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 500 },

    content: { display: "flex", flexDirection: "column", gap: 48 },
    section: { background: "rgba(30, 31, 35, 0.4)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.05)" },
    sectionTitle: { fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 24 },
    
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 },
    statCard: { background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: "24px 16px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" },
    statVal: { fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4 },
    statLabel: { fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: 1 },

    graphCard: { paddingTop: 20 },
    
    historyList: { display: "flex", flexDirection: "column", gap: 12 },
    historyItem: { display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" },
    historyDate: { fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.3)", width: 60 },
    historyMain: { flex: 1 },
    historyTitle: { fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 },
    historyVenue: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
    historyStats: { display: "flex", gap: 12 },
    historyStatBadge: { padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,0.2)", fontSize: 11, fontWeight: 800, color: "#fff" },

    empty: { padding: 100, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 },
};
