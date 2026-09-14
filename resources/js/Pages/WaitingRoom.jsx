import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const WaitingRoom = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const [player, setPlayer]         = useState(null);
    const [checking, setChecking]     = useState(false);
    const [lastChecked, setLastChecked] = useState(null);
    const pollRef = useRef(null);

    // Get vellar_id passed from signup or stored
    const vellarId = location.state?.vellar_id
        ?? location.state?.vellar_number
        ?? localStorage.getItem('pending_vellar_id')
        ?? '';

    const checkStatus = useCallback(async () => {
        if (!vellarId) return;

        try {
            const res = await axios.post('/api/community/check-status', { vellar_id: vellarId });
            const data = res.data;
            setPlayer(data);
            setLastChecked(new Date());

            if (data.status === 'active') {
                // Approved! Redirect to login
                localStorage.removeItem('pending_vellar_id');
                navigate('/login', {
                    state: { message: `✅ Akaun anda telah diluluskan! Log masuk dengan Vellar ID ${vellarId}.` }
                });
            }
        } catch {
            // If no vellar_id, just show generic pending screen
        }
    }, [vellarId, navigate]);

    // Save vellar_id to localStorage
    useEffect(() => {
        if (vellarId) localStorage.setItem('pending_vellar_id', String(vellarId));
    }, [vellarId]);

    // Initial check + auto poll every 30 seconds
    useEffect(() => {
        checkStatus();
        pollRef.current = setInterval(checkStatus, 30000);
        return () => clearInterval(pollRef.current);
    }, [checkStatus]);

    const handleCheckNow = async () => {
        setChecking(true);
        await checkStatus();
        setChecking(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('pending_vellar_id');
        navigate('/login');
    };

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
                @keyframes spin { to { transform: rotate(360deg); } }
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
                    src="/images/logoImage/NUVRA_LOGO.webp"
                    alt="NUVRA"
                    style={S.logoImg}
                    onClick={() => navigate('/')}
                />
                <button style={S.logoutBtn} onClick={handleLogout}>
                    Keluar
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
                <h1 style={S.title}>Menunggu Kelulusan Admin</h1>
                <p style={S.subtitle}>
                    {player?.name
                        ? <>Hai <strong style={{ color: '#fff' }}>{player.name}</strong>, permohonan anda sedang disemak oleh admin NUVRA.</>
                        : 'Permohonan anda sedang disemak oleh admin NUVRA.'}
                </p>

                {/* Info card */}
                {(vellarId || player) && (
                    <div style={S.infoCard}>
                        <InfoRow label="Vellar ID" value={player?.vellar_id ?? `VELLAR ${vellarId}`} highlight />
                        {player?.position && <InfoRow label="Posisi" value={player.position} />}
                        <InfoRow label="Status" value={
                            <span style={S.statusBadge}>⏳ Menunggu Kelulusan</span>
                        } />
                        {lastChecked && (
                            <InfoRow label="Semakan Terakhir" value={lastChecked.toLocaleTimeString('ms-MY')} />
                        )}
                    </div>
                )}

                {/* Progress steps */}
                <div style={S.steps}>
                    <Step label="Akaun Dicipta" done />
                    <StepConnector done />
                    <Step label="Vellar ID Dijana" done />
                    <StepConnector />
                    <Step label="Kelulusan Admin" active />
                    <StepConnector />
                    <Step label="Akses Diberikan" />
                </div>

                {/* CTA */}
                <button
                    style={{ ...S.checkBtn, opacity: checking ? 0.7 : 1 }}
                    onClick={handleCheckNow}
                    disabled={checking}
                >
                    {checking
                        ? <><span className="spin" style={S.spinner} />Menyemak…</>
                        : '🔄 Semak Status Sekarang'}
                </button>

                <p style={S.note}>
                    Status disemak secara automatik setiap 30 saat.<br />
                    Hubungi admin terus jika ini mengambil masa terlalu lama.
                </p>
            </div>
        </div>
    );
};

/* ── Sub-components ─────────────────────────────────────────── */

function InfoRow({ label, value, highlight = false }) {
    return (
        <div style={S.infoRow}>
            <span style={S.infoLabel}>{label}</span>
            <span style={{ ...S.infoValue, color: highlight ? '#00D4EC' : '#fff' }}>{value}</span>
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
    content: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 24,
    },
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
    title: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 40, fontWeight: 900, letterSpacing: 1, textAlign: 'center',
    },
    subtitle: {
        fontSize: 15, color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', lineHeight: 1.6, maxWidth: 380,
    },
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
    steps: {
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '20px 24px',
        width: '100%', maxWidth: 520,
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
    stepLabel: { fontSize: 10, fontWeight: 500, textAlign: 'center', maxWidth: 80, lineHeight: 1.3 },
    stepLine: { flex: 1, height: 1, minWidth: 20 },
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
    note: {
        fontSize: 12, color: 'rgba(255,255,255,0.2)',
        textAlign: 'center', lineHeight: 1.7, maxWidth: 360,
    },
};

export default WaitingRoom;
