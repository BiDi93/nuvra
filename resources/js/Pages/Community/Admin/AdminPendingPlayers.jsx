import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPendingPlayers = () => {
    const navigate = useNavigate();
    const [players, setPlayers]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [actionId, setActionId] = useState(null); // Which player is being actioned
    const [toast, setToast]       = useState(null);  // { type: 'success'|'error', msg }

    const token = localStorage.getItem('auth_token') || localStorage.getItem('community_token');

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPending = useCallback(async () => {
        try {
            const res = await axios.get('/api/community/admin/pending-players', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPlayers(res.data.players ?? []);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchPending();
    }, [fetchPending, token, navigate]);

    const handleApprove = async (player) => {
        setActionId(player.id);
        try {
            await axios.post(`/api/community/admin/approve-player/${player.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPlayers(prev => prev.filter(p => p.id !== player.id));
            showToast('success', `✅ ${player.name} (${player.vellar_id}) has been approved.`);
        } catch {
            showToast('error', 'Failed to approve player. Please try again.');
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (player) => {
        if (!window.confirm(`Reject and delete registration for ${player.name} (${player.vellar_id})?`)) return;
        setActionId(player.id);
        try {
            await axios.delete(`/api/community/admin/reject-player/${player.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPlayers(prev => prev.filter(p => p.id !== player.id));
            showToast('success', `🗑️ ${player.name} has been rejected and deleted.`);
        } catch {
            showToast('error', 'Failed to reject player. Please try again.');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div style={S.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                .player-card:hover { border-color: rgba(0,212,236,0.25) !important; transform: translateY(-1px); }
                .btn-approve:hover { background: #00bcd4 !important; }
                .btn-reject:hover { background: rgba(255,107,107,0.15) !important; }
            `}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    ...S.toast,
                    background: toast.type === 'success' ? 'rgba(0,212,100,0.12)' : 'rgba(255,107,107,0.12)',
                    borderColor: toast.type === 'success' ? 'rgba(0,212,100,0.3)' : 'rgba(255,107,107,0.3)',
                    color: toast.type === 'success' ? '#00D464' : '#ff6b6b',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Pending Player Approvals</h1>
                    <p style={S.subtitle}>
                        Review and approve new player registrations for the NUVRA ecosystem.
                    </p>
                </div>
                <div style={S.badge}>
                    {players.length} Pending
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={S.emptyState}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && players.length === 0 && (
                <div style={S.emptyState}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Pending Applications</h3>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>All player applications have been processed.</p>
                </div>
            )}

            {/* Players list */}
            {!loading && players.length > 0 && (
                <div style={S.list}>
                    {players.map(player => (
                        <div
                            key={player.id}
                            className="player-card"
                            style={S.card}
                        >
                            {/* Avatar placeholder */}
                            <div style={S.avatar}>
                                {player.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>

                            {/* Info */}
                            <div style={S.cardInfo}>
                                <div style={S.cardName}>{player.name}</div>
                                <div style={S.cardVellar}>{player.vellar_id}</div>
                                <div style={S.cardMeta}>
                                    {player.position && <span style={S.metaTag}>⚽ {player.position}</span>}
                                    {player.phone    && <span style={S.metaTag}>📞 {player.phone}</span>}
                                    <span style={S.metaTag}>
                                        🗓 {new Date(player.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={S.cardActions}>
                                <button
                                    className="btn-approve"
                                    style={S.btnApprove}
                                    onClick={() => handleApprove(player)}
                                    disabled={actionId === player.id}
                                >
                                    {actionId === player.id ? '…' : '✅ Approve'}
                                </button>
                                <button
                                    className="btn-reject"
                                    style={S.btnReject}
                                    onClick={() => handleReject(player)}
                                    disabled={actionId === player.id}
                                >
                                    ❌ Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Styles ─────────────────────────────────────────────────── */
const S = {
    root: {
        padding: '32px',
        fontFamily: "'Inter', sans-serif",
        color: '#fff',
        maxWidth: 860,
        margin: '0 auto',
    },
    toast: {
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        padding: '12px 20px', borderRadius: 12, border: '1px solid',
        fontSize: 14, fontWeight: 600, animation: 'fadeIn 0.3s ease',
        backdropFilter: 'blur(12px)',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 32,
    },
    title: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 32, fontWeight: 900, letterSpacing: 0.5, marginBottom: 6, color: '#fff',
    },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 },
    badge: {
        background: 'rgba(251,191,36,0.12)',
        border: '1px solid rgba(251,191,36,0.3)',
        color: '#FBBF24', fontSize: 13, fontWeight: 700,
        padding: '6px 16px', borderRadius: 20,
    },
    emptyState: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
    },
    list: { display: 'flex', flexDirection: 'column', gap: 12 },
    card: {
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '16px 20px',
        transition: 'border-color 0.2s, transform 0.15s',
    },
    avatar: {
        width: 48, height: 48, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(0,212,236,0.3), rgba(208,64,239,0.3))',
        border: '1px solid rgba(0,212,236,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 800, color: '#00D4EC',
        flexShrink: 0,
    },
    cardInfo: { flex: 1, minWidth: 0 },
    cardName: { fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 },
    cardVellar: { fontSize: 12, fontWeight: 700, color: '#00D4EC', letterSpacing: 1, marginBottom: 8 },
    cardMeta: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    metaTag: {
        fontSize: 11, color: 'rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6, padding: '2px 8px',
    },
    cardActions: { display: 'flex', gap: 8, flexShrink: 0 },
    btnApprove: {
        padding: '8px 16px', borderRadius: 10, border: 'none',
        background: '#00D4EC', color: '#080810',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'background 0.2s',
    },
    btnReject: {
        padding: '8px 16px', borderRadius: 10,
        background: 'rgba(255,107,107,0.08)',
        border: '1px solid rgba(255,107,107,0.2)',
        color: '#ff6b6b',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'background 0.2s',
    },
};

export default AdminPendingPlayers;
