import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WaitingRoom = () => {
    const navigate  = useNavigate();
    const [player, setPlayer]     = useState(null);
    const [checking, setChecking] = useState(false);

    const fetchStatus = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) { navigate('/login'); return; }

        try {
            const res = await axios.get('/api/player/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const profile = res.data.profile || res.data;
            setPlayer(profile);

            if (profile?.status === 'active') {
                localStorage.setItem('player_status', 'active');
                navigate('/dashboard');
            }
        } catch (err) {
            // Only kick to login on 401 (expired/invalid token)
            // For 404 or other errors, stay on the page
            if (err.response?.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('player_status');
                navigate('/login');
            }
        }
    }, [navigate]);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const handleCheckStatus = async () => {
        setChecking(true);
        await fetchStatus();
        setChecking(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('player_status');
        navigate('/login');
    };

    const teamName  = player?.coach?.team_name ?? '—';
    const coachName = player?.coach?.name      ?? '—';

    return (
        <div style={S.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                @keyframes pulse-ring {
                    0%   { transform: scale(1);   opacity: 0.6; }
                    70%  { transform: scale(1.5); opacity: 0; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .pulse-ring {
                    position: absolute; inset: -8px; border-radius: 50%;
                    border: 2px solid rgba(251,191,36,0.5);
                    animation: pulse-ring 2s ease-out infinite;
                }
                .spin { animation: spin 0.8s linear infinite; }
            `}</style>

            {/* ── Top bar ── */}
            <div style={S.topBar}>
                <img
                    src="/images/logoImage/NUVRA_LOGO.png"
                    alt="NUVRA"
                    style={S.logoImg}
                    onClick={() => navigate('/')}
                />
                <button style={S.logoutBtn} onClick={handleLogout}>
                    Sign Out
                </button>
            </div>

            {/* ── Main content ── */}
            <div style={S.content}>

                {/* Status icon */}
                <div style={S.iconWrap}>
                    <div className="pulse-ring" />
                    <div className="pulse-ring" style={{ animationDelay: '0.5s' }} />
                    <div style={S.iconCircle}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <h1 style={S.title}>Application Pending</h1>
                <p style={S.subtitle}>
                    {player?.name
                        ? <>Hey <strong style={{ color: '#fff' }}>{player.name}</strong>, your application is under review.</>
                        : 'Your application is under review.'}
                </p>

                {/* Info card */}
                <div style={S.infoCard}>
                    <InfoRow label="Team" value={teamName} />
                    <InfoRow label="Coach" value={coachName} />
                    <InfoRow label="Position" value={player?.position ?? '—'} />
                    <InfoRow label="Status" value={
                        <span style={S.statusBadge}>Pending Review</span>
                    } />
                </div>

                {/* Progress steps */}
                <div style={S.steps}>
                    <Step label="Account Created" done />
                    <StepConnector done />
                    <Step label="Application Submitted" done />
                    <StepConnector />
                    <Step label="Coach Approval" active />
                    <StepConnector />
                    <Step label="Access Granted" />
                </div>

                {/* CTA */}
                <button
                    style={{ ...S.checkBtn, opacity: checking ? 0.7 : 1 }}
                    onClick={handleCheckStatus}
                    disabled={checking}
                >
                    {checking
                        ? <><span className="spin" style={S.spinner} />Checking…</>
                        : 'Check Approval Status'}
                </button>

                <p style={S.note}>
                    Your coach will receive a notification to review your request.<br />
                    Reach out to them directly if this is taking too long.
                </p>
            </div>
        </div>
    );
};

/* ── Sub-components ─────────────────────────────────────────── */

function InfoRow({ label, value }) {
    return (
        <div style={S.infoRow}>
            <span style={S.infoLabel}>{label}</span>
            <span style={S.infoValue}>{value}</span>
        </div>
    );
}

function Step({ label, done = false, active = false }) {
    return (
        <div style={S.stepItem}>
            <div style={{
                ...S.stepDot,
                ...(done   ? S.stepDotDone   : {}),
                ...(active ? S.stepDotActive : {}),
            }}>
                {done ? '✓' : ''}
            </div>
            <span style={{
                ...S.stepLabel,
                color: done ? 'rgba(255,255,255,0.5)' : active ? '#fff' : 'rgba(255,255,255,0.2)',
                fontWeight: active ? 700 : 500,
            }}>
                {label}
            </span>
        </div>
    );
}

function StepConnector({ done = false }) {
    return <div style={{ ...S.stepLine, background: done ? 'rgba(0,212,236,0.4)' : 'rgba(255,255,255,0.07)' }} />;
}

/* ── Styles ─────────────────────────────────────────────────── */
const S = {
    root: {
        minHeight: '100vh',
        background: '#080810',
        fontFamily: "'Inter', sans-serif",
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
    },

    /* Top bar */
    topBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    logoImg: { width: 120, objectFit: 'contain', cursor: 'pointer' },
    logoutBtn: {
        background: 'none', border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600,
        padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.2s',
    },

    /* Content */
    content: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 24,
    },

    /* Icon */
    iconWrap: {
        position: 'relative',
        width: 72, height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    iconCircle: {
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(251,191,36,0.1)',
        border: '1px solid rgba(251,191,36,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },

    /* Text */
    title: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 40, fontWeight: 900, letterSpacing: 1,
    },
    subtitle: {
        fontSize: 15, color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', lineHeight: 1.6, maxWidth: 380,
    },

    /* Info card */
    infoCard: {
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, overflow: 'hidden',
    },
    infoRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    infoLabel: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 },
    infoValue: { fontSize: 14, fontWeight: 600, color: '#fff' },
    statusBadge: {
        display: 'inline-block',
        padding: '3px 10px', borderRadius: 20,
        background: 'rgba(251,191,36,0.12)',
        border: '1px solid rgba(251,191,36,0.25)',
        color: '#FBBF24', fontSize: 12, fontWeight: 700,
    },

    /* Steps */
    steps: {
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '20px 24px',
        width: '100%', maxWidth: 480,
    },
    stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '0 0 auto' },
    stepDot: {
        width: 30, height: 30, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)',
    },
    stepDotDone: {
        background: 'rgba(0,212,236,0.1)',
        border: '1px solid rgba(0,212,236,0.3)',
        color: '#00D4EC',
    },
    stepDotActive: {
        background: 'rgba(251,191,36,0.15)',
        border: '1px solid rgba(251,191,36,0.4)',
        color: '#FBBF24',
    },
    stepLabel: { fontSize: 10, fontWeight: 500, textAlign: 'center', maxWidth: 70, lineHeight: 1.3 },
    stepLine: { flex: 1, height: 1, minWidth: 20 },

    /* Button */
    checkBtn: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '13px 28px', borderRadius: 12, border: 'none',
        background: 'linear-gradient(135deg, #00D4EC, #D040EF)',
        color: '#080810', fontSize: 14, fontWeight: 800,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'opacity 0.2s',
    },
    spinner: {
        display: 'inline-block', width: 14, height: 14,
        border: '2px solid rgba(8,8,16,0.3)',
        borderTopColor: '#080810', borderRadius: '50%',
    },

    /* Note */
    note: {
        fontSize: 12, color: 'rgba(255,255,255,0.2)',
        textAlign: 'center', lineHeight: 1.7, maxWidth: 360,
    },
};

export default WaitingRoom;
