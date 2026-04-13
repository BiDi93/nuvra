import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PendingRequests = ({ coachId, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const [acting, setActing]     = useState(null); // playerId being actioned
    const token = localStorage.getItem('auth_token');

    useEffect(() => {
        if (!coachId) return;
        axios.get(`/api/coach/${coachId}/requests`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setRequests(res.data))
            .catch(err => console.error('Error fetching pending requests:', err));
    }, [coachId, token]);

    const handleAction = async (playerId, action) => {
        setActing(playerId);
        const prev = [...requests];
        setRequests(r => r.filter(p => p.id !== playerId)); // optimistic

        try {
            await axios.post(`/api/coach/${coachId}/request/${playerId}`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onActionComplete) onActionComplete();
        } catch {
            setRequests(prev); // rollback
        } finally {
            setActing(null);
        }
    };

    if (requests.length === 0) return null;

    return (
        <div style={S.wrap}>
            {/* Header */}
            <div style={S.header}>
                <div style={S.headerLeft}>
                    <div style={S.badge}>{requests.length}</div>
                    <span style={S.title}>PENDING APPROVALS</span>
                </div>
                <span style={S.hint}>Review players who applied to join your team</span>
            </div>

            {/* Cards */}
            <div style={S.list}>
                {requests.map(player => (
                    <div key={player.id} style={S.card}>
                        {/* Left accent */}
                        <div style={S.cardAccent} />

                        {/* Avatar */}
                        <div style={S.avatar}>
                            <img
                                src={player.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1a1a2e&color=a78bfa&size=80`}
                                alt={player.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            />
                        </div>

                        {/* Info */}
                        <div style={S.info}>
                            <p style={S.playerName}>{player.name}</p>
                            <div style={S.tags}>
                                {player.position && <span style={S.tag}>{player.position}</span>}
                                {player.jersey_number && <span style={{ ...S.tag, color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>#{player.jersey_number}</span>}
                                {player.date_of_birth && <span style={{ ...S.tag, color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>{calcAge(player.date_of_birth)} yrs</span>}
                            </div>
                            <p style={S.email}>{player.email}</p>
                        </div>

                        {/* Actions */}
                        <div style={S.actions}>
                            <button
                                style={{ ...S.btn, ...S.declineBtn }}
                                onClick={() => handleAction(player.id, 'decline')}
                                disabled={acting === player.id}
                            >
                                Decline
                            </button>
                            <button
                                style={{ ...S.btn, ...S.approveBtn, opacity: acting === player.id ? 0.7 : 1 }}
                                onClick={() => handleAction(player.id, 'approve')}
                                disabled={acting === player.id}
                            >
                                {acting === player.id ? '…' : 'Approve'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

function calcAge(dob) {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

const S = {
    wrap: {
        marginBottom: 32,
        border: '1px solid rgba(251,191,36,0.15)',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'rgba(251,191,36,0.03)',
    },

    /* Header */
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(251,191,36,0.1)',
        background: 'rgba(251,191,36,0.04)',
    },
    headerLeft: {
        display: 'flex', alignItems: 'center', gap: 10,
    },
    badge: {
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(251,191,36,0.2)',
        border: '1px solid rgba(251,191,36,0.4)',
        color: '#FBBF24',
        fontSize: 11, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    title: {
        fontSize: 11, fontWeight: 800,
        letterSpacing: 2, color: '#FBBF24',
    },
    hint: {
        fontSize: 11, color: 'rgba(255,255,255,0.25)',
    },

    /* List */
    list: {
        display: 'flex', flexDirection: 'column',
    },

    /* Card */
    card: {
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.15s',
    },
    cardAccent: {
        width: 3, alignSelf: 'stretch', flexShrink: 0,
        background: 'linear-gradient(180deg, #FBBF24, #F59E0B)',
        borderRadius: 2,
    },
    avatar: {
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        border: '2px solid rgba(255,255,255,0.08)',
        overflow: 'hidden', flexShrink: 0,
    },
    info: {
        flex: 1, minWidth: 0,
    },
    playerName: {
        fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 5,
    },
    tags: {
        display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4,
    },
    tag: {
        fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
        padding: '2px 8px', borderRadius: 4,
        color: '#a78bfa',
        background: 'rgba(167,139,250,0.1)',
        border: '1px solid rgba(167,139,250,0.2)',
        textTransform: 'uppercase',
    },
    email: {
        fontSize: 11, color: 'rgba(255,255,255,0.25)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },

    /* Buttons */
    actions: {
        display: 'flex', gap: 8, flexShrink: 0,
    },
    btn: {
        padding: '8px 16px', borderRadius: 8,
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit', border: 'none',
        transition: 'opacity 0.15s',
    },
    approveBtn: {
        background: 'linear-gradient(135deg, #00D4EC, #D040EF)',
        color: '#080810',
    },
    declineBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.4)',
    },
};

export default PendingRequests;
