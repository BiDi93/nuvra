import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api/community";

export default function CreateGame() {
    const navigate = useNavigate();
    const token = localStorage.getItem("community_token");
    const user = JSON.parse(localStorage.getItem("community_user") || "null");

    const [form, setForm] = useState({
        title: "", description: "", venue: "",
        game_date: "", team_a_name: "Team A", team_b_name: "Team B",
        max_slots_per_team: 20,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Guard non-admin
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
            const res = await fetch(`${API}/games`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create game");
            navigate("/community/feed");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div style={styles.root}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body{background:#080810;}`}</style>
            <div style={styles.bgGlow} />

            <nav style={styles.nav}>
                <button style={styles.backBtn} onClick={() => navigate("/community/feed")}>← Feed</button>
                <span style={styles.navBrand}>NUVRA Community</span>
                <span style={styles.adminBadge}>👑 Admin</span>
            </nav>

            <div style={styles.content}>
                <h1 style={styles.title}>Post a New Game</h1>
                <p style={styles.subtitle}>Fill in the details. All registered community players will be notified by email.</p>

                {error && <div style={styles.errorBox}>⚠ {error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <Field label="Game Title *" value={form.title} onChange={v => set("title", v)} placeholder="e.g. Midnight Futsal — Cheras" />

                    <div style={styles.row}>
                        <Field label="Team A Name" value={form.team_a_name} onChange={v => set("team_a_name", v)} placeholder="Team A" />
                        <Field label="Team B Name" value={form.team_b_name} onChange={v => set("team_b_name", v)} placeholder="Team B" />
                    </div>

                    <Field label="Venue *" value={form.venue} onChange={v => set("venue", v)} placeholder="e.g. Cheras Futsal Arena, Kuala Lumpur" />

                    <div style={styles.row}>
                        <div style={{ flex: 2 }}>
                            <label style={styles.label}>Date & Time *</label>
                            <input
                                type="datetime-local"
                                value={form.game_date}
                                onChange={e => set("game_date", e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={styles.label}>Max Per Team</label>
                            <input
                                type="number"
                                min={1} max={20}
                                value={form.max_slots_per_team}
                                onChange={e => set("max_slots_per_team", parseInt(e.target.value))}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    {/* Seat preview */}
                    <div style={styles.seatPreviewWrap}>
                        <div style={styles.seatPreviewLabel}>Seat Preview — {form.max_slots_per_team} slots per team</div>
                        <div style={styles.seatGrid}>
                            {Array.from({ length: form.max_slots_per_team }).map((_, i) => (
                                <div key={i} style={styles.seat} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={styles.label}>Description (optional)</label>
                        <textarea
                            value={form.description}
                            onChange={e => set("description", e.target.value)}
                            placeholder="Add any extra info about the game..."
                            rows={3}
                            style={{ ...styles.input, resize: "vertical", lineHeight: 1.6 }}
                        />
                    </div>

                    <button style={styles.submitBtn} type="submit" disabled={loading}>
                        {loading ? "Posting..." : "📣 POST GAME & NOTIFY PLAYERS"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={styles.label}>{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                style={styles.input} required={label.includes("*")} />
        </div>
    );
}

const styles = {
    root: { fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#080810", color: "#fff" },
    bgGlow: { position: "fixed", top: 0, left: 0, right: 0, height: "40vh", zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,255,135,0.07) 0%, transparent 70%)" },
    nav: { position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "rgba(8,8,16,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
    backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    navBrand: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, letterSpacing: 2 },
    adminBadge: { fontSize: 12, fontWeight: 600, color: "rgba(255,215,0,0.8)" },
    content: { position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" },
    title: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
    subtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 },
    errorBox: { background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ff8080", marginBottom: 20 },
    form: { display: "flex", flexDirection: "column", gap: 20 },
    row: { display: "flex", gap: 16 },
    label: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" },
    input: { width: "100%", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" },
    seatPreviewWrap: { background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.1)", borderRadius: 12, padding: 16 },
    seatPreviewLabel: { fontSize: 12, fontWeight: 600, color: "rgba(0,255,135,0.6)", marginBottom: 12 },
    seatGrid: { display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 },
    seat: { height: 16, borderRadius: 4, background: "rgba(0,255,135,0.2)", border: "1px solid rgba(0,255,135,0.3)" },
    submitBtn: { padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #00ff87, #00c9ff)", color: "#080810", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 8 },
};
