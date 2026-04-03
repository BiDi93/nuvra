import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api/community";

export default function PostAnnouncement() {
    const navigate = useNavigate();
    const token = localStorage.getItem("community_token");
    const user = JSON.parse(localStorage.getItem("community_user") || "null");

    const [form, setForm] = useState({ title: "", body: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!user || user.role !== "admin") {
        return (
            <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Inter, sans-serif" }}>
                Access denied. Admins only.
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await fetch(`${API}/announcements`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            navigate("/community/announcements");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.root}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body{background:#080810;}`}</style>
            <div style={styles.bgGlow} />

            <nav style={styles.nav}>
                <button style={styles.backBtn} onClick={() => navigate("/community/announcements")}>← Announcements</button>
                <span style={styles.navBrand}>NUVRA Community</span>
                <span style={styles.adminBadge}>👑 Admin</span>
            </nav>

            <div style={styles.content}>
                <h1 style={styles.title}>Post Announcement</h1>
                <p style={styles.subtitle}>Visible to all community members.</p>

                {error && <div style={styles.errorBox}>⚠ {error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div>
                        <label style={styles.label}>Title *</label>
                        <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Announcement title..." style={styles.input} required />
                    </div>
                    <div>
                        <label style={styles.label}>Message *</label>
                        <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                            placeholder="Write your announcement here..." rows={6}
                            style={{ ...styles.input, resize: "vertical", lineHeight: 1.7 }} required />
                    </div>
                    <button style={styles.submitBtn} type="submit" disabled={loading}>
                        {loading ? "Posting..." : "📢 POST ANNOUNCEMENT"}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    root: { fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#080810", color: "#fff" },
    bgGlow: { position: "fixed", top: 0, left: 0, right: 0, height: "40vh", zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,201,255,0.06) 0%, transparent 70%)" },
    nav: { position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "rgba(8,8,16,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
    backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    navBrand: { fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2 },
    adminBadge: { fontSize: 12, color: "rgba(255,215,0,0.8)", fontWeight: 600 },
    content: { position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "40px 24px 80px" },
    title: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
    subtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 },
    errorBox: { background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ff8080", marginBottom: 20 },
    form: { display: "flex", flexDirection: "column", gap: 20 },
    label: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" },
    input: { width: "100%", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" },
    submitBtn: { padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #00c9ff, #a78bfa)", color: "#080810", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
};
