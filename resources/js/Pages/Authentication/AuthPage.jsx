import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

const AuthPage = () => {
    const navigate = useNavigate();
    const [imgIndex, setImgIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [view, setView] = useState('login');     // 'login' | 'signup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
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

    const field = (key) => ({
        value: formData[key],
        onChange: v => { setError(''); setFormData(f => ({ ...f, [key]: v })); },
    });

    const handleGoogleLogin = () => {
        window.location.href = '/auth/google';
    };

    // ── LOGIN ──────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/login', {
                email: formData.email,
                password: formData.password,
            });
            const { token, role: userRole, status, coach_id, coach_name, coach_avatar } = res.data;
            localStorage.setItem('auth_token', token);
            localStorage.setItem('player_role', userRole);

            if (userRole === 'coach') {
                if (coach_id) localStorage.setItem('coach_id', coach_id);
                if (coach_name) localStorage.setItem('coach_name', coach_name);
                if (coach_avatar) localStorage.setItem('coach_avatar', coach_avatar);
                navigate('/coach-dashboard');
            } else if (status === 'pending') {
                localStorage.setItem('player_status', 'pending');
                navigate('/waiting-room');
            } else if (status === 'active') {
                localStorage.setItem('player_status', 'active');
                navigate('/dashboard');
            } else {
                setError(`Account status: ${status}`);
            }
        } catch {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    // ── REGISTER ───────────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/register', { ...formData, role: 'player' });
            const { token, user_id } = res.data;
            localStorage.setItem('auth_token', token);
            navigate(`/onboarding?token=${token}&user_id=${user_id}`);
        } catch (err) {
            console.error('Register error:', err.response?.data ?? err.message);
            const msg = err.response?.data?.message
                ?? err.response?.data?.errors
                ?? err.message
                ?? 'Registration failed.';
            setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
        } finally {
            setLoading(false);
        }
    };

    const switchToSignup = () => { setError(''); setView('signup'); };
    const switchToLogin  = () => { setError(''); setView('login'); };

    return (
        <div style={S.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                input::placeholder { color: rgba(255,255,255,0.2); }
                input:focus { border-color: rgba(255,255,255,0.3) !important; outline: none; }
                .auth-input { transition: border-color 0.2s; }
                .auth-btn-ghost:hover { background: rgba(255,255,255,0.08) !important; }
                .auth-link:hover { color: #fff !important; }
                .back-btn:hover { color: rgba(255,255,255,0.8) !important; }
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
                        <h2 style={S.heroTaglineHeading}>Play Together.<br />Grow Together.</h2>
                        <p style={S.heroTaglineSub}>The all-in-one platform for football clubs and their players.</p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Form Panel ── */}
            <div style={S.formPanel}>
                <div style={S.formInner}>

                    {/* ══════════════════════════════════════
                        LOGIN VIEW
                    ══════════════════════════════════════ */}
                    {view === 'login' && (
                        <div style={S.viewWrap}>
                            <div style={S.viewHeader}>
                                <h1 style={S.viewTitle}>Sign In</h1>
                                <p style={S.viewSubtitle}>Welcome back. Sign in to continue.</p>
                            </div>

                            {/* Google */}
                            <button className="auth-btn-ghost" style={S.googleBtn} onClick={handleGoogleLogin}>
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: 18, height: 18 }} alt="G" />
                                Continue with Google
                            </button>

                            <Divider />

                            {/* Email / Password */}
                            <form onSubmit={handleLogin} style={S.form}>
                                <Field label="Email Address" type="email" placeholder="you@example.com" {...field('email')} />
                                <Field label="Password" type="password" placeholder="••••••••" {...field('password')} />
                                {error && <p style={S.errorMsg}>{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ ...S.primaryBtn, background: 'linear-gradient(135deg, #00D4EC, #D040EF)', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Signing in…' : 'Sign In'}
                                </button>
                            </form>

                            <p style={{ ...S.switchText, marginTop: 24 }}>
                                Don't have an account?{' '}
                                <button className="auth-link" style={{ ...S.inlineLink, color: '#00D4EC' }} onClick={switchToSignup}>
                                    Sign up
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ══════════════════════════════════════
                        SIGN UP VIEW
                    ══════════════════════════════════════ */}
                    {view === 'signup' && (
                        <div style={S.viewWrap}>
                            <button className="back-btn" style={S.backBtn} onClick={switchToLogin}>← Back to Sign In</button>

                            <div style={S.viewHeader}>
                                <h1 style={S.viewTitle}>Create Account</h1>
                                <p style={S.viewSubtitle}>Join your squad on Nuvra.</p>
                            </div>

                            {/* Google sign up */}
                            <button className="auth-btn-ghost" style={{ ...S.googleBtn, marginBottom: 0 }} onClick={handleGoogleLogin}>
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: 18, height: 18 }} alt="G" />
                                Sign up with Google
                            </button>

                            <Divider />

                            {/* Email sign up form */}
                            <form onSubmit={handleRegister} style={S.form}>
                                <Field label="Full Name" type="text" placeholder="Your Name" {...field('name')} />
                                <Field label="Email Address" type="email" placeholder="you@example.com" {...field('email')} />
                                <Field label="Password" type="password" placeholder="Min. 8 characters" {...field('password')} />
                                <Field label="Confirm Password" type="password" placeholder="••••••••" {...field('password_confirmation')} />
                                {error && <p style={S.errorMsg}>{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ ...S.primaryBtn, background: 'linear-gradient(135deg, #00D4EC, #D040EF)', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Creating account…' : 'Create Account'}
                                </button>
                            </form>

                            <p style={{ ...S.switchText, marginTop: 20 }}>
                                Already have an account?{' '}
                                <button className="auth-link" style={{ ...S.inlineLink, color: '#00D4EC' }} onClick={switchToLogin}>
                                    Sign in
                                </button>
                            </p>
                        </div>
                    )}

                    <p style={S.terms}>By using Nuvra, you agree to our Terms of Service.</p>
                </div>
            </div>
        </div>
    );
};

/* ── Sub-components ─────────────────────────────────────────── */

function Divider() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>
    );
}

function Field({ label, type, placeholder, value, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={S.fieldLabel}>{label}</label>
            <input
                className="auth-input"
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={S.input}
                required
            />
        </div>
    );
}

/* ── Styles ─────────────────────────────────────────────────── */
const S = {
    root: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        background: '#080810',
        color: '#fff',
    },

    /* Hero */
    heroPanelWrap: { flex: '0 0 55%', position: 'relative', overflow: 'hidden', background: '#080810' },
    heroBg: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center top' },
    heroOverlay: {
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none', zIndex: 2,
    },
    heroOverlayBottom: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
        background: 'linear-gradient(to top, rgba(8,8,16,0.9) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
    },
    heroContent: {
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 50,
    },
    heroLogo: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
    heroLogoImg: { height: 'auto', width: '250px', objectFit: 'contain' },
    heroTagline: { position: 'relative', zIndex: 2 },
    heroTaglineHeading: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 52, fontWeight: 900, lineHeight: 1.05, letterSpacing: 1, marginBottom: 12, color: '#fff',
    },
    heroTaglineSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500, maxWidth: 360, lineHeight: 1.6 },

    /* Form panel */
    formPanel: {
        flex: '0 0 45%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d0d17', borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto',
    },
    formInner: {
        width: '100%', maxWidth: 380, padding: '48px 40px',
        display: 'flex', flexDirection: 'column', gap: 0,
    },

    /* View */
    viewWrap: { display: 'flex', flexDirection: 'column', gap: 0 },
    viewHeader: { marginBottom: 28 },
    viewTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 38, fontWeight: 900, letterSpacing: 1, color: '#fff', lineHeight: 1.1, marginBottom: 8,
    },
    viewSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 },

    /* Buttons */
    googleBtn: {
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '13px 20px', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
        color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        marginBottom: 0,
    },
    primaryBtn: {
        width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
        color: '#080810', fontSize: 14, fontWeight: 800, cursor: 'pointer',
        fontFamily: 'inherit', letterSpacing: 0.3,
    },
    backBtn: {
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        padding: 0, marginBottom: 24, textAlign: 'left', transition: 'color 0.2s',
    },

    /* Form */
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    fieldLabel: {
        fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: 1,
    },
    input: {
        width: '100%', padding: '12px 16px', borderRadius: 10,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
        color: '#fff', fontSize: 14, fontFamily: 'inherit',
    },
    errorMsg: {
        fontSize: 12, color: '#ff6b6b', fontWeight: 500,
        background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
        borderRadius: 8, padding: '8px 12px',
    },

    /* Footer */
    switchText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
    inlineLink: {
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        padding: 0, transition: 'color 0.2s',
    },
    terms: { fontSize: 11, color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: 32 },
};

export default AuthPage;
