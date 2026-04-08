import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

export default function CommunityAnnouncements() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const user  = JSON.parse(localStorage.getItem("community_user") || "null");
    const token = localStorage.getItem("community_token");

    useEffect(() => { fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        try {
            const res  = await fetch(`${API}/announcements`);
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
        <>
            <style>{`
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
            `}</style>

            {/* ── TOP BAR ── */}
            <div style={S.topBar}>
                <div style={S.topBarTitle}>THE GRID // ANNOUNCEMENTS</div>
                <div style={S.statChip}>
                    <span style={S.statChipNum}>{announcements.length}</span>
                    <span style={S.statChipLabel}>NOTICES</span>
                </div>
            </div>

            <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>LATEST NOTICES</span>
                <button style={S.backBtn} onClick={() => navigate("/community/feed")}>← BACK TO FEED</button>
            </div>

            {loading ? (
                <div style={S.emptyState}><div style={S.emptyText}>LOADING...</div></div>
            ) : announcements.length === 0 ? (
                <div style={S.emptyState}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={S.emptyText}>NO ANNOUNCEMENTS YET</div>
                    <div style={S.emptySubText}>Check back soon!</div>
                </div>
            ) : (
                <div style={S.list}>
                    {announcements.map((a, idx) => (
                        <div key={a.id} style={S.card}>
                            <div style={S.cardAccent} />
                            <div style={S.cardInner}>
                                <div style={S.cardHeader}>
                                    <div>
                                        <div style={S.cardNum}>#{String(idx + 1).padStart(2, "0")}</div>
                                        <div style={S.cardTitle}>{a.title}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                        <span style={S.datePill}>
                                            {new Date(a.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short" }).toUpperCase()}
                                        </span>
                                        {user?.role === "admin" && (
                                            <button style={S.deleteBtn} onClick={() => handleDelete(a.id)}>✕</button>
                                        )}
                                    </div>
                                </div>
                                <p style={S.cardBody}>{a.body}</p>
                                <div style={S.cardMeta}>
                                    <span>👤 {a.author_name}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

const S = {
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 28 },
    topBarTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, letterSpacing: 3, color: "rgba(255,255,255,0.6)" },
    statChip: { display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 },
    statChipNum: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, color: "#00D4EC", lineHeight: 1 },
    statChipLabel: { fontSize: 9, letterSpacing: 1.2, color: "rgba(255,255,255,0.35)", marginTop: 2 },
    sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,0.7)" },
    backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "inherit" },
    list: { display: "flex", flexDirection: "column", gap: 12 },
    emptyState: { textAlign: "center", padding: "80px 24px", color: "rgba(255,255,255,0.3)" },
    emptyText: { fontSize: 14, fontWeight: 800, letterSpacing: 2, marginBottom: 8 },
    emptySubText: { fontSize: 13, color: "rgba(255,255,255,0.2)" },

    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden", display: "flex" },
    cardAccent: { width: 3, background: "linear-gradient(180deg, #00D4EC, #a78bfa)", flexShrink: 0 },
    cardInner: { flex: 1, padding: "16px 18px" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    cardNum: { fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: 1, marginBottom: 4 },
    cardTitle: { fontSize: 15, fontWeight: 800, lineHeight: 1.3, color: "#fff" },
    datePill: { fontSize: 10, fontWeight: 700, color: "#00D4EC", background: "rgba(0,201,255,0.08)", padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 },
    deleteBtn: { background: "none", border: "none", color: "rgba(255,68,68,0.5)", cursor: "pointer", fontSize: 12, padding: 0 },
    cardBody: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 12 },
    cardMeta: { fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 },
};
