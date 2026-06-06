import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = "/api/community";
const BRAND_BLUE = "#00D4EC";

export default function PlayerProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        const token = localStorage.getItem("community_token");
        if (token) fetch(`${API}/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        localStorage.removeItem("community_token");
        localStorage.removeItem("community_user");
        navigate("/community");
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("community_token");
            const res = await fetch(`${API}/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setProfile(data);
            
            if (data.user) {
                localStorage.setItem("community_user", JSON.stringify(data.user));
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setLoading(true);
        try {
            const token = localStorage.getItem("community_token");
            const res = await fetch(`${API}/profile/avatar`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const resData = await res.json();
            if (res.ok) {
                fetchProfile();
                window.location.reload(); 
            } else {
                alert(resData.message);
            }
        } catch (err) {
            alert("Error uploading avatar");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!profile) return <div style={S.empty}>No profile data found.</div>;

    const { user, stats, club, history } = profile;
    const isOwner = user.role === 'club_owner' || user.role === 'admin';

    return (
        <div style={S.container}>
            <style>{`
                .mobile-signout { display: none; }
                @media (max-width: 768px) {
                    .profile-main  { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
                    .profile-name  { font-size: 24px !important; }
                    .stats-grid    { grid-template-columns: repeat(2, 1fr) !important; }
                    .history-item  { flex-wrap: wrap !important; gap: 8px !important; }
                    .mobile-signout { display: block !important; }
                }
            `}</style>
            <header style={S.header}>
                <div style={S.profileMain} className="profile-main">
                    <div style={S.avatarWrapper}>
                        <div style={S.avatarLarge}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="" style={S.avatarImg} />
                            ) : (
                                user.name[0].toUpperCase()
                            )}
                        </div>
                        <label style={S.avatarEdit}>
                            <input type="file" hidden onChange={handleAvatarUpload} accept="image/*" />
                            <span>📷</span>
                        </label>
                    </div>
                    <div style={S.userMeta}>
                        <h1 style={S.name} className="profile-name">{user.name}</h1>
                        <p style={S.roleBadge}>{user.role?.toUpperCase()}</p>
                        <p style={S.email}>{user.email}</p>
                    </div>
                </div>
            </header>

            <div style={S.content}>
                {/* SECTION 1: Basic Info */}
                <section style={S.section}>
                    <h2 style={S.sectionTitle}>BASIC INFORMATION</h2>
                    <div style={S.infoGrid}>
                        <InfoItem label="Address" value={user.address || "Not set"} />
                        <InfoItem label="Phone" value={user.phone || "Not set"} />
                        {isOwner && (
                            <>
                                <InfoItem label="Club Name" value={club?.name} />
                                <InfoItem label="Established" value={club?.established_at || "Not set"} />
                                <InfoItem label="Location" value={club?.location} />
                            </>
                        )}
                    </div>
                </section>

                {/* SECTION 2: Stats */}
                <section style={S.section}>
                    <h2 style={S.sectionTitle}>{isOwner ? "MANAGEMENT STATS" : "PERFORMANCE OVERVIEW"}</h2>
                    <div style={S.statsGrid} className="stats-grid">
                        {isOwner ? (
                            <>
                                <StatCard label="GAMES ORGANIZED" value={stats.total_organized} />
                                <StatCard label="ACTIVE PLAYERS" value={stats.active_players} />
                            </>
                        ) : (
                            <>
                                <StatCard label="MATCHES" value={stats.total_matches} />
                                <StatCard label="GOALS" value={stats.total_goals} />
                                <StatCard label="ASSISTS" value={stats.total_assists} />
                                <StatCard label="AVG RATING" value={stats.avg_rating} />
                            </>
                        )}
                    </div>
                </section>

                {/* SECTION 3: Visual History (Graph) - Player Only */}
                {!isOwner && history && history.length > 0 && (
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>PERFORMANCE GRAPH</h2>
                        <div style={S.graphCard}>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
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
                                    <Area type="monotone" dataKey="rating" stroke={BRAND_BLUE} strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}

                {/* SECTION 4: Match History Timeline */}
                {!isOwner && history && (
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>MATCH HISTORY</h2>
                        <div style={S.historyList}>
                            {history.map(m => (
                                <div key={m.id} style={S.historyItem} className="history-item">
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

                {/* Mobile-only sign out (sidebar logout is hidden on phones) */}
                <button className="mobile-signout" style={S.signOutBtn} onClick={handleLogout}>
                    SIGN OUT
                </button>
            </div>
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div style={S.infoItem}>
            <span style={S.infoLabel}>{label}</span>
            <span style={S.infoValue}>{value}</span>
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
    header: { marginBottom: 48 },
    profileMain: { display: "flex", alignItems: "center", gap: 32 },
    avatarLarge: { width: 120, height: 120, borderRadius: 32, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900, color: BRAND_BLUE, overflow: "hidden" },
    avatarWrapper: { position: "relative" },
    avatarEdit: { position: "absolute", bottom: -10, right: -10, width: 40, height: 40, borderRadius: "50%", background: BRAND_BLUE, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "4px solid #0d111a", fontSize: 16 },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    userMeta: { flex: 1 },
    name: { fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: -0.5 },
    roleBadge: { display: "inline-block", padding: "4px 12px", borderRadius: 8, background: "rgba(0,212,236,0.1)", color: BRAND_BLUE, fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
    email: { color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 500 },

    content: { display: "flex", flexDirection: "column", gap: 48 },
    section: { background: "rgba(30, 31, 35, 0.4)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.05)" },
    sectionTitle: { fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, marginBottom: 24 },
    
    infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 },
    infoItem: { display: "flex", flexDirection: "column", gap: 4 },
    infoLabel: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" },
    infoValue: { fontSize: 15, fontWeight: 600, color: "#fff" },

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

    signOutBtn: { width: "100%", padding: 16, borderRadius: 16, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 14, fontWeight: 800, letterSpacing: 1, cursor: "pointer", marginTop: 8 },
};
