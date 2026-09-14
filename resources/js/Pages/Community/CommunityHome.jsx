import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

const POSITIONS = [
    'Penjaga Gol (Goalkeeper)',
    'Bek (Defender)',
    'Gelandang (Midfielder)',
    'Penyerang (Forward / Striker)',
];

export default function CommunityHome() {
    const navigate = useNavigate();
    const [tab, setTab] = useState("login"); // 'login' | 'register' | 'success'

    useEffect(() => {
        const token = localStorage.getItem("community_token");
        if (token) navigate("/community/feed", { replace: true });
    }, []);

    const [error, setError]       = useState("");
    const [loading, setLoading]   = useState(false);
    const [successData, setSuccessData] = useState(null);

    const [loginData, setLoginData] = useState({ vellar_id: "", password: "" });
    const [regData, setRegData]     = useState({ name: "", phone: "", position: "", password: "", password_confirmation: "" });

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

            if (data.status === "pending") {
                // Redirect ke waiting room
                localStorage.setItem("pending_vellar_id", loginData.vellar_id);
                navigate("/waiting-room");
                return;
            }

            if (!res.ok) throw new Error(data.message || "Log masuk gagal.");

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
            setError("Kata laluan tidak sepadan.");
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
            if (!res.ok) throw new Error(data.message || "Pendaftaran gagal.");

            // Show success with Vellar ID
            setSuccessData({ vellar_id: data.vellar_id, vellar_number: data.vellar_number, name: data.name });
            setTab("success");
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
                    <p style={styles.subtitle}>Platform Liga & Kejohanan Rasmi</p>
                </div>

                {/* Card */}
                <div className="glass-panel" style={styles.card}>

                    {/* ── LOGIN TAB ── */}
                    {tab === "login" && (
                        <>
                            <div style={styles.tabBar}>
                                <button className="tab-btn" style={{ ...styles.tabBtn, ...styles.tabActive }}>Log Masuk</button>
                                <button className="tab-btn" style={styles.tabBtn} onClick={() => { setTab("register"); setError(""); }}>Daftar Baharu</button>
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
                                            placeholder="82"
                                            value={loginData.vellar_id}
                                            onChange={e => { setError(""); setLoginData({ ...loginData, vellar_id: e.target.value }); }}
                                            style={{ ...styles.input, paddingLeft: 76 }}
                                            required
                                        />
                                    </div>
                                    <span style={styles.hint}>Pemain: taip nombor (cth: <strong style={{ color: "rgba(255,255,255,0.5)" }}>82</strong>). Admin: guna email penuh.</span>
                                </div>

                                {/* Password */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Kata Laluan</label>
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
                                    {loading ? "Log masuk…" : "LOG MASUK →"}
                                </button>
                            </form>

                            <p style={styles.browseHint} onClick={() => navigate("/community/feed")}>
                                Layari kejohanan tanpa log masuk →
                            </p>
                        </>
                    )}

                    {/* ── REGISTER TAB ── */}
                    {tab === "register" && (
                        <>
                            <div style={styles.tabBar}>
                                <button className="tab-btn" style={styles.tabBtn} onClick={() => { setTab("login"); setError(""); }}>Log Masuk</button>
                                <button className="tab-btn" style={{ ...styles.tabBtn, ...styles.tabActive }}>Daftar Baharu</button>
                            </div>

                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16, lineHeight: 1.6 }}>
                                Vellar ID akan dijana automatik. Perlu kelulusan admin sebelum boleh log masuk.
                            </p>

                            {error && <div style={styles.errorBox}>⚠ {error}</div>}

                            <form onSubmit={handleRegister} style={styles.form}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Nama Penuh</label>
                                    <input type="text" placeholder="Nama anda" value={regData.name}
                                        onChange={e => { setError(""); setRegData({ ...regData, name: e.target.value }); }}
                                        style={styles.input} required />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>No. Telefon</label>
                                    <input type="tel" placeholder="01X-XXXXXXX" value={regData.phone}
                                        onChange={e => setRegData({ ...regData, phone: e.target.value })}
                                        style={styles.input} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Posisi Bermain</label>
                                    <select value={regData.position}
                                        onChange={e => setRegData({ ...regData, position: e.target.value })}
                                        style={{ ...styles.input, appearance: "none" }}>
                                        <option value="">-- Pilih posisi --</option>
                                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Kata Laluan</label>
                                    <input type="password" placeholder="Min. 6 aksara" value={regData.password}
                                        onChange={e => { setError(""); setRegData({ ...regData, password: e.target.value }); }}
                                        style={styles.input} required />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={styles.label}>Sahkan Kata Laluan</label>
                                    <input type="password" placeholder="••••••••" value={regData.password_confirmation}
                                        onChange={e => { setError(""); setRegData({ ...regData, password_confirmation: e.target.value }); }}
                                        style={styles.input} required />
                                </div>
                                <button style={styles.submitBtn} type="submit" disabled={loading}>
                                    {loading ? "Mendaftar…" : "HANTAR PERMOHONAN →"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── SUCCESS (Post Register) ── */}
                    {tab === "success" && successData && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "8px 0" }}>
                            <div style={{ fontSize: 48 }}>✅</div>
                            <div style={{ textAlign: "center" }}>
                                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Pendaftaran Berjaya!</h2>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                                    Permohonan anda sedang menunggu kelulusan admin NUVRA.
                                </p>
                            </div>
                            {/* Vellar ID card */}
                            <div style={styles.vellarCard}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Vellar ID Anda</p>
                                <p style={{ fontFamily: "monospace", fontSize: 36, fontWeight: 900, color: "#00D4EC", letterSpacing: 2 }}>{successData.vellar_id}</p>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{successData.name}</p>
                            </div>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.7 }}>
                                💡 Simpan ID ini. Selepas admin luluskan, log masuk dengan nombor <strong style={{ color: "#00D4EC" }}>{successData.vellar_number}</strong> dan kata laluan anda.
                            </p>
                            <button style={styles.submitBtn} onClick={() => { setTab("login"); setError(""); }}>
                                Kembali ke Log Masuk
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
