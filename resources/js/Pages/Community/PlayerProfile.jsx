import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IconCamera, IconShield, IconPencil, IconTarget, IconStar, IconMapPin, IconCalendar, IconArrowUpRight, IconBarChart, IconUsers } from "../../Components/Icons";

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
            if (res.status === 401) {
                localStorage.removeItem("community_token");
                localStorage.removeItem("community_user");
                window.location.href = "/community";
                return;
            }
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                if (data.user) {
                    localStorage.setItem("community_user", JSON.stringify(data.user));
                }
            } else {
                setProfile(null);
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
            setProfile(null);
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

    const handleClubLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('club_logo', file);

        setLoading(true);
        try {
            const token = localStorage.getItem("community_token");
            const res = await fetch(`${API}/profile/logo`, {
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
            alert("Error uploading club logo");
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
                .avatar-hover-container {
                    position: relative;
                }
                .avatar-hover-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    opacity: 0;
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                    color: #fff;
                    border-radius: 29px;
                }
                .avatar-hover-container:hover .avatar-hover-overlay {
                    opacity: 1;
                }
                .logo-badge-wrapper {
                    position: absolute;
                    bottom: -6px;
                    right: -6px;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: var(--bg-surface-raised);
                    border: 3px solid var(--bg-base);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    overflow: hidden;
                    transition: transform 0.2s;
                    z-index: 10;
                }
                .logo-badge-wrapper:hover {
                    transform: scale(1.08);
                }
                .logo-badge-hover {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .logo-badge-wrapper:hover .logo-badge-hover {
                    opacity: 1;
                }
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
                        <div style={S.avatarRing}>
                            <div style={S.avatarLarge} className="avatar-hover-container">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" style={S.avatarImg} />
                                ) : (
                                    user.name[0].toUpperCase()
                                )}
                                <label className="avatar-hover-overlay">
                                    <input type="file" hidden onChange={handleAvatarUpload} accept="image/*" />
                                    <IconCamera size={22} />
                                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>CHANGE PHOTO</span>
                                </label>
                            </div>
                        </div>
                        <label className="logo-badge-wrapper">
                            <input type="file" hidden onChange={handleClubLogoUpload} accept="image/*" />
                            {user.club_logo ? (
                                <img src={user.club_logo} alt="Club Logo" style={S.logoBadgeImg} />
                            ) : (
                                <span style={S.logoPlaceholder}><IconShield size={18} /></span>
                            )}
                            <div className="logo-badge-hover">
                                <IconPencil size={14} />
                            </div>
                        </label>
                    </div>
                    <div style={S.userMeta}>
                        <div style={S.nameRow}>
                            <h1 style={S.name} className="profile-name">{user.name}</h1>
                            {user.vellar_id && (
                                <span style={S.vellarBadge}>
                                    <span style={S.vellarDot} />
                                    <span style={S.vellarText}>{user.vellar_id}</span>
                                </span>
                            )}
                        </div>
                        <p style={S.roleBadge}>{user.role?.toUpperCase()}</p>
                        <p style={S.email}>{user.email}</p>
                    </div>
                </div>
            </header>

            <div style={S.content}>
                {/* SECTION 1: Basic Info */}
                <section style={S.section}>
                    <h2 style={S.sectionTitle}>Basic information</h2>
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
                    <h2 style={S.sectionTitle}>{isOwner ? "Management stats" : "Performance overview"}</h2>
                    <div style={S.statsGrid} className="stats-grid">
                        {isOwner ? (
                            <>
                                <StatCard icon={<IconBarChart size={20} />} label="GAMES ORGANIZED" value={stats.total_organized} />
                                <StatCard icon={<IconUsers size={20} />} label="ACTIVE PLAYERS" value={stats.active_players} />
                            </>
                        ) : (
                            <>
                                <StatCard icon={<IconCalendar size={20} />} label="MATCHES" value={stats.total_matches} />
                                <StatCard icon={<IconTarget size={20} />} label="GOALS" value={stats.total_goals} />
                                <StatCard icon={<IconArrowUpRight size={20} />} label="ASSISTS" value={stats.total_assists} />
                                <StatCard icon={<IconStar size={20} />} label="AVG RATING" value={stats.avg_rating} featured />
                            </>
                        )}
                    </div>
                </section>

                {/* SECTION 3: Visual History (Graph) - Player Only */}
                {!isOwner && history && history.length > 0 && (
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>Performance graph</h2>
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
                                        contentStyle={{ background: '#17181c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
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
                        <h2 style={S.sectionTitle}>Match history</h2>
                        {history.length > 0 ? (
                            <div style={S.historyList}>
                                {history.map(m => (
                                    <div key={m.id} style={S.historyItem} className="history-item">
                                        <div style={S.historyDate}>{new Date(m.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</div>
                                        <div style={S.historyMain}>
                                            <div style={S.historyTitle}>{m.title}</div>
                                            <div style={S.historyVenue}><IconMapPin size={11} /> {m.venue}</div>
                                        </div>
                                        <div style={S.historyStats}>
                                            <span style={S.historyStatBadge}><IconTarget size={12} /> {m.goals}</span>
                                            <span style={{ ...S.historyStatBadge, ...S.historyStatBadgeAccent }}><IconStar size={12} /> {m.rating}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={S.emptyHistory}>
                                <div style={S.emptyHistoryIcon}><IconCalendar size={20} /></div>
                                <div style={S.emptyHistoryTitle}>No matches played yet</div>
                                <div style={S.emptyHistoryCaption}>Career stats and match history will appear here after your first official fixture.</div>
                            </div>
                        )}
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

function StatCard({ icon, label, value, featured }) {
    return (
        <div style={{ ...S.statCard, ...(featured ? S.statCardFeatured : {}) }}>
            <div style={{ ...S.statIcon, ...(featured ? S.statIconFeatured : {}) }}>{icon}</div>
            <div style={S.statVal}>{value}</div>
            <div style={S.statLabel}>{label}</div>
        </div>
    );
}

const S = {
    container: { maxWidth: 1000, margin: "0 auto", paddingBottom: 80 },
    header: { marginBottom: 48 },
    profileMain: { display: "flex", alignItems: "center", gap: 28 },

    avatarWrapper: { position: "relative" },
    avatarRing: { width: 120, height: 120, borderRadius: 32, background: "var(--accent-gradient)", padding: 3, flexShrink: 0 },
    avatarLarge: { width: "100%", height: "100%", borderRadius: 29, background: "var(--bg-surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 800, color: "var(--text-primary)", overflow: "hidden", position: "relative" },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    logoBadgeImg: { width: "100%", height: "100%", objectFit: "cover" },
    logoPlaceholder: { color: "var(--accent)", display: "flex" },

    userMeta: { flex: 1, minWidth: 0 },
    nameRow: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 },
    name: { fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: -0.5 },

    vellarBadge: { display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px 5px 9px", borderRadius: 999, background: "var(--bg-surface-raised)", border: "1px solid var(--border-default)" },
    vellarDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--accent-gradient)", flexShrink: 0 },
    vellarText: {
        fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6,
        backgroundImage: "var(--accent-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
    },

    roleBadge: { display: "inline-block", padding: "3px 10px", borderRadius: 6, background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, marginBottom: 8 },
    email: { color: "var(--text-muted)", fontSize: 13.5, fontWeight: 500 },

    content: { display: "flex", flexDirection: "column", gap: 24 },
    section: { background: "var(--bg-surface)", borderRadius: 20, padding: 32, border: "1px solid var(--border-subtle)" },
    sectionTitle: { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 22 },

    infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 22 },
    infoItem: { display: "flex", flexDirection: "column", gap: 4 },
    infoLabel: { fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
    infoValue: { fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" },

    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 },
    statCard: { background: "var(--bg-surface-raised)", borderRadius: 16, padding: "20px 18px", border: "1px solid var(--border-subtle)" },
    statCardFeatured: { borderColor: "rgba(99,102,241,0.35)" },
    statIcon: { color: "var(--text-muted)", marginBottom: 14 },
    statIconFeatured: { color: "var(--accent)" },
    statVal: { fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, fontVariantNumeric: "tabular-nums" },
    statLabel: { fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: 1 },

    graphCard: { paddingTop: 8 },

    historyList: { display: "flex", flexDirection: "column", gap: 10 },
    historyItem: { display: "flex", alignItems: "center", gap: 18, padding: "14px 18px", borderRadius: 14, background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)" },
    historyDate: { fontSize: 11.5, fontWeight: 800, color: "var(--text-muted)", width: 52, flexShrink: 0 },
    historyMain: { flex: 1, minWidth: 0 },
    historyTitle: { fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 },
    historyVenue: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" },
    historyStats: { display: "flex", gap: 8, flexShrink: 0 },
    historyStatBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", fontSize: 11.5, fontWeight: 800, color: "var(--text-primary)" },
    historyStatBadgeAccent: { color: "var(--accent)" },

    emptyHistory: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "36px 20px 24px", gap: 10 },
    emptyHistoryIcon: { width: 46, height: 46, borderRadius: "50%", background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" },
    emptyHistoryTitle: { fontSize: 14, fontWeight: 700, color: "var(--text-primary)" },
    emptyHistoryCaption: { fontSize: 12.5, color: "var(--text-muted)", maxWidth: 320, lineHeight: 1.55 },

    empty: { padding: 100, textAlign: "center", color: "var(--text-muted)", fontSize: 14 },

    signOutBtn: { width: "100%", padding: 16, borderRadius: 16, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 14, fontWeight: 800, letterSpacing: 1, cursor: "pointer", marginTop: 8 },
};
