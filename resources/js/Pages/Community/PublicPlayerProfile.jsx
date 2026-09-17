import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    IconChevronLeft, IconCalendar, IconTarget, IconArrowUpRight,
    IconStar, IconMapPin, IconPencil, IconShield, IconCheck, IconX
} from "../../Components/Icons";

const API = "/api/community";
const BRAND_BLUE = "#00D4EC";

export default function PublicPlayerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Admin edit stats modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        total_matches: 0,
        total_goals: 0,
        total_assists: 0,
        avg_rating: 0,
        clean_sheets: 0,
        position: "",
        vellar_id: "",
        club_name: ""
    });
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState({ error: null, success: null });

    const storedUser = localStorage.getItem("community_user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const isAdmin = currentUser?.role === "admin";

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");
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

    const openEditModal = () => {
        if (!profile) return;
        setEditForm({
            total_matches: profile.stats?.total_matches ?? 0,
            total_goals: profile.stats?.total_goals ?? 0,
            total_assists: profile.stats?.total_assists ?? 0,
            avg_rating: profile.stats?.avg_rating ?? 0.0,
            clean_sheets: profile.stats?.clean_sheets ?? 0,
            position: profile.user?.position || "",
            vellar_id: profile.user?.vellar_id || "",
            club_name: profile.user?.club_name || ""
        });
        setSaveStatus({ error: null, success: null });
        setShowEditModal(true);
    };

    const handleSaveStats = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveStatus({ error: null, success: null });
        try {
            const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");
            const res = await fetch(`${API}/admin/players/${id}/stats`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    total_matches: parseInt(editForm.total_matches, 10) || 0,
                    total_goals: parseInt(editForm.total_goals, 10) || 0,
                    total_assists: parseInt(editForm.total_assists, 10) || 0,
                    avg_rating: parseFloat(editForm.avg_rating) || 0.0,
                    clean_sheets: parseInt(editForm.clean_sheets, 10) || 0,
                    position: editForm.position,
                    vellar_id: editForm.vellar_id,
                    club_name: editForm.club_name,
                })
            });
            const resData = await res.json();
            if (res.ok) {
                setProfile(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        ...(resData.user || {}),
                        position: editForm.position,
                        vellar_id: editForm.vellar_id,
                        club_name: editForm.club_name
                    },
                    stats: {
                        ...prev.stats,
                        ...(resData.stats || {})
                    }
                }));
                setSaveStatus({ error: null, success: "Statistics updated successfully!" });
                setTimeout(() => {
                    setShowEditModal(false);
                }, 700);
            } else {
                setSaveStatus({ error: resData.message || "Failed to update statistics.", success: null });
            }
        } catch (err) {
            setSaveStatus({ error: "Network error updating statistics.", success: null });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <PageLoader />;
    if (error || !profile || !profile.user) {
        return (
            <div style={S.container}>
                <button style={S.backBtn} onClick={() => navigate("/community/members")}>
                    <IconChevronLeft size={14} /> Back to Members
                </button>
                <div style={S.empty}>{error || "Player not found."}</div>
            </div>
        );
    }

    const { user, stats = {}, history = [] } = profile;

    return (
        <div style={S.container}>
            <style>{`
                .edit-stats-btn:hover {
                    background: #00D4EC !important;
                    color: #0b0f19 !important;
                    box-shadow: 0 0 20px rgba(0, 212, 236, 0.4);
                }
                .modal-input:focus {
                    border-color: #00D4EC !important;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 212, 236, 0.15);
                }
            `}</style>

            <div style={S.topBar}>
                <button style={S.backBtn} onClick={() => navigate("/community/members")}>
                    <IconChevronLeft size={14} /> Back to Members
                </button>
                {isAdmin && (
                    <button style={S.adminEditBtn} className="edit-stats-btn" onClick={openEditModal}>
                        <IconPencil size={14} /> MODIFY PLAYER STATS
                    </button>
                )}
            </div>

            <header style={S.header}>
                <div style={S.profileMain}>
                    <div style={S.avatarWrapper}>
                        <div style={S.avatarRing}>
                            <div style={S.avatarLarge}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" style={S.avatarImg} />
                                ) : (
                                    (user.name || "U")[0].toUpperCase()
                                )}
                            </div>
                        </div>
                        {user.club_logo && (
                            <div style={S.logoBadgeWrapper}>
                                <img src={user.club_logo} alt="Club Logo" style={S.logoBadgeImg} />
                            </div>
                        )}
                    </div>
                    <div style={S.userMeta}>
                        <div style={S.nameRow}>
                            <h1 style={S.name}>{user.name}</h1>
                            {user.vellar_id && (
                                <span style={S.vellarBadge}>
                                    <span style={S.vellarDot} />
                                    <span style={S.vellarText}>{user.vellar_id}</span>
                                </span>
                            )}
                        </div>
                        <div style={S.metaRow}>
                            {user.role && <span style={S.roleBadge}>{user.role.toUpperCase()}</span>}
                            {user.position && (
                                <>
                                    <span style={S.metaSep}>·</span>
                                    <span>{user.position}</span>
                                </>
                            )}
                            {user.club_name && (
                                <>
                                    <span style={S.metaSep}>·</span>
                                    <span>{user.club_name}</span>
                                </>
                            )}
                        </div>
                        <p style={S.joined}>Registered member · Joined {user.joined || "2026"}</p>
                    </div>
                </div>
            </header>

            <div style={S.content}>
                {/* SECTION 1: Stats */}
                <section style={S.section}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                        <h2 style={S.sectionTitle}>Career stats</h2>
                        {isAdmin && (
                            <button
                                onClick={openEditModal}
                                style={S.sectionEditBtn}
                            >
                                <IconPencil size={12} /> Edit Stats
                            </button>
                        )}
                    </div>
                    <div style={S.statsGrid}>
                        <StatCard icon={<IconCalendar size={20} />} label="MATCHES" value={stats.total_matches ?? 0} />
                        <StatCard icon={<IconTarget size={20} />} label="GOALS" value={stats.total_goals ?? 0} />
                        <StatCard icon={<IconArrowUpRight size={20} />} label="ASSISTS" value={stats.total_assists ?? 0} />
                        <StatCard icon={<IconShield size={20} />} label="CLEAN SHEETS" value={stats.clean_sheets ?? 0} />
                        <StatCard icon={<IconStar size={20} />} label="AVG RATING" value={stats.avg_rating ?? 0} featured />
                    </div>
                </section>

                {/* SECTION 2: Graph */}
                {history && history.length > 0 ? (
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>Performance trend</h2>
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
                                        contentStyle={{ background: '#17181c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
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
                    <h2 style={S.sectionTitle}>Recent games</h2>
                    {history && history.length > 0 ? (
                        <div style={S.historyList}>
                            {[...history].reverse().map(m => (
                                <div key={m.id} style={S.historyItem}>
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
                            <div style={S.emptyHistoryCaption}>Match history and ratings will appear here once this player features in an official fixture.</div>
                        </div>
                    )}
                </section>
            </div>

            {/* MODAL: ADMIN EDIT PLAYER STATS */}
            {showEditModal && (
                <div style={S.modalOverlay} onClick={() => !saving && setShowEditModal(false)}>
                    <div style={S.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={S.modalHeader}>
                            <div>
                                <div style={S.modalBadge}>ADMIN ACTION</div>
                                <h3 style={S.modalTitle}>Modify Player Statistics & Info</h3>
                                <p style={S.modalSub}>Editing official records for <strong>{user.name}</strong></p>
                            </div>
                            <button
                                type="button"
                                style={S.modalCloseBtn}
                                onClick={() => !saving && setShowEditModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveStats}>
                            {/* Performance Stats */}
                            <div style={S.modalSection}>
                                <div style={S.modalSectionTitle}>Career Performance Statistics</div>
                                <div style={S.formGrid}>
                                    <div>
                                        <label style={S.formLabel}>Matches Played</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.total_matches}
                                            onChange={(e) => setEditForm({ ...editForm, total_matches: e.target.value })}
                                            style={S.formInput}
                                            className="modal-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={S.formLabel}>Total Goals</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.total_goals}
                                            onChange={(e) => setEditForm({ ...editForm, total_goals: e.target.value })}
                                            style={S.formInput}
                                            className="modal-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={S.formLabel}>Total Assists</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.total_assists}
                                            onChange={(e) => setEditForm({ ...editForm, total_assists: e.target.value })}
                                            style={S.formInput}
                                            className="modal-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={S.formLabel}>Clean Sheets</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.clean_sheets}
                                            onChange={(e) => setEditForm({ ...editForm, clean_sheets: e.target.value })}
                                            style={S.formInput}
                                            className="modal-input"
                                        />
                                    </div>
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={S.formLabel}>Average Rating (0.0 – 10.0)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="10"
                                            value={editForm.avg_rating}
                                            onChange={(e) => setEditForm({ ...editForm, avg_rating: e.target.value })}
                                            style={S.formInput}
                                            className="modal-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* League Attributes */}
                            <div style={S.modalSection}>
                                <div style={S.modalSectionTitle}>Player League Attributes</div>
                                <div style={S.formGrid}>
                                    <div>
                                        <label style={S.formLabel}>Playing Position</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Striker, Midfielder, CB"
                                            value={editForm.position}
                                            onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                                            style={S.formInput}
                                            className="modal-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={S.formLabel}>Vellar ID</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. VELLAR 82"
                                            value={editForm.vellar_id}
                                            onChange={(e) => setEditForm({ ...editForm, vellar_id: e.target.value })}
                                            style={S.formInput}
                                            className="modal-input"
                                        />
                                    </div>
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={S.formLabel}>Club / Team Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Amigos FC"
                                            value={editForm.club_name}
                                            onChange={(e) => setEditForm({ ...editForm, club_name: e.target.value })}
                                            style={S.formInput}
                                            className="modal-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {saveStatus.error && (
                                <div style={S.alertError}>
                                    <IconX size={14} /> {saveStatus.error}
                                </div>
                            )}
                            {saveStatus.success && (
                                <div style={S.alertSuccess}>
                                    <IconCheck size={14} /> {saveStatus.success}
                                </div>
                            )}

                            <div style={S.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={saving}
                                    style={S.modalCancelBtn}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={S.modalSubmitBtn}
                                >
                                    {saving ? "Saving Changes..." : "Save Statistics"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32,
    },
    backBtn: {
        display: "inline-flex", alignItems: "center", gap: 6,
        background: 'none', border: 'none', color: 'var(--text-dim)',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0,
    },
    adminEditBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 16px",
        borderRadius: 10,
        background: "rgba(0, 212, 236, 0.12)",
        color: BRAND_BLUE,
        border: "1px solid rgba(0, 212, 236, 0.3)",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.5,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    sectionEditBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 8,
        background: "rgba(255, 255, 255, 0.05)",
        color: BRAND_BLUE,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
    },
    header: { marginBottom: 40 },
    profileMain: { display: "flex", alignItems: "center", gap: 28 },

    avatarWrapper: { position: "relative" },
    avatarRing: { width: 120, height: 120, borderRadius: 32, background: "var(--accent-gradient)", padding: 3, flexShrink: 0 },
    avatarLarge: { width: "100%", height: "100%", borderRadius: 29, background: "var(--bg-surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 800, color: "var(--text-primary)", overflow: "hidden" },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    logoBadgeWrapper: { position: "absolute", bottom: -6, right: -6, width: 48, height: 48, borderRadius: "50%", background: "var(--bg-surface-raised)", border: "3px solid var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: 10 },
    logoBadgeImg: { width: "100%", height: "100%", objectFit: "cover" },

    userMeta: { flex: 1, minWidth: 0 },
    nameRow: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 },
    name: { fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: -0.5 },

    vellarBadge: { display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px 5px 9px", borderRadius: 999, background: "var(--bg-surface-raised)", border: "1px solid var(--border-default)" },
    vellarDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--accent-gradient)", flexShrink: 0 },
    vellarText: {
        fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6,
        backgroundImage: "var(--accent-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
    },

    metaRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13.5, color: "var(--text-dim)", fontWeight: 500, marginBottom: 10 },
    metaSep: { color: "var(--text-muted)" },
    roleBadge: { display: "inline-block", padding: "3px 10px", borderRadius: 6, background: "var(--bg-surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5 },

    joined: { color: "var(--text-muted)", fontSize: 12.5, fontWeight: 500, margin: 0 },

    content: { display: "flex", flexDirection: "column", gap: 24 },
    section: { background: "var(--bg-surface)", borderRadius: 20, padding: 32, border: "1px solid var(--border-subtle)" },
    sectionTitle: { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.6, textTransform: "uppercase", margin: 0 },

    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 },
    statCard: { background: "var(--bg-surface-raised)", borderRadius: 16, padding: "20px 18px", border: "1px solid var(--border-subtle)", position: "relative", overflow: "hidden" },
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

    /* MODAL STYLES */
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
    },
    modalContent: {
        background: "#161b26",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 20,
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "28px 28px 24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        paddingBottom: 16,
    },
    modalBadge: {
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1,
        color: BRAND_BLUE,
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 800,
        color: "#fff",
        margin: 0,
    },
    modalSub: {
        fontSize: 12.5,
        color: "rgba(255, 255, 255, 0.5)",
        marginTop: 4,
    },
    modalCloseBtn: {
        background: "none",
        border: "none",
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 16,
        cursor: "pointer",
        padding: 4,
    },
    modalSection: {
        marginBottom: 20,
    },
    modalSectionTitle: {
        fontSize: 11,
        fontWeight: 800,
        color: "rgba(255, 255, 255, 0.4)",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
    },
    formLabel: {
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: "rgba(255, 255, 255, 0.6)",
        marginBottom: 6,
    },
    formInput: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        boxSizing: "border-box",
        transition: "border-color 0.2s, box-shadow 0.2s",
    },
    alertError: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#ef4444",
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 16,
    },
    alertSuccess: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(34, 197, 94, 0.15)",
        border: "1px solid rgba(34, 197, 94, 0.3)",
        color: "#22c55e",
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 16,
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 24,
        paddingTop: 16,
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    },
    modalCancelBtn: {
        padding: "10px 18px",
        borderRadius: 10,
        background: "rgba(255, 255, 255, 0.06)",
        border: "none",
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
    },
    modalSubmitBtn: {
        padding: "10px 22px",
        borderRadius: 10,
        background: "var(--accent-gradient)",
        border: "none",
        color: "#0b0f19",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
    },
};
