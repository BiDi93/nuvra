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

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("community_token");
            const res = await fetch(`${API}/members/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setProfile(data);
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!profile) return <div style={S.empty}>Player not found.</div>;

    const { user, stats, history } = profile;

    return (
        <div style={S.container}>
            <button style={S.backBtn} onClick={() => navigate(-1)}>← Back to Community</button>
            
            <header style={S.header}>
                <div style={S.profileMain}>
                    <div style={S.avatarLarge}>
                        {user.avatar ? (
                            <img src={user.avatar} alt="" style={S.avatarImg} />
                        ) : (
                            user.name[0].toUpperCase()
                        )}
                    </div>
                    <div style={S.userMeta}>
                        <h1 style={S.name}>{user.name}</h1>
                        <p style={S.roleBadge}>{user.role?.toUpperCase()}</p>
                        <p style={S.joined}>Joined {user.joined}</p>
                    </div>
                </div>
            </header>

            <div style={S.content}>
                {/* SECTION 1: Stats */}
                <section style={S.section}>
                    <h2 style={S.sectionTitle}>CAREER STATS</h2>
                    <div style={S.statsGrid}>
                        <StatCard label="MATCHES" value={stats.total_matches} />
                        <StatCard label="GOALS" value={stats.total_goals} />
                        <StatCard label="ASSISTS" value={stats.total_assists} />
                        <StatCard label="AVG RATING" value={stats.avg_rating} />
                    </div>
                </section>

                {/* SECTION 2: Graph */}
                {history && history.length > 0 && (
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
                )}

                {/* SECTION 3: Match History */}
                {history && (
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>RECENT GAMES</h2>
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
                    </section>
                )}
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
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    userMeta: { flex: 1 },
    name: { fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: -0.5 },
    roleBadge: { display: "inline-block", padding: "4px 12px", borderRadius: 8, background: "rgba(0,212,236,0.1)", color: BRAND_BLUE, fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
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
