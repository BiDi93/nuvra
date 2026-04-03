import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api/community";

export default function CommunityAnnouncements() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("community_user") || "null");
    const token = localStorage.getItem("community_token");

    useEffect(() => { fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`${API}/announcements`);
            const data = await res.json();
            setAnnouncements(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        await fetch(`${API}/announcements/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchAnnouncements();
    };

    return (
        <div style={styles.root}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { background: #080810; }`}</style>
            <div style={styles.bgGlow} />

            <nav style={styles.nav}>
                <button style={styles.backBtn} onClick={() => navigate("/community/feed")}>← Feed</button>
                <span style={styles.navBrand}>NUVRA Community</span>
                {user?.role === "admin" && (
                    <button style={styles.postBtn} onClick={() => navigate("/community/admin/post-announcement")}>+ Post</button>
                )}
                {user?.role !== "admin" && <div style={{ width: 80 }} />}
            </nav>

            <div style={styles.content}>
                <h1 style={styles.title}>📢 Announcements</h1>
                <p style={styles.subtitle}>Updates and news from the Community Admin</p>

                {loading ? (
                    <div style={styles.empty}>Loading...</div>
                ) : announcements.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>No announcements yet</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Check back soon!</div>
                    </div>
                ) : (
                    <div style={styles.list}>
                        {announcements.map(a => (
                            <div key={a.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={styles.cardTitle}>{a.title}</span>
                                    {user?.role === "admin" && (
                                        <button style={styles.deleteBtn} onClick={() => handleDelete(a.id)}>✕</button>
                                    )}
                                </div>
                                <p style={styles.cardBody}>{a.body}</p>
                                <div style={styles.cardMeta}>
                                    <span>👤 {a.author_name}</span>
                                    <span>{new Date(a.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    root: { fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#080810", color: "#fff" },
    bgGlow: { position: "fixed", top: 0, left: 0, right: 0, height: "40vh", zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,201,255,0.06) 0%, transparent 70%)" },
    nav: { position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "rgba(8,8,16,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
    backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: 80 },
    navBrand: { fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2 },
    postBtn: { padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #00ff87, #00c9ff)", color: "#080810", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: 80 },
    content: { position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" },
    title: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
    subtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 },
    empty: { textAlign: "center", padding: "60px 24px", color: "rgba(255,255,255,0.4)" },
    list: { display: "flex", flexDirection: "column", gap: 16 },
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    cardTitle: { fontSize: 17, fontWeight: 700, lineHeight: 1.3 },
    deleteBtn: { background: "none", border: "none", color: "rgba(255,68,68,0.5)", cursor: "pointer", fontSize: 14, padding: "0 0 0 12px", flexShrink: 0 },
    cardBody: { fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 16 },
    cardMeta: { display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.3)" },
};
