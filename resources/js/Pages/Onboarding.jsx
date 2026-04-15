import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

const Onboarding = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token  = searchParams.get('token');
    const userId = searchParams.get('user_id');

    const [teams, setTeams]     = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [formData, setFormData] = useState({
        coach_id:      '',
        position:      '',
        date_of_birth: '',
        jersey_number: '',
    });

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        localStorage.setItem('auth_token', token);

        axios.get('/api/teams')
            .then(res => setTeams(res.data))
            .catch(() => setError('Failed to load teams. Please refresh.'));
    }, [token, navigate]);

    const set = (key, value) => {
        setError('');
        setFormData(f => ({ ...f, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.coach_id) { setError('Please select a team.'); return; }
        if (!formData.position) { setError('Please select your position.'); return; }

        setLoading(true);
        try {
            await axios.post('/api/player/onboarding', {
                user_id:       userId,
                coach_id:      formData.coach_id,
                position:      formData.position,
                date_of_birth: formData.date_of_birth,
                jersey_number: formData.jersey_number || null,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            navigate('/waiting-room');
        } catch (err) {
            const msg = err.response?.data?.message;
            setError(msg || 'Submission failed. You may already have a pending application.');
        } finally {
            setLoading(false);
        }
    };

    const selectedTeam = teams.find(t => String(t.id) === String(formData.coach_id));

    return (
        <div style={S.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                select { appearance: none; -webkit-appearance: none; }
                input::placeholder { color: rgba(255,255,255,0.2); }
                input:focus, select:focus { border-color: rgba(0,212,236,0.4) !important; outline: none; box-shadow: 0 0 0 3px rgba(0,212,236,0.08); }
                .field-input { transition: border-color 0.2s, box-shadow 0.2s; }
                .team-card:hover { border-color: rgba(0,212,236,0.35) !important; background: rgba(0,212,236,0.06) !important; }
                .team-card.selected { border-color: #00D4EC !important; background: rgba(0,212,236,0.1) !important; }
                .pos-btn:hover { border-color: rgba(0,212,236,0.35) !important; background: rgba(255,255,255,0.06) !important; }
                .pos-btn.selected { border-color: #00D4EC !important; background: rgba(0,212,236,0.1) !important; color: #00D4EC !important; }
            `}</style>

            {/* ── Left decorative panel ── */}
            <div style={S.leftPanel}>
                <div style={S.leftInner}>
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="NUVRA" style={S.logo} onClick={() => navigate('/')} />
                    <div style={S.leftText}>
                        <h2 style={S.leftHeading}>One more step.</h2>
                        <p style={S.leftSub}>Tell us about yourself so your coach can find you.</p>
                    </div>
                    <div style={S.steps}>
                        {['Account Created', 'Join a Team', 'Awaiting Approval'].map((label, i) => (
                            <div key={i} style={S.stepRow}>
                                <div style={{ ...S.stepDot, ...(i === 1 ? S.stepDotActive : i === 0 ? S.stepDotDone : {}) }}>
                                    {i === 0 ? '✓' : i + 1}
                                </div>
                                <span style={{ ...S.stepLabel, color: i === 1 ? '#fff' : i === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div style={S.rightPanel}>
                <div style={S.formWrap}>
                    <div style={S.formHeader}>
                        <h1 style={S.formTitle}>Join a Team</h1>
                        <p style={S.formSubtitle}>Select your team and complete your player profile.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={S.form}>

                        {/* ── Team selection ── */}
                        <div style={S.section}>
                            <label style={S.sectionLabel}>Select Your Team</label>
                            {teams.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading teams…</p>
                            ) : (
                                <div style={S.teamGrid}>
                                    {teams.map(team => (
                                        <div
                                            key={team.id}
                                            className={`team-card${String(formData.coach_id) === String(team.id) ? ' selected' : ''}`}
                                            style={S.teamCard}
                                            onClick={() => set('coach_id', team.id)}
                                            role="button"
                                        >
                                            <div style={S.teamIcon}>⚽</div>
                                            <div>
                                                <p style={S.teamName}>{team.team_name}</p>
                                                <p style={S.teamCoach}>Coach {team.coach_name}</p>
                                            </div>
                                            {String(formData.coach_id) === String(team.id) && (
                                                <div style={S.teamCheck}>✓</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Position ── */}
                        <div style={S.section}>
                            <label style={S.sectionLabel}>Playing Position</label>
                            <div style={S.posGrid}>
                                {POSITIONS.map(pos => (
                                    <button
                                        key={pos}
                                        type="button"
                                        className={`pos-btn${formData.position === pos ? ' selected' : ''}`}
                                        style={S.posBtn}
                                        onClick={() => set('position', pos)}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Date of birth + Jersey number ── */}
                        <div style={S.fieldRow}>
                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Date of Birth</label>
                                <input
                                    className="field-input"
                                    type="date"
                                    required
                                    value={formData.date_of_birth}
                                    onChange={e => set('date_of_birth', e.target.value)}
                                    style={S.input}
                                />
                            </div>
                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Preferred Jersey No. <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>(optional)</span></label>
                                <input
                                    className="field-input"
                                    type="number"
                                    min="1"
                                    max="99"
                                    placeholder="e.g. 10"
                                    value={formData.jersey_number}
                                    onChange={e => set('jersey_number', e.target.value)}
                                    style={S.input}
                                />
                            </div>
                        </div>

                        {/* ── Summary preview ── */}
                        {(selectedTeam || formData.position) && (
                            <div style={S.preview}>
                                <p style={S.previewLabel}>Your application</p>
                                <div style={S.previewBody}>
                                    {selectedTeam && <span style={S.previewTag}>{selectedTeam.team_name}</span>}
                                    {formData.position && <span style={S.previewTag}>{formData.position}</span>}
                                    {formData.jersey_number && <span style={S.previewTag}>#{formData.jersey_number}</span>}
                                </div>
                            </div>
                        )}

                        {error && <p style={S.errorMsg}>{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Submitting…' : 'Submit Application →'}
                        </button>
                    </form>

                    <p style={S.note}>
                        Your coach will review your request. You'll be notified once approved.
                    </p>
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

    /* Left panel */
    leftPanel: {
        flex: '0 0 35%',
        background: 'linear-gradient(160deg, #0d0d20 0%, #080810 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
    },
    leftInner: {
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        maxWidth: 280,
    },
    logo: {
        width: 160,
        objectFit: 'contain',
        cursor: 'pointer',
    },
    leftText: {},
    leftHeading: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 40,
        fontWeight: 900,
        lineHeight: 1.1,
        marginBottom: 10,
    },
    leftSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 1.6,
    },

    /* Steps */
    steps: { display: 'flex', flexDirection: 'column', gap: 16 },
    stepRow: { display: 'flex', alignItems: 'center', gap: 12 },
    stepDot: {
        width: 28, height: 28, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)',
        flexShrink: 0,
    },
    stepDotDone: {
        background: 'rgba(0,212,236,0.1)',
        border: '1px solid rgba(0,212,236,0.3)',
        color: '#00D4EC',
    },
    stepDotActive: {
        background: 'linear-gradient(135deg, #00D4EC, #D040EF)',
        border: 'none',
        color: '#080810',
    },
    stepLabel: { fontSize: 13, fontWeight: 600 },

    /* Right panel */
    rightPanel: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '48px 24px',
    },
    formWrap: {
        width: '100%',
        maxWidth: 520,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
    },
    formHeader: { marginBottom: 32 },
    formTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 38, fontWeight: 900, letterSpacing: 1,
        marginBottom: 6,
    },
    formSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },

    form: { display: 'flex', flexDirection: 'column', gap: 28 },

    /* Sections */
    section: { display: 'flex', flexDirection: 'column', gap: 12 },
    sectionLabel: {
        fontSize: 11, fontWeight: 800,
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: 1.5,
    },

    /* Team cards */
    teamGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
    teamCard: {
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        cursor: 'pointer', position: 'relative',
        transition: 'all 0.15s',
    },
    teamIcon: { fontSize: 22, flexShrink: 0 },
    teamName: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
    teamCoach: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
    teamCheck: {
        marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%',
        background: '#00D4EC', color: '#080810',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900,
    },

    /* Position buttons */
    posGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
    posBtn: {
        padding: '11px 8px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.09)',
        background: 'rgba(255,255,255,0.03)',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s',
    },

    /* Fields */
    fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
    fieldLabel: {
        fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: 1,
    },
    input: {
        width: '100%', padding: '12px 14px', borderRadius: 10,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: '#fff', fontSize: 14, fontFamily: 'inherit',
    },

    /* Preview */
    preview: {
        padding: '14px 16px', borderRadius: 10,
        border: '1px solid rgba(0,212,236,0.15)',
        background: 'rgba(0,212,236,0.05)',
    },
    previewLabel: {
        fontSize: 11, fontWeight: 700,
        color: 'rgba(0,212,236,0.6)',
        textTransform: 'uppercase', letterSpacing: 1,
        marginBottom: 8,
    },
    previewBody: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    previewTag: {
        padding: '4px 10px', borderRadius: 20,
        background: 'rgba(0,212,236,0.12)',
        border: '1px solid rgba(0,212,236,0.2)',
        color: '#00D4EC', fontSize: 12, fontWeight: 600,
    },

    /* Error */
    errorMsg: {
        fontSize: 12, color: '#ff6b6b', fontWeight: 500,
        background: 'rgba(255,107,107,0.08)',
        border: '1px solid rgba(255,107,107,0.2)',
        borderRadius: 8, padding: '10px 14px',
    },

    /* Submit */
    submitBtn: {
        width: '100%', padding: '15px 20px', borderRadius: 12, border: 'none',
        background: 'linear-gradient(135deg, #00D4EC, #D040EF)',
        color: '#080810', fontSize: 15, fontWeight: 800,
        cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.3,
        transition: 'opacity 0.2s',
    },

    /* Note */
    note: {
        marginTop: 16, fontSize: 12,
        color: 'rgba(255,255,255,0.2)',
        textAlign: 'center', lineHeight: 1.6,
    },
};

export default Onboarding;
