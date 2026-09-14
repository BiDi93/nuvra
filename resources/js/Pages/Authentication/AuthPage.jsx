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

const POSITIONS = [
    'Penjaga Gol (Goalkeeper)',
    'Bek (Defender)',
    'Gelandang (Midfielder)',
    'Penyerang (Forward / Striker)',
];

const AuthPage = () => {
    const navigate = useNavigate();
    const [imgIndex, setImgIndex]     = useState(0);
    const [fade, setFade]             = useState(true);
    const [view, setView]             = useState('login'); // 'login' | 'signup' | 'success'
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');
    const [successData, setSuccessData] = useState(null); // For post-register success screen

    const [loginForm, setLoginForm] = useState({ vellar_id: '', password: '' });
    const [signupForm, setSignupForm] = useState({
        name: '', phone: '', position: '', password: '', password_confirmation: '',
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

    // ── LOGIN ──────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/community/login', {
                vellar_id: loginForm.vellar_id,
                password:  loginForm.password,
            });

            const { token, user, status } = res.data;

            if (status === 'pending') {
                // Should not happen since backend blocks it, but handle gracefully
                navigate('/waiting-room', { state: { vellar_id: loginForm.vellar_id } });
                return;
            }

            localStorage.setItem('community_token', token);
            localStorage.setItem('auth_token', token); // legacy compat
            localStorage.setItem('player_role', user.role);
            localStorage.setItem('community_user', JSON.stringify(user)); // for CommunityLayout
            localStorage.setItem('vellar_id', user.vellar_id ?? '');
            localStorage.setItem('player_name', user.name ?? '');


            // Admin/organizer goes to admin area
            if (user.role === 'club_owner' || user.role === 'admin') {
                navigate('/community/feed');
            } else {
                navigate('/community/feed');
            }
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Ralat semasa log masuk. Cuba lagi.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── REGISTER ───────────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        if (signupForm.password !== signupForm.password_confirmation) {
            setError('Kata laluan tidak sepadan.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/community/register', {
                name:                  signupForm.name,
                phone:                 signupForm.phone,
                position:              signupForm.position,
                password:              signupForm.password,
                password_confirmation: signupForm.password_confirmation,
            });

            // Show success screen with vellar_id
            setSuccessData({
                vellar_id:     res.data.vellar_id,
                vellar_number: res.data.vellar_number,
                name:          res.data.name,
            });
            setView('success');
        } catch (err) {
            const msg = err.response?.data?.message
                ?? err.response?.data?.errors
                ?? 'Pendaftaran gagal. Cuba lagi.';
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
                input::placeholder, select::placeholder { color: rgba(255,255,255,0.2); }
                input:focus, select:focus { border-color: rgba(255,255,255,0.3) !important; outline: none; }
                .auth-input { transition: border-color 0.2s; }
                .auth-link:hover { color: #fff !important; }
                .back-btn:hover { color: rgba(255,255,255,0.8) !important; }
                select option { background: #0d0d17; color: #fff; }
            `}</style>

            {/* ── LEFT: Hero ── */}
            <div style={S.heroPanelWrap}>
                <div style={{ ...S.heroBg, backgroundImage: `url(${HERO_IMAGES[imgIndex]})`, opacity: fade ? 1 : 0, transition: 'opacity 0.6s ease' }} />
                <div style={S.heroOverlay} />
                <div style={S.heroOverlayBottom} />
                <div style={S.heroContent}>
                    <div style={S.heroLogo} onClick={() => navigate('/')} role="button">
                        <img src="/images/logoImage/NUVRA_LOGO.webp" alt="NUVRA" style={S.heroLogoImg} />
                    </div>
                    <div style={S.heroTagline}>
                        <h2 style={S.heroTaglineHeading}>Liga Awak.<br />Rekod Awak.</h2>
                        <p style={S.heroTaglineSub}>Platform pengurusan liga dan kejohanan rasmi untuk Vellar League.</p>
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
                                <h1 style={S.viewTitle}>Log Masuk</h1>
                                <p style={S.viewSubtitle}>Masukkan Vellar ID dan kata laluan anda.</p>
                            </div>

                            <form onSubmit={handleLogin} style={S.form}>
                                {/* Vellar ID Field */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={S.fieldLabel}>Vellar ID</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={S.vellarPrefix}>VELLAR</span>
                                        <input
                                            className="auth-input"
                                            type="text"
                                            placeholder="82"
                                            value={loginForm.vellar_id}
                                            onChange={e => { setError(''); setLoginForm(f => ({ ...f, vellar_id: e.target.value })); }}
                                            style={{ ...S.input, paddingLeft: 80 }}
                                            required
                                        />
                                    </div>
                                    <span style={S.fieldHint}>Contoh: taip <strong style={{ color: 'rgba(255,255,255,0.5)' }}>82</strong> untuk ID VELLAR 82. Admin boleh guna email.</span>
                                </div>

                                {/* Password Field */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={S.fieldLabel}>Kata Laluan</label>
                                    <input
                                        className="auth-input"
                                        type="password"
                                        placeholder="••••••••"
                                        value={loginForm.password}
                                        onChange={e => { setError(''); setLoginForm(f => ({ ...f, password: e.target.value })); }}
                                        style={S.input}
                                        required
                                    />
                                </div>

                                {error && <p style={S.errorMsg}>{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ ...S.primaryBtn, background: 'linear-gradient(135deg, #00D4EC, #D040EF)', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Log masuk…' : 'Log Masuk'}
                                </button>
                            </form>

                            <p style={{ ...S.switchText, marginTop: 24 }}>
                                Pemain baharu?{' '}
                                <button className="auth-link" style={{ ...S.inlineLink, color: '#00D4EC' }} onClick={switchToSignup}>
                                    Daftar di sini
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ══════════════════════════════════════
                        SIGN UP VIEW
                    ══════════════════════════════════════ */}
                    {view === 'signup' && (
                        <div style={S.viewWrap}>
                            <button className="back-btn" style={S.backBtn} onClick={switchToLogin}>← Kembali ke Log Masuk</button>

                            <div style={S.viewHeader}>
                                <h1 style={S.viewTitle}>Daftar Pemain Baharu</h1>
                                <p style={S.viewSubtitle}>Isi maklumat anda. Vellar ID akan dijana secara automatik dan perlu kelulusan admin.</p>
                            </div>

                            <form onSubmit={handleRegister} style={S.form}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={S.fieldLabel}>Nama Penuh</label>
                                    <input
                                        className="auth-input"
                                        type="text"
                                        placeholder="Nama anda"
                                        value={signupForm.name}
                                        onChange={e => { setError(''); setSignupForm(f => ({ ...f, name: e.target.value })); }}
                                        style={S.input}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={S.fieldLabel}>No. Telefon</label>
                                    <input
                                        className="auth-input"
                                        type="tel"
                                        placeholder="01X-XXXXXXX"
                                        value={signupForm.phone}
                                        onChange={e => { setError(''); setSignupForm(f => ({ ...f, phone: e.target.value })); }}
                                        style={S.input}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={S.fieldLabel}>Posisi Bermain</label>
                                    <select
                                        className="auth-input"
                                        value={signupForm.position}
                                        onChange={e => { setError(''); setSignupForm(f => ({ ...f, position: e.target.value })); }}
                                        style={{ ...S.input, appearance: 'none' }}
                                    >
                                        <option value="">-- Pilih posisi --</option>
                                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={S.fieldLabel}>Kata Laluan</label>
                                    <input
                                        className="auth-input"
                                        type="password"
                                        placeholder="Min. 6 aksara"
                                        value={signupForm.password}
                                        onChange={e => { setError(''); setSignupForm(f => ({ ...f, password: e.target.value })); }}
                                        style={S.input}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={S.fieldLabel}>Sahkan Kata Laluan</label>
                                    <input
                                        className="auth-input"
                                        type="password"
                                        placeholder="••••••••"
                                        value={signupForm.password_confirmation}
                                        onChange={e => { setError(''); setSignupForm(f => ({ ...f, password_confirmation: e.target.value })); }}
                                        style={S.input}
                                        required
                                    />
                                </div>

                                {error && <p style={S.errorMsg}>{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ ...S.primaryBtn, background: 'linear-gradient(135deg, #00D4EC, #D040EF)', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Mendaftar…' : 'Hantar Permohonan'}
                                </button>
                            </form>

                            <p style={{ ...S.switchText, marginTop: 20 }}>
                                Sudah ada akaun?{' '}
                                <button className="auth-link" style={{ ...S.inlineLink, color: '#00D4EC' }} onClick={switchToLogin}>
                                    Log masuk
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ══════════════════════════════════════
                        SUCCESS VIEW (Post Sign Up)
                    ══════════════════════════════════════ */}
                    {view === 'success' && successData && (
                        <div style={S.viewWrap}>
                            <div style={S.successIcon}>✅</div>
                            <div style={{ ...S.viewHeader, textAlign: 'center' }}>
                                <h1 style={S.viewTitle}>Pendaftaran Berjaya!</h1>
                                <p style={S.viewSubtitle}>Permohonan anda telah diterima dan sedang menunggu kelulusan admin.</p>
                            </div>

                            {/* Vellar ID Card */}
                            <div style={S.vellarCard}>
                                <p style={S.vellarCardLabel}>Vellar ID Anda</p>
                                <p style={S.vellarCardId}>{successData.vellar_id}</p>
                                <p style={S.vellarCardName}>{successData.name}</p>
                            </div>

                            <div style={S.infoBox}>
                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, textAlign: 'center' }}>
                                    💡 Simpan Vellar ID anda. Setelah admin meluluskan permohonan, anda boleh log masuk menggunakan <strong style={{ color: '#00D4EC' }}>nombor {successData.vellar_number}</strong> sebagai ID dan kata laluan yang anda daftarkan.
                                </p>
                            </div>

                            <button
                                onClick={switchToLogin}
                                style={{ ...S.primaryBtn, background: 'linear-gradient(135deg, #00D4EC, #D040EF)', marginTop: 8 }}
                            >
                                Kembali ke Log Masuk
                            </button>
                        </div>
                    )}

                    <p style={S.terms}>Dengan menggunakan NUVRA, anda bersetuju dengan Terma Perkhidmatan kami.</p>
                </div>
            </div>
        </div>
    );
};

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
    viewSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500, lineHeight: 1.6 },

    /* Vellar ID input prefix */
    vellarPrefix: {
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 11, fontWeight: 800, color: '#00D4EC', letterSpacing: 1, pointerEvents: 'none', zIndex: 1,
    },

    /* Buttons */
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
    fieldHint: { fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.4 },
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

    /* Success screen */
    successIcon: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
    vellarCard: {
        background: 'linear-gradient(135deg, rgba(0,212,236,0.12), rgba(208,64,239,0.12))',
        border: '1px solid rgba(0,212,236,0.25)',
        borderRadius: 16, padding: '24px', textAlign: 'center', marginBottom: 16,
    },
    vellarCardLabel: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    vellarCardId: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 40, fontWeight: 900, color: '#00D4EC', letterSpacing: 2, marginBottom: 4,
    },
    vellarCardName: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500 },
    infoBox: {
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '16px', marginBottom: 8,
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
