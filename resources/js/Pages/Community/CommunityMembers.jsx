import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";
import { IconSearch, IconPencil, IconX, IconCheck } from "../../Components/Icons";

const API = "/api/community";
const BRAND_BLUE = "#00D4EC";

export default function CommunityMembers() {
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Admin edit state
    const [selectedMember, setSelectedMember] = useState(null);
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

    const openEditModal = async (member, e) => {
        if (e) e.stopPropagation();
        setSelectedMember(member);
        setEditForm({
            total_matches: member.games ?? 0,
            total_goals: member.goals ?? 0,
            total_assists: member.assists ?? 0,
            avg_rating: member.rating ?? 0.0,
            clean_sheets: 0,
            position: member.position || "",
            vellar_id: member.vellar_id || "",
            club_name: member.club_name || ""
        });
        setSaveStatus({ error: null, success: null });

        // Fetch full profile for detailed current stats if needed
        try {
            const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");
            const res = await fetch(`${API}/members/${member.id}`, {
                headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.stats) {
                    setEditForm(prev => ({
                        ...prev,
                        total_matches: data.stats.total_matches ?? prev.total_matches,
                        total_goals: data.stats.total_goals ?? prev.total_goals,
                        total_assists: data.stats.total_assists ?? prev.total_assists,
                        avg_rating: data.stats.avg_rating ?? prev.avg_rating,
                        clean_sheets: data.stats.clean_sheets ?? 0,
                        position: data.user?.position ?? prev.position,
                        vellar_id: data.user?.vellar_id ?? prev.vellar_id,
                        club_name: data.user?.club_name ?? prev.club_name,
                    }));
                }
            }
        } catch { /* use current row values */ }
    };

    const handleSaveStats = async (e) => {
        e.preventDefault();
        if (!selectedMember) return;
        setSaving(true);
        setSaveStatus({ error: null, success: null });
        try {
            const token = localStorage.getItem("community_token") || localStorage.getItem("auth_token");
            const res = await fetch(`${API}/admin/players/${selectedMember.id}/stats`, {
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
                // Update in member list
                setMembers(prev => prev.map(m => {
                    if (m.id === selectedMember.id) {
                        return {
                            ...m,
                            games: parseInt(editForm.total_matches, 10) || 0,
                            goals: parseInt(editForm.total_goals, 10) || 0,
                            assists: parseInt(editForm.total_assists, 10) || 0,
                            rating: parseFloat(editForm.avg_rating) || 0.0,
                            position: editForm.position,
                            vellar_id: editForm.vellar_id,
                            club_name: editForm.club_name,
                        };
                    }
                    return m;
                }));
                setSaveStatus({ error: null, success: "Stats updated successfully!" });
                setTimeout(() => {
                    setSelectedMember(null);
                }, 700);
            } else {
                setSaveStatus({ error: resData.message || "Failed to update stats.", success: null });
            }
        } catch {
            setSaveStatus({ error: "Network error updating stats.", success: null });
        } finally {
            setSaving(false);
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
                .quick-edit-btn:hover { background: #00D4EC !important; color: #0b0f19 !important; }
                .modal-input:focus {
                    border-color: #00D4EC !important;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 212, 236, 0.15);
                }
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

                            {isAdmin && (
                                <div style={S.adminCardAction}>
                                    <button
                                        style={S.quickEditBtn}
                                        className="quick-edit-btn"
                                        onClick={(e) => openEditModal(m, e)}
                                    >
                                        <IconPencil size={12} /> Edit Stats
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL: ADMIN EDIT PLAYER STATS */}
            {selectedMember && (
                <div style={S.modalOverlay} onClick={() => !saving && setSelectedMember(null)}>
                    <div style={S.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={S.modalHeader}>
                            <div>
                                <div style={S.modalBadge}>ADMIN ACTION</div>
                                <h3 style={S.modalTitle}>Modify Player Statistics & Info</h3>
                                <p style={S.modalSub}>Editing records for <strong>{selectedMember.name}</strong></p>
                            </div>
                            <button
                                type="button"
                                style={S.modalCloseBtn}
                                onClick={() => !saving && setSelectedMember(null)}
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
                                    onClick={() => setSelectedMember(null)}
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
        position: "relative",
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
    adminCardAction: {
        marginTop: 14,
        width: "100%",
        display: "flex",
        justifyContent: "center",
    },
    quickEditBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 8,
        background: "rgba(0, 212, 236, 0.1)",
        color: BRAND_BLUE,
        border: "1px solid rgba(0, 212, 236, 0.25)",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.15s ease",
    },
    emptyState: { padding: "100px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14, fontWeight: 600 },

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
        textAlign: "left",
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
