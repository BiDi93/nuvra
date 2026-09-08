import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api/community";
const BRAND_CYAN = "#00D4EC";

export default function CreateTournament() {
    const navigate = useNavigate();
    const token = localStorage.getItem("community_token");
    const user = JSON.parse(localStorage.getItem("community_user") || "null");

    const [form, setForm] = useState({
        name: "",
        format: "league",
        season: "Season 1 (2026)",
        venue: "",
        description: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!user || (user.role !== "admin" && user.role !== "club_owner")) {
        return (
            <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
                Akses dinafikan. Hanya penganjur liga boleh mengakses halaman ini.
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API}/tournaments`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal mencipta kejohanan");
            navigate(`/community/admin/tournaments/${data.tournament.id}/manage`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div style={S.root}>
            <div style={S.container}>
                <div style={S.topBar}>
                    <button style={S.backBtn} onClick={() => navigate("/community/feed")}>
                        ← KEMBALI KE LIGA
                    </button>
                    <span style={S.adminBadge}>⚽ PENGANJUR LIGA</span>
                </div>

                <div style={S.headerArea}>
                    <h1 style={S.title}>Cipta Kejohanan / Liga Baru</h1>
                    <p style={S.subtitle}>Mulakan kejohanan anda, tentukan format, dan jana jadual kedudukan secara automatik.</p>
                </div>

                {error && <div style={S.errorBox}>⚠ {error}</div>}

                <form onSubmit={handleSubmit} style={S.formCard}>
                    {/* Tournament Format Selector */}
                    <div>
                        <label style={S.label}>Format Kejohanan *</label>
                        <div style={S.formatGrid}>
                            <button
                                type="button"
                                onClick={() => set("format", "league")}
                                style={{
                                    ...S.formatCard,
                                    ...(form.format === "league" ? S.activeFormatCard : {})
                                }}
                            >
                                <div style={S.formatIcon}>🏆</div>
                                <div style={S.formatTitle}>Liga (Round-Robin)</div>
                                <div style={S.formatDesc}>Satu pusingan atau timbal balik dengan jadual kedudukan mata automatik.</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => set("format", "knockout")}
                                style={{
                                    ...S.formatCard,
                                    ...(form.format === "knockout" ? S.activeFormatCard : {})
                                }}
                            >
                                <div style={S.formatIcon}>⚔️</div>
                                <div style={S.formatTitle}>Kalah Mati (Knockout)</div>
                                <div style={S.formatDesc}>Suku akhir, separuh akhir & perlawanan akhir penentuan juara.</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => set("format", "group_knockout")}
                                style={{
                                    ...S.formatCard,
                                    ...(form.format === "group_knockout" ? S.activeFormatCard : {})
                                }}
                            >
                                <div style={S.formatIcon}>🌐</div>
                                <div style={S.formatTitle}>Kumpulan + Kalah Mati</div>
                                <div style={S.formatDesc}>Format Piala Dunia (Group A, B... mara ke pusingan kalah mati).</div>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={S.label}>Nama Kejohanan / Liga *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            placeholder="cth: Vellar League Bangi, Liga Amatur Cheras"
                            style={S.input}
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                            <label style={S.label}>Musim / Edisi</label>
                            <input
                                type="text"
                                value={form.season}
                                onChange={(e) => set("season", e.target.value)}
                                placeholder="cth: Season 1 (2026)"
                                style={S.input}
                            />
                        </div>
                        <div>
                            <label style={S.label}>Gelanggang / Lokasi Utama *</label>
                            <input
                                type="text"
                                value={form.venue}
                                onChange={(e) => set("venue", e.target.value)}
                                placeholder="cth: Uptown Sports Bangi"
                                style={S.input}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={S.label}>Penerangan / Syarat Peraturan Liga</label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="Peraturan pertandingan, yuran pendaftaran, penggantungan kad..."
                            style={{ ...S.input, resize: "vertical" }}
                        />
                    </div>

                    <button type="submit" disabled={loading} style={S.submitBtn}>
                        {loading ? "Mencipta Kejohanan..." : "Teruskan ke Pengurusan Pasukan →"}
                    </button>
                </form>
            </div>
        </div>
    );
}

const S = {
    root: {
        minHeight: "100vh",
        padding: "20px 16px 80px",
        fontFamily: "'Inter', sans-serif",
        color: "#fff",
    },
    container: {
        maxWidth: 760,
        margin: "0 auto",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    backBtn: {
        background: "none",
        border: "none",
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
    },
    adminBadge: {
        background: "rgba(0, 212, 236, 0.1)",
        color: BRAND_CYAN,
        border: "1px solid rgba(0, 212, 236, 0.3)",
        fontSize: 11,
        fontWeight: 900,
        padding: "4px 10px",
        borderRadius: 6,
    },
    headerArea: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.5)",
    },
    errorBox: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#f87171",
        padding: "12px 16px",
        borderRadius: 8,
        marginBottom: 20,
        fontSize: 13,
    },
    formCard: {
        background: "rgba(18, 22, 32, 0.8)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 20,
    },
    label: {
        display: "block",
        fontSize: 11,
        fontWeight: 800,
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    formatGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
    },
    formatCard: {
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: 16,
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.2s",
        color: "#fff",
    },
    activeFormatCard: {
        background: "rgba(0, 212, 236, 0.08)",
        border: `1.5px solid ${BRAND_CYAN}`,
    },
    formatIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    formatTitle: {
        fontSize: 13,
        fontWeight: 800,
        marginBottom: 4,
    },
    formatDesc: {
        fontSize: 11,
        color: "rgba(255,255,255,0.45)",
        lineHeight: 1.4,
    },
    input: {
        width: "100%",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "#fff",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
    },
    submitBtn: {
        background: BRAND_CYAN,
        border: "none",
        color: "#000",
        padding: "14px 20px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 900,
        cursor: "pointer",
        marginTop: 10,
        transition: "transform 0.1s",
    },
};
