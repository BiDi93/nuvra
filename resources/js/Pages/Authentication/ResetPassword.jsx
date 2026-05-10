import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const HERO_IMAGES = [
    "/images/vellar_league/R6SA4597.JPG",
    "/images/vellar_league/R6SA4601.JPG",
    "/images/vellar_league/R6SA4603.JPG",
    "/images/vellar_league/LSBS0014.JPG",
    "/images/vellar_league/LSBS0016.JPG",
    "/images/vellar_league/LSBS0008.JPG",
    "/images/vellar_league/R6SA4599.JPG",
    "/images/vellar_league/R6SA4602.JPG",
];

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [imgIndex, setImgIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        email: searchParams.get('email') || '',
        token: searchParams.get('token') || '',
        password: '',
        password_confirmation: '',
    });

    // Hero image slideshow
    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setImgIndex(i => (i + 1) % HERO_IMAGES.length);
                setFade(true);
            }, 600);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post('/api/reset-password', formData);
            setMessage(res.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={S.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                input::placeholder { color: rgba(255,255,255,0.2); }
                input:focus { border-color: rgba(255,255,255,0.3) !important; outline: none; }
                .auth-input { transition: border-color 0.2s; }
            `}</style>

            {/* ── LEFT: Hero ── */}
            <div style={S.heroPanelWrap}>
                <div style={{ ...S.heroBg, backgroundImage: `url(${HERO_IMAGES[imgIndex]})`, opacity: fade ? 1 : 0, transition: 'opacity 0.6s ease' }} />
                <div style={S.heroOverlay} />
                <div style={S.heroOverlayBottom} />
                <div style={S.heroContent}>
                    <div style={S.heroLogo} onClick={() => navigate('/')} role="button">
                        <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" style={S.heroLogoImg} />
                    </div>
                    <div style={S.heroTagline}>
                        <h2 style={S.heroTaglineHeading}>New Password.<br />New Season.</h2>
                        <p style={S.heroTaglineSub}>Secure your account and get back on the field.</p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Form Panel ── */}
            <div style={S.formPanel}>
                <div style={S.formInner}>
                    <div style={S.viewWrap}>
                        <div style={S.viewHeader}>
                            <h1 style={S.viewTitle}>Reset Password</h1>
                            <p style={S.viewSubtitle}>Create a new secure password for your account.</p>
                        </div>

                        <form onSubmit={handleReset} style={S.form}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={S.fieldLabel}>Email Address</label>
                                <input
                                    className="auth-input"
                                    type="email"
                                    value={formData.email}
                                    readOnly
                                    style={{ ...S.input, opacity: 0.6, cursor: 'not-allowed' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={S.fieldLabel}>New Password</label>
                                <input
                                    className="auth-input"
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    style={S.input}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={S.fieldLabel}>Confirm New Password</label>
                                <input
                                    className="auth-input"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password_confirmation}
                                    onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    style={S.input}
                                    required
                                />
                            </div>

                            {error && <p style={S.errorMsg}>{error}</p>}
                            {message && <p style={S.successMsg}>{message}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{ ...S.primaryBtn, background: 'linear-gradient(135deg, #00D4EC, #D040EF)', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Updating…' : 'Update Password'}
                            </button>
                        </form>

                        <p style={{ ...S.switchText, marginTop: 24 }}>
                            Wait, I remember it!{' '}
                            <button style={{ ...S.inlineLink, color: '#00D4EC' }} onClick={() => navigate('/login')}>
                                Back to login
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    root: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#080810', color: '#fff' },
    heroPanelWrap: { flex: '0 0 55%', position: 'relative', overflow: 'hidden', background: '#080810' },
    heroBg: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center top' },
    heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.6) 100%)', zIndex: 2 },
    heroOverlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(8,8,16,0.9) 0%, transparent 100%)', zIndex: 3 },
    heroContent: { position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 50 },
    heroLogo: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
    heroLogoImg: { height: 'auto', width: '250px', objectFit: 'contain' },
    heroTagline: { position: 'relative', zIndex: 2 },
    heroTaglineHeading: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 52, fontWeight: 900, lineHeight: 1.05, letterSpacing: 1, marginBottom: 12, color: '#fff' },
    heroTaglineSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500, maxWidth: 360, lineHeight: 1.6 },
    formPanel: { flex: '0 0 45%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d17', borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' },
    formInner: { width: '100%', maxWidth: 380, padding: '48px 40px', display: 'flex', flexDirection: 'column' },
    viewWrap: { display: 'flex', flexDirection: 'column' },
    viewHeader: { marginBottom: 28 },
    viewTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 38, fontWeight: 900, letterSpacing: 1, color: '#fff', lineHeight: 1.1, marginBottom: 8 },
    viewSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 },
    primaryBtn: { width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none', color: '#080810', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.3 },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    fieldLabel: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 },
    input: { width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: 14, fontFamily: 'inherit' },
    errorMsg: { fontSize: 12, color: '#ff6b6b', fontWeight: 500, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, padding: '8px 12px' },
    successMsg: { fontSize: 12, color: '#00D4EC', fontWeight: 500, background: 'rgba(0,212,236,0.08)', border: '1px solid rgba(0,212,236,0.2)', borderRadius: 8, padding: '8px 12px' },
    switchText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
    inlineLink: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 },
};

export default ResetPassword;
