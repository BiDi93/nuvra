import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

const POSITIONS = [
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward / Striker',
];

export default function CommunityHome() {
    const navigate = useNavigate();
    const [tab, setTab] = useState("login"); // 'login' | 'register' | 'success' | 'reset'

    useEffect(() => {
        const token = localStorage.getItem("community_token");
        if (token) navigate("/community/feed", { replace: true });
    }, []);

    const [error, setError]       = useState("");
    const [loading, setLoading]   = useState(false);
    const [successData, setSuccessData] = useState(null);

    const [loginData, setLoginData] = useState({ vellar_id: "", password: "" });
    const [regData, setRegData]     = useState({ name: "", email: "", phone: "", position: "", password: "", password_confirmation: "" });
    const [resendNotice, setResendNotice] = useState("");
    const [resetData, setResetData] = useState({ vellar_id: "", code: "", password: "", password_confirmation: "" });
    const [resetNotice, setResetNotice] = useState("");
    const [showOldPasswordPrompt, setShowOldPasswordPrompt] = useState(false);
    const [adminChange, setAdminChange] = useState(null);

    // ── LOGIN ──────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await fetch(`${API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vellar_id: loginData.vellar_id, password: loginData.password }),
            });
            const data = await res.json();

            if (data.password_reset_required) {
                setResetData(d => ({ ...d, vellar_id: loginData.vellar_id }));
                setResetNotice("");
                setShowOldPasswordPrompt(true);
                setTab("reset");
                return;
            }

            if (data.status === "pending") {
                navigate("/waiting-room");
                return;
            }

            if (!res.ok) throw new Error(data.message || "Login failed.");

            if (data.password_change_required) {
                setAdminChange({
                    token: data.token,
                    current_password: loginData.password,
                    password: "",
                    password_confirmation: "",
                });
                setTab("admin-password");
                return;
            }

            localStorage.setItem("community_token", data.token);
            localStorage.setItem("auth_token", data.token);
            localStorage.setItem("community_user", JSON.stringify(data.user));
            navigate("/community/feed");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminPassword = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await fetch(`${API}/admin/password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminChange.token}`,
                },
                body: JSON.stringify({
                    current_password: adminChange.current_password,
                    password: adminChange.password,
                    password_confirmation: adminChange.password_confirmation,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not update the password.");
            localStorage.setItem("community_token", data.token);
            localStorage.setItem("auth_token", data.token);
            localStorage.setItem("community_user", JSON.stringify(data.user));
            navigate("/community/feed");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── REGISTER ───────────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        if (regData.password !== regData.password_confirmation) {
            setError("Passwords do not match.");
            return;
        }
        setError(""); setLoading(true);
        try {
            const res = await fetch(`${API}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(regData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Registration failed.");

            localStorage.removeItem("pending_vellar_id");
            localStorage.removeItem("pending_status_token");
            setResendNotice("");
            setSuccessData({ sent: true });
            setTab("success");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError(""); setResendNotice(""); setLoading(true);
        try {
            const res = await fetch(`${API}/register/resend`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ email: regData.email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not send another confirmation.");
            setResendNotice(data.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError(""); setResetNotice(""); setLoading(true);
        try {
            const res = await fetch(`${API}/password/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ vellar_id: resetData.vellar_id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not send a verification message.");
            setResetNotice(data.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReset = async (e) => {
        e.preventDefault();
        if (resetData.password !== resetData.password_confirmation) {
            setError("Passwords do not match.");
            return;
        }
        setError(""); setResetNotice(""); setLoading(true);
        try {
            const res = await fetch(`${API}/password/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(resetData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.errors?.password?.[0] || "Could not update the password.");
            setResetNotice(data.message);
            setTimeout(() => { setTab("login"); setResetNotice(""); }, 1600);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.root}>
            <PageLoader />
            <DynamicBackground />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                input::placeholder, select::placeholder { color: rgba(255,255,255,0.2); }
                input:focus, select:focus { border-color: rgba(0,212,236,0.4) !important; outline: none; }
                select option { background: #0d0d17; color: #fff; }
                .tab-btn:hover { color: rgba(255,255,255,0.7) !important; }
            `}</style>

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <img src="/images/logoImage/NUVRA_LOGO.webp" alt="Nuvra" style={styles.logoImg} onClick={() => navigate("/")} />
                    <h1 style={styles.title}>Vellar League</h1>
                    <p style={styles.subtitle}>Official Tournament & League Platform</p>
                </div>

                {/* Card */}
                <div className="glass-panel" style={styles.card}>

                    {/* ── LOGIN TAB ── */}
                    {tab === "login" && (
                        <>
                            <div style={styles.tabBar}>
                                <button className="tab-btn" style={{ ...styles.tabBtn, ...styles.tabActive }}>Sign In</button>
                                <button className="tab-btn" style={styles.tabBtn} onClick={() => { setTab("register"); setError(""); }}>Create Account</button>
                            </div>

                            {error && <div style={styles.errorBox}>⚠ {error}</div>}

                            <form onSubmit={handleLogin} style={styles.form}>
                                {/* Vellar ID */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Vellar ID</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={styles.vellarPrefix}>VELLAR</span>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            value={loginData.vellar_id}
                                            onChange={e => { setError(""); setLoginData({ ...loginData, vellar_id: e.target.value }); }}
                                            style={{ ...styles.input, paddingLeft: 76 }}
                                            required
                                        />
                                    </div>
                                    <span style={styles.hint}>Player: enter ID number (e.g. <strong style={{ color: "rgba(255,255,255,0.5)" }}>123</strong>). Admin: enter full email.</span>
                                </div>

                                {/* Password */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={loginData.password}
                                        onChange={e => { setError(""); setLoginData({ ...loginData, password: e.target.value }); }}
                                        style={styles.input}
                                        required
                                    />
                                </div>

                                <button style={styles.submitBtn} type="submit" disabled={loading}>
                                    {loading ? "Signing in…" : "SIGN IN →"}
                                </button>
                            </form>

                            <p style={styles.browseHint} onClick={() => { setError(""); setResetNotice(""); setTab("reset"); }}>
                                First time or forgot password? Verify and set a new one →
                            </p>
                            <p style={styles.browseHint} onClick={() => navigate("/community/feed")}>
                                Browse tournaments without signing in →
                            </p>
                        </>
                    )}

                    {tab === "admin-password" && adminChange && (
                        <>
                            <div style={styles.tabBar}>
                                <button className="tab-btn" style={{ ...styles.tabBtn, ...styles.tabActive }}>New Password</button>
                            </div>
                            {error && <div style={styles.errorBox}>⚠ {error}</div>}
                            <p style={styles.hint}>This admin password is a shared default. Set a new one of at least 12 characters, with upper and lower case letters and a number, before opening the league.</p>
                            <form onSubmit={handleAdminPassword} style={styles.form}>
                                <input type="password" placeholder="New password" value={adminChange.password} onChange={e => { setError(""); setAdminChange({ ...adminChange, password: e.target.value }); }} style={styles.input} required />
                                <input type="password" placeholder="Confirm new password" value={adminChange.password_confirmation} onChange={e => { setError(""); setAdminChange({ ...adminChange, password_confirmation: e.target.value }); }} style={styles.input} required />
                                <button style={styles.submitBtn} type="submit" disabled={loading}>{loading ? "Saving…" : "SAVE PASSWORD →"}</button>
                            </form>
                        </>
                    )}

                    {tab === "reset" && (
                        <>
                            <div style={styles.tabBar}>
                                <button className="tab-btn" style={styles.tabBtn} onClick={() => { setTab("login"); setError(""); setResetNotice(""); setShowOldPasswordPrompt(false); }}>Sign In</button>
                                <button className="tab-btn" style={{ ...styles.tabBtn, ...styles.tabActive }}>Set Password</button>
                            </div>
                            {showOldPasswordPrompt && <p style={styles.hint}>Your old password no longer works. Tap Send verification to get a code, then choose a new password.</p>}
                            {error && <div style={styles.errorBox}>⚠ {error}</div>}
                            {resetNotice && <div style={{ ...styles.errorBox, color: "#00D4EC", borderColor: "rgba(0,212,236,0.3)" }}>{resetNotice}</div>}
                            <p style={styles.hint}>We only accept a code sent to the email or phone on your account, or a one-time code from a league admin. A new password needs at least 8 characters and cannot be the shared default.</p>
                            <form onSubmit={handleRequestReset} style={styles.form}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Vellar ID</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={styles.vellarPrefix}>VELLAR</span>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            value={resetData.vellar_id}
                                            onChange={e => { setError(""); setResetData({ ...resetData, vellar_id: e.target.value }); }}
                                            style={{ ...styles.input, paddingLeft: 76 }}
                                            required
                                        />
                                    </div>
                                </div>
                                <button style={{ ...styles.submitBtn, background: "rgba(255,255,255,0.08)", color: "#fff" }} type="submit" disabled={loading}>
                                    {loading ? "Sending…" : "SEND VERIFICATION"}
                                </button>
                            </form>
                            <form onSubmit={handleConfirmReset} style={{ ...styles.form, marginTop: 18 }}>
                                <input type="text" placeholder="Verification or activation code" value={resetData.code}
                                    onChange={e => { setError(""); setResetData({ ...resetData, code: e.target.value }); }} style={styles.input} required />
                                <input type="password" placeholder="New password (min. 8)" value={resetData.password}
                                    onChange={e => { setError(""); setResetData({ ...resetData, password: e.target.value }); }} style={styles.input} required />
                                <input type="password" placeholder="Confirm new password" value={resetData.password_confirmation}
                                    onChange={e => { setError(""); setResetData({ ...resetData, password_confirmation: e.target.value }); }} style={styles.input} required />
                                <button style={styles.submitBtn} type="submit" disabled={loading}>
                                    {loading ? "Saving…" : "SAVE PASSWORD"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── REGISTER TAB ── */}
                    {tab === "register" && (
                        <>
                            <div style={styles.tabBar}>
                                <button className="tab-btn" style={styles.tabBtn} onClick={() => { setTab("login"); setError(""); }}>Sign In</button>
                                <button className="tab-btn" style={{ ...styles.tabBtn, ...styles.tabActive }}>Create Account</button>
                            </div>

                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16, lineHeight: 1.6 }}>
                                Use an email you can open. Confirm that email, then wait for an administrator. The Vellar ID arrives by email after approval and is not shown here.
                            </p>

                            {error && <div style={styles.errorBox}>⚠ {error}</div>}

                            <form onSubmit={handleRegister} style={styles.form}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Full Name</label>
                                    <input type="text" placeholder="Your full name" value={regData.name}
                                        onChange={e => { setError(""); setRegData({ ...regData, name: e.target.value }); }}
                                        style={styles.input} required />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Email</label>
                                    <input type="email" placeholder="you@example.com" value={regData.email}
                                        onChange={e => { setError(""); setRegData({ ...regData, email: e.target.value }); }}
                                        style={styles.input} required />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Phone Number</label>
                                    <input type="tel" placeholder="Optional" value={regData.phone}
                                        onChange={e => setRegData({ ...regData, phone: e.target.value })}
                                        style={styles.input} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Position</label>
                                    <select value={regData.position}
                                        onChange={e => setRegData({ ...regData, position: e.target.value })}
                                        style={{ ...styles.input, appearance: "none" }}>
                                        <option value="">-- Select position --</option>
                                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Password</label>
                                    <input type="password" placeholder="Min. 8 characters" value={regData.password}
                                        onChange={e => { setError(""); setRegData({ ...regData, password: e.target.value }); }}
                                        style={styles.input} required />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Confirm Password</label>
                                    <input type="password" placeholder="••••••••" value={regData.password_confirmation}
                                        onChange={e => { setError(""); setRegData({ ...regData, password_confirmation: e.target.value }); }}
                                        style={styles.input} required />
                                </div>
                                <button style={styles.submitBtn} type="submit" disabled={loading}>
                                    {loading ? "Submitting application…" : "SUBMIT APPLICATION →"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── SUCCESS (Post Register) ── */}
                    {tab === "success" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "8px 0" }}>
                            <div style={{ fontSize: 48 }}>✅</div>
                            <div style={{ textAlign: "center" }}>
                                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Check your email</h2>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                                    If this address can be used, a confirmation message has been sent. The Vellar ID is emailed only after an administrator approves the account. It is not shown here.
                                </p>
                            </div>
                            {error && <div style={styles.errorBox}>⚠ {error}</div>}
                            {resendNotice && <div style={{ ...styles.errorBox, color: "#00D4EC", borderColor: "rgba(0,212,236,0.3)" }}>{resendNotice}</div>}
                            <button style={{ ...styles.submitBtn, background: "rgba(255,255,255,0.08)", color: "#fff" }} type="button" onClick={handleResend} disabled={loading}>
                                {loading ? "Sending…" : "RESEND CONFIRMATION"}
                            </button>
                            <button style={styles.submitBtn} onClick={() => { setTab("login"); setError(""); }}>
                                Back to Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    root: {
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
    },
    container: { position: "relative", zIndex: 1, width: "100%", maxWidth: 420 },
    header: { textAlign: "center", marginBottom: 32 },
    logoImg: { height: 56, width: "auto", objectFit: "contain", display: "block", margin: "0 auto 16px", cursor: "pointer" },
    title: { fontFamily: "'Inter', sans-serif", fontSize: 36, fontWeight: 900, letterSpacing: 0.5, lineHeight: 1, color: "#fff" },
    subtitle: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8, fontWeight: 500 },
    card: { padding: 40, display: "flex", flexDirection: "column" },
    tabBar: { display: "flex", gap: 4, background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 4, marginBottom: 24 },
    tabBtn: {
        flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
        background: "transparent", color: "rgba(255,255,255,0.4)",
        fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
        fontFamily: "inherit",
    },
    tabActive: { background: "linear-gradient(135deg, #00D4EC, #D040EF)", color: "#080810" },
    vellarPrefix: {
        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
        fontSize: 11, fontWeight: 800, color: "#00D4EC", letterSpacing: 1,
        pointerEvents: "none",
    },
    hint: { fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 },
    errorBox: {
        background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)",
        borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600,
        color: "#ff8080", marginBottom: 16,
    },
    form: { display: "flex", flexDirection: "column", gap: 16 },
    label: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 },
    input: {
        width: "100%", padding: "12px 16px", borderRadius: 10,
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff", fontSize: 14, fontFamily: "inherit",
        transition: "border-color 0.2s",
    },
    submitBtn: {
        marginTop: 8, padding: "14px", borderRadius: 12, border: "none",
        background: "linear-gradient(135deg, #00D4EC, #D040EF)",
        color: "#080810", fontSize: 14, fontWeight: 800, cursor: "pointer",
        letterSpacing: 0.5, transition: "opacity 0.2s", fontFamily: "inherit",
        width: "100%",
    },
    browseHint: {
        textAlign: "center", marginTop: 20, fontSize: 12,
        color: "rgba(255,255,255,0.3)", cursor: "pointer", transition: "color 0.2s",
    },
    vellarCard: {
        background: "linear-gradient(135deg, rgba(0,212,236,0.1), rgba(208,64,239,0.1))",
        border: "1px solid rgba(0,212,236,0.2)",
        borderRadius: 14, padding: "20px 32px", textAlign: "center", width: "100%",
    },
};
