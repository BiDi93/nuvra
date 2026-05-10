import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

export default function CommunityHome() {
    const navigate = useNavigate();
    const [tab, setTab] = useState("login"); // 'login' | 'register' | 'forgot'
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [regData, setRegData] = useState({ name: "", email: "", password: "", phone: "" });
    const [forgotData, setForgotData] = useState({ email: "" });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); setMessage(""); setLoading(true);
        try {
            const res = await fetch(`${API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Login failed");
            localStorage.setItem("community_token", data.token);
            localStorage.setItem("community_user", JSON.stringify(data.user));
            navigate("/community/feed");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(""); setMessage(""); setLoading(true);
        try {
            const res = await fetch(`${API}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(regData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Registration failed");
            localStorage.setItem("community_token", data.token);
            localStorage.setItem("community_user", JSON.stringify(data.user));
            navigate("/community/feed");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError(""); setMessage(""); setLoading(true);
        try {
            const res = await fetch(`/api/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(forgotData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to send reset link.");
            setMessage(data.message);
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
            `}</style>



            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="Nuvra" style={styles.iconWrap} onClick={() => navigate("/")} />
                    <h1 style={styles.title}>Nuvra Community</h1>
                    <p style={styles.subtitle}>Football for everyone — no club required</p>
                </div>

                {/* Card */}
                <div className="glass-panel" style={styles.card}>
                    {/* Tab switcher */}
                    <div style={styles.tabBar}>
                        {["login", "register"].map(t => (
                            <button
                                key={t}
                                style={{ ...styles.tabBtn, ...(tab === t ? styles.tabActive : {}) }}
                                onClick={() => { setTab(t); setError(""); }}
                            >
                                {t === "login" ? "Sign In" : "Create Account"}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div style={styles.errorBox}>⚠ {error}</div>
                    )}
                    {message && (
                        <div style={styles.successMsg}>{message}</div>
                    )}

                    {tab === "login" ? (
                        <form onSubmit={handleLogin} style={styles.form}>
                            <Field label="Email" type="email" placeholder="you@email.com"
                                value={loginData.email} onChange={v => setLoginData({ ...loginData, email: v })} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={styles.label}>Password</label>
                                    <button type="button" style={{ background: 'none', border: 'none', color: '#D040EF', fontSize: 11, cursor: 'pointer', fontWeight: 700 }} onClick={() => { setTab("forgot"); setError(""); setMessage(""); }}>
                                        Forgot Password?
                                    </button>
                                </div>
                                <input
                                    style={styles.input}
                                    type="password"
                                    placeholder="••••••••"
                                    value={loginData.password}
                                    onChange={e => { setError(""); setLoginData({ ...loginData, password: e.target.value }) }}
                                    required
                                />
                            </div>
                            <button style={styles.submitBtn} type="submit" disabled={loading}>
                                {loading ? "Signing in..." : "SIGN IN →"}
                            </button>
                        </form>
                    ) : tab === "register" ? (
                        <form onSubmit={handleRegister} style={styles.form}>
                            <Field label="Full Name" type="text" placeholder="Your name"
                                value={regData.name} onChange={v => setRegData({ ...regData, name: v })} />
                            <Field label="Email" type="email" placeholder="you@email.com"
                                value={regData.email} onChange={v => setRegData({ ...regData, email: v })} />
                            <Field label="Phone (Optional)" type="tel" placeholder="+60123456789"
                                value={regData.phone} onChange={v => setRegData({ ...regData, phone: v })} />
                            <Field label="Password" type="password" placeholder="••••••••"
                                value={regData.password} onChange={v => setRegData({ ...regData, password: v })} />
                            <button style={styles.submitBtn} type="submit" disabled={loading}>
                                {loading ? "Creating account..." : "JOIN THE COMMUNITY →"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleForgotPassword} style={styles.form}>
                            <Field label="Email" type="email" placeholder="you@email.com"
                                value={forgotData.email} onChange={v => setForgotData({ ...forgotData, email: v })} />
                            <button style={styles.submitBtn} type="submit" disabled={loading}>
                                {loading ? "Sending Link..." : "SEND RESET LINK →"}
                            </button>
                            <button type="button" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', marginTop: 10 }} onClick={() => { setTab("login"); setError(""); setMessage(""); }}>
                                ← Back to login
                            </button>
                        </form>
                    )}

                    <p style={styles.browseHint} onClick={() => navigate("/community/feed")}>
                        Browse upcoming games without signing in →
                    </p>
                </div>
            </div>
        </div>
    );
}

function Field({ label, type, placeholder, value, onChange }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={styles.label}>{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={styles.input}
                required={!label.includes("optional")}
            />
        </div>
    );
}

const styles = {
    root: {
        fontFamily: "var(--font-sans)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
    },
    container: { position: "relative", zIndex: 1, width: "100%", maxWidth: 420 },
    header: { textAlign: "center", marginBottom: 32 },
    iconWrap: { height: 56, width: "auto", objectFit: "contain", display: "block", margin: "0 auto 16px", cursor: "pointer" },
    title: { fontFamily: "'Inter', sans-serif", fontSize: 42, fontWeight: 900, letterSpacing: 1, lineHeight: 1 },
    subtitle: { color: "var(--text-muted)", fontSize: 14, marginTop: 8, fontWeight: 500 },
    card: {
        padding: 40,
        display: "flex",
        flexDirection: "column",
    },
    tabBar: {
        display: "flex", gap: 4,
        background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 4, marginBottom: 24,
    },
    tabBtn: {
        flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
        background: "transparent", color: "rgba(255,255,255,0.45)",
        fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
        fontFamily: "inherit",
    },
    tabActive: {
        background: "linear-gradient(135deg, #00D4EC, #D040EF)",
        color: "#080810",
    },
    errorBox: {
        background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)",
        borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600,
        color: "#ff8080", marginBottom: 16,
    },
    successMsg: {
        background: "rgba(0,212,236,0.1)", border: "1px solid rgba(0,212,236,0.3)",
        borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600,
        color: "#00D4EC", marginBottom: 16,
    },
    form: { display: "flex", flexDirection: "column", gap: 16 },
    label: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 },
    input: {
        padding: "12px 16px", borderRadius: 10,
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none",
    },
    submitBtn: {
        marginTop: 8, padding: "14px", borderRadius: 12, border: "none",
        background: "linear-gradient(135deg, #00D4EC, #D040EF)",
        color: "#080810", fontSize: 14, fontWeight: 800, cursor: "pointer",
        letterSpacing: 0.5, transition: "opacity 0.2s", fontFamily: "inherit",
    },
    browseHint: {
        textAlign: "center", marginTop: 20, fontSize: 12,
        color: "rgba(255,255,255,0.3)", cursor: "pointer",
        transition: "color 0.2s",
    },
};
