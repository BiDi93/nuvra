import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Curated vellar league images for the hero panel
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
    const [view, setView] = useState('selection');
    const [role, setRole] = useState('player');

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
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    const handleGoogleLogin = () => {
        window.location.href = "/auth/google";
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login', {
                email: formData.email,
                password: formData.password
            });
            const { token, role: userRole, status } = res.data;
            localStorage.setItem('auth_token', token);
            if (userRole === 'coach') {
                navigate('/coach-dashboard');
            } else {
                if (status === 'pending') {
                    navigate('/waiting-room');
                } else if (status === 'active') {
                    navigate('/dashboard');
                } else {
                    alert("Your account status is: " + status);
                }
            }
        } catch (error) {
            console.error(error);
            alert("Invalid email or password.");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, role };
            const res = await axios.post('/api/register', payload);
            const { token, user_id } = res.data;
            localStorage.setItem('auth_token', token);
            if (role === 'coach') {
                navigate('/coach-dashboard');
            } else {
                navigate(`/onboarding?token=${token}&user_id=${user_id}`);
            }
        } catch (error) {
            console.error(error);
            alert("Registration failed. Email might already be taken.");
        }
    };

    const isPlayer = role === 'player';
    const accentColor = isPlayer ? '#00D4EC' : '#D040EF';
    const btnGradient = isPlayer
        ? 'linear-gradient(135deg, #00D4EC, #D040EF)'
        : 'linear-gradient(135deg, #D040EF, #00D4EC)';

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

            {/* ── LEFT: Hero Image Panel ── */}
            <div style={S.heroPanelWrap}>
                <div style={{ ...S.heroPanel, backgroundImage: `url(${HERO_IMAGES[imgIndex]})`, opacity: fade ? 1 : 0, transition: 'opacity 0.6s ease' }}>
                    {/* gradient overlays */}
                    <div style={S.heroOverlay} />
                    <div style={S.heroOverlayBottom} />

                    {/* Logo top-left */}
                    <div style={S.heroLogo} onClick={() => navigate('/')} role="button">
                        <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" style={S.heroLogoImg} />

                    </div>

                    {/* Tagline bottom */}
                    <div style={S.heroTagline}>
                        <h2 style={S.heroTaglineHeading}>Play Together.<br />Grow Together.</h2>
                        <p style={S.heroTaglineSub}>The all-in-one platform for football clubs and their players.</p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Form Panel ── */}
            <div style={S.formPanel}>
                <div style={S.formInner}>

                    {/* Mobile logo (hidden on desktop via media query workaround) */}
                    <div style={S.mobileLogo} onClick={() => navigate('/')} role="button">
                        <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" style={{ height: 32, objectFit: 'contain' }} />
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, letterSpacing: 3 }}>NUVRA</span>
                    </div>

                    {/* ── SELECTION VIEW ── */}
                    {view === 'selection' && (
                        <div style={S.viewWrap}>
                            <div style={S.viewHeader}>
                                <div style={{ ...S.rolePill, background: `${accentColor}18`, color: accentColor, borderColor: `${accentColor}33` }}>
                                    {isPlayer ? 'Player Portal' : 'Club Portal'}
                                </div>
                                <h1 style={S.viewTitle}>Join Nuvra</h1>
                                <p style={S.viewSubtitle}>
                                    {isPlayer ? "Your squad is waiting." : "Manage your club, your way."}
                                </p>
                            </div>

                            <div style={S.btnStack}>
                                <button className="auth-btn-ghost" style={S.googleBtn} onClick={handleGoogleLogin}>
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: 18, height: 18 }} alt="G" />
                                    {isPlayer ? 'Continue with Google' : 'Sign up with Google'}
                                </button>
                                <button style={{ ...S.primaryBtn, background: btnGradient }} onClick={() => setView('signup')}>
                                    Sign up with Email
                                </button>
                            </div>

                            <div style={S.divider}>
                                <div style={S.dividerLine} />
                                <span style={S.dividerText}>or</span>
                                <div style={S.dividerLine} />
                            </div>

                            <p style={S.switchText}>
                                {isPlayer ? (
                                    <>Manage a club?{' '}
                                        <button className="auth-link" style={{ ...S.inlineLink, color: '#D040EF' }} onClick={() => setRole('coach')}>
                                            Access Club Portal
                                        </button>
                                    </>
                                ) : (
                                    <>Are you a player?{' '}
                                        <button className="auth-link" style={{ ...S.inlineLink, color: '#00D4EC' }} onClick={() => setRole('player')}>
                                            Go to Player Portal
                                        </button>
                                    </>
                                )}
                            </p>

                            <p style={S.switchText}>
                                Already have an account?{' '}
                                <button className="auth-link" style={S.inlineLink} onClick={() => setView('login')}>
                                    Log in
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ── SIGN UP VIEW ── */}
                    {view === 'signup' && (
                        <div style={S.viewWrap}>
                            <button className="back-btn" style={S.backBtn} onClick={() => setView('selection')}>← Back</button>
                            <div style={S.viewHeader}>
                                <div style={{ ...S.rolePill, background: `${accentColor}18`, color: accentColor, borderColor: `${accentColor}33` }}>
                                    {isPlayer ? 'Player' : 'Club Admin'}
                                </div>
                                <h1 style={S.viewTitle}>Create Account</h1>
                            </div>
                            <form onSubmit={handleRegister} style={S.form}>
                                <Field label="Full Name" type="text" placeholder="Your Name"
                                    value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
                                <Field label="Email Address" type="email" placeholder="you@example.com"
                                    value={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
                                <Field label="Password" type="password" placeholder="Min. 8 characters"
                                    value={formData.password} onChange={v => setFormData({ ...formData, password: v })} />
                                <Field label="Confirm Password" type="password" placeholder="••••••••"
                                    value={formData.password_confirmation} onChange={v => setFormData({ ...formData, password_confirmation: v })} />
                                <button type="submit" style={{ ...S.primaryBtn, background: btnGradient, marginTop: 8 }}>
                                    Create Account
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ── LOGIN VIEW ── */}
                    {view === 'login' && (
                        <div style={S.viewWrap}>
                            <button className="back-btn" style={S.backBtn} onClick={() => setView('selection')}>← Back</button>
                            <div style={S.viewHeader}>
                                <h1 style={S.viewTitle}>Welcome Back</h1>
                                <p style={S.viewSubtitle}>Sign in to your Nuvra account.</p>
                            </div>

                            <button className="auth-btn-ghost" style={S.googleBtn} onClick={handleGoogleLogin}>
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: 18, height: 18 }} alt="G" />
                                Log in with Google
                            </button>

                            <div style={S.divider}>
                                <div style={S.dividerLine} />
                                <span style={S.dividerText}>or</span>
                                <div style={S.dividerLine} />
                            </div>

                            <form onSubmit={handleLogin} style={S.form}>
                                <Field label="Email Address" type="email" placeholder="you@example.com"
                                    value={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
                                <Field label="Password" type="password" placeholder="••••••••"
                                    value={formData.password} onChange={v => setFormData({ ...formData, password: v })} />
                                <button type="submit" style={{ ...S.primaryBtn, background: 'linear-gradient(135deg, #00D4EC, #D040EF)', marginTop: 8 }}>
                                    Log In
                                </button>
                            </form>

                            <p style={{ ...S.switchText, marginTop: 24 }}>
                                No account yet?{' '}
                                <button className="auth-link" style={S.inlineLink} onClick={() => setView('selection')}>
                                    Sign up
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

const S = {
    root: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        background: '#080810',
        color: '#fff',
    },

    /* ── Hero Panel ── */
    heroPanelWrap: {
        flex: '0 0 55%',
        position: 'relative',
        overflow: 'hidden',
    },
    heroPanel: {
        position: 'absolute',
        inset: 0,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 40,
    },
    heroOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
    },
    heroOverlayBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(to top, rgba(8,8,16,0.95) 0%, transparent 100%)',
        pointerEvents: 'none',
    },
    heroLogo: {
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
    },
    heroLogoImg: {
        height: 'auto',
        width: '250px',
        objectFit: 'contain',
    },
    heroLogoText: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: 4,
        color: '#fff',
    },
    heroTagline: {
        position: 'relative',
        zIndex: 2,
    },
    heroTaglinePill: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 20,
        background: 'rgba(0,212,236,0.15)',
        border: '1px solid rgba(0,212,236,0.3)',
        color: '#00D4EC',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 2,
        marginBottom: 16,
    },
    heroTaglineHeading: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 52,
        fontWeight: 900,
        lineHeight: 1.05,
        letterSpacing: 1,
        marginBottom: 12,
        color: '#fff',
    },
    heroTaglineSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: 500,
        maxWidth: 360,
        lineHeight: 1.6,
    },

    /* ── Form Panel ── */
    formPanel: {
        flex: '0 0 45%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d17',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        overflowY: 'auto',
    },
    formInner: {
        width: '100%',
        maxWidth: 380,
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
    },
    mobileLogo: {
        display: 'none',
        alignItems: 'center',
        gap: 10,
        marginBottom: 32,
        cursor: 'pointer',
        color: '#fff',
    },

    /* ── View content ── */
    viewWrap: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
    },
    viewHeader: {
        marginBottom: 28,
    },
    rolePill: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 20,
        border: '1px solid',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.5,
        marginBottom: 14,
    },
    viewTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 38,
        fontWeight: 900,
        letterSpacing: 1,
        color: '#fff',
        lineHeight: 1.1,
        marginBottom: 8,
    },
    viewSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 500,
    },

    /* ── Buttons ── */
    btnStack: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginBottom: 20,
    },
    googleBtn: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '13px 20px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.04)',
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        marginBottom: 12,
    },
    primaryBtn: {
        width: '100%',
        padding: '14px 20px',
        borderRadius: 12,
        border: 'none',
        color: '#080810',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer',
        fontFamily: 'inherit',
        letterSpacing: 0.3,
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 0,
        marginBottom: 24,
        textAlign: 'left',
        transition: 'color 0.2s',
    },

    /* ── Divider ── */
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '4px 0 20px',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        background: 'rgba(255,255,255,0.07)',
    },
    dividerText: {
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    /* ── Form Fields ── */
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: '#fff',
        fontSize: 14,
        fontFamily: 'inherit',
    },

    /* ── Footer text ── */
    switchText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.35)',
        marginTop: 16,
        textAlign: 'center',
    },
    inlineLink: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 0,
        transition: 'color 0.2s',
    },
    terms: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.15)',
        textAlign: 'center',
        marginTop: 32,
    },
};

export default AuthPage;
