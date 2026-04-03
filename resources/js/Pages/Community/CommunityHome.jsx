import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api/community";

export default function CommunityHome() {
    const navigate = useNavigate();
    const [tab, setTab] = useState("login"); // 'login' | 'register'
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [regData, setRegData] = useState({ name: "", email: "", password: "", phone: "" });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
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
        setError(""); setLoading(true);
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

    return (
        <div style={styles.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #080810; }
            `}</style>

            {/* Background */}
            <div style={styles.bg}>
                <div style={styles.bgGlow1} />
                <div style={styles.bgGlow2} />
                <div style={styles.bgGrid} />
            </div>

            {/* Back to portal */}
            <button style={styles.backBtn} onClick={() => navigate("/")}>← Back to Nuvra</button>

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.iconWrap}>🏘️</div>
                    <h1 style={styles.title}>Nuvra Community</h1>
                    <p style={styles.subtitle}>Football for everyone — no club required</p>
                </div>

                {/* Card */}
                <div style={styles.card}>
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

                    {tab === "login" ? (
                        <form onSubmit={handleLogin} style={styles.form}>
                            <Field label="Email" type="email" placeholder="you@email.com"
                                value={loginData.email} onChange={v => setLoginData({ ...loginData, email: v })} />
                            <Field label="Password" type="password" placeholder="••••••••"
                                value={loginData.password} onChange={v => setLoginData({ ...loginData, password: v })} />
                            <button style={styles.submitBtn} type="submit" disabled={loading}>
                                {loading ? "Signing in..." : "SIGN IN →"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} style={styles.form}>
                            <Field label="Full Name" type="text" placeholder="Your name"
                                value={regData.name} onChange={v => setRegData({ ...regData, name: v })} />
                            <Field label="Email" type="email" placeholder="you@email.com"
                                value={regData.email} onChange={v => setRegData({ ...regData, email: v })} />
                            <Field label="Phone (optional)" type="text" placeholder="+60 12 345 6789"
                                value={regData.phone} onChange={v => setRegData({ ...regData, phone: v })} />
                            <Field label="Password" type="password" placeholder="Min. 6 characters"
                                value={regData.password} onChange={v => setRegData({ ...regData, password: v })} />
                            <button style={styles.submitBtn} type="submit" disabled={loading}>
                                {loading ? "Creating account..." : "JOIN THE COMMUNITY →"}
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
        fontFamily: "'Inter', sans-serif",
        minHeight: "100vh",
        background: "#080810",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
        overflow: "hidden",
    },
    bg: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" },
    bgGlow1: {
        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,135,0.12) 0%, transparent 70%)",
    },
    bgGlow2: {
        position: "absolute", bottom: "-10%", right: "10%",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,201,255,0.08) 0%, transparent 70%)",
    },
    bgGrid: {
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
    },
    backBtn: {
        position: "fixed", top: 20, left: 24, zIndex: 100,
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.6)", padding: "8px 16px", borderRadius: 8,
        fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
        fontFamily: "inherit",
    },
    container: { position: "relative", zIndex: 1, width: "100%", maxWidth: 420 },
    header: { textAlign: "center", marginBottom: 32 },
    iconWrap: { fontSize: 48, marginBottom: 12 },
    title: { fontFamily: "'Bebas Neue', cursive", fontSize: 48, letterSpacing: 3, lineHeight: 1 },
    subtitle: { color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 8, fontWeight: 500 },
    card: {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, padding: 32,
        backdropFilter: "blur(20px)",
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
        background: "linear-gradient(135deg, #00ff87, #00c9ff)",
        color: "#080810",
    },
    errorBox: {
        background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)",
        borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600,
        color: "#ff8080", marginBottom: 16,
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
        background: "linear-gradient(135deg, #00ff87, #00c9ff)",
        color: "#080810", fontSize: 14, fontWeight: 800, cursor: "pointer",
        letterSpacing: 0.5, transition: "opacity 0.2s", fontFamily: "inherit",
    },
    browseHint: {
        textAlign: "center", marginTop: 20, fontSize: 12,
        color: "rgba(255,255,255,0.3)", cursor: "pointer",
        transition: "color 0.2s",
    },
};
