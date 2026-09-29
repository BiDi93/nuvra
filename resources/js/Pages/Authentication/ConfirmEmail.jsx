import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const ConfirmEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [state, setState] = useState('ready');
    const [notice, setNotice] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const confirm = async () => {
        setState('working');
        setError('');
        try {
            const res = await axios.post('/api/community/email/confirm', { token });
            setState(res.data.status === 'pending_approval' ? 'confirmed' : 'invalid');
        } catch {
            setState('invalid');
        }
    };

    const resend = async (event) => {
        event.preventDefault();
        setError('');
        setNotice('');
        try {
            const res = await axios.post('/api/community/register/resend', { email });
            setNotice(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Could not send another confirmation.');
        }
    };

    return (
        <div style={S.root}>
            <h1 style={S.title}>Confirm your email</h1>
            {state === 'ready' && (
                <>
                    <p style={S.text}>Press confirm to finish this registration. The link works once. The Vellar ID is not shown on this page.</p>
                    <button type="button" style={S.button} onClick={confirm}>Confirm email</button>
                </>
            )}
            {state === 'working' && <p style={S.text}>Confirming…</p>}
            {state === 'confirmed' && (
                <>
                    <p style={S.text}>Your email is confirmed. An administrator still has to approve the account. The Vellar ID will be emailed after that approval.</p>
                    <button type="button" style={S.button} onClick={() => navigate('/login')}>Back to sign in</button>
                </>
            )}
            {state === 'invalid' && (
                <>
                    <p style={S.text}>This confirmation link is invalid or has expired.</p>
                    <form onSubmit={resend} style={S.form}>
                        <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            style={S.input}
                        />
                        <button type="submit" style={S.button}>Send a new confirmation</button>
                    </form>
                    {error && <p style={S.text}>{error}</p>}
                    {notice && <p style={S.text}>{notice}</p>}
                </>
            )}
        </div>
    );
};

const S = {
    root: {
        minHeight: '100vh',
        background: '#080810',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
    },
    title: { fontSize: 32, fontWeight: 800 },
    text: { maxWidth: 420, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 },
    form: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 },
    input: {
        padding: '12px 14px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'transparent',
        color: '#fff',
    },
    button: {
        padding: '12px 20px',
        borderRadius: 10,
        border: 'none',
        background: 'linear-gradient(135deg, #00D4EC, #D040EF)',
        color: '#080810',
        fontWeight: 800,
        cursor: 'pointer',
    },
};

export default ConfirmEmail;
