import React, { useState, useEffect } from "react";
import DynamicBackground from "../../../Components/DynamicBackground";

const API = "/api/community";

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, prefix = "" }) {
    return (
        <div style={S.statCard}>
            <div style={S.statValue}>{prefix}{value}</div>
            <div style={S.statLabel}>{label}</div>
        </div>
    );
}

// ── Notification Item ─────────────────────────────────────────────────────
function NotificationItem({ icon, message, time }) {
    return (
        <div style={S.notiItem}>
            <div style={S.notiIcon}>{icon}</div>
            <div style={S.notiContent}>
                <div style={S.notiMessage}>{message}</div>
                <div style={S.notiTime}>{time}</div>
            </div>
        </div>
    );
}

export default function Analytics() {
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("community_token");
        fetch(`${API}/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                setStats(data.stats);
                setNotifications(data.notifications);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={S.container}>
            <header style={S.header}>
                <h1 style={S.title}>Business Analytics</h1>
                <p style={S.subtitle}>Overview of community growth and activity metrics.</p>
            </header>

            <div style={S.mainGrid}>
                {/* Left: Notifications */}
                <div style={S.leftCol}>
                    <h2 style={S.sectionTitle}>RECENT NOTIFICATIONS</h2>
                    <div style={S.card}>
                        {loading ? (
                            <div style={S.empty}>Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div style={S.empty}>No recent activity.</div>
                        ) : (
                            notifications.map((n) => (
                                <NotificationItem key={n.id} icon={n.icon} message={n.message} time={n.time} />
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Stats */}
                <div style={S.rightCol}>
                    <h2 style={S.sectionTitle}>QUICK STATS</h2>
                    <div style={S.statsStack}>
                        <StatCard label="Total Games" value={loading ? "—" : stats?.totalGames} />
                        <StatCard label="Players Registered" value={loading ? "—" : stats?.playersRegistered} />
                        <StatCard label="Revenue this Month" value={loading ? "—" : stats?.revenueThisMonth} prefix="RM " />
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    container: {
        maxWidth: 1000,
        margin: "0 auto",
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.4)",
        marginTop: 8,
    },
    mainGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 800,
        color: "rgba(255,255,255,0.3)",
        letterSpacing: 1,
        marginBottom: 20,
    },
    card: {
        background: "#2a2b2e",
        borderRadius: 20,
        padding: "10px 20px",
        border: "1px solid rgba(255,255,255,0.05)",
    },
    notiItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "20px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    notiIcon: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
    },
    notiContent: {
        flex: 1,
    },
    notiMessage: {
        fontSize: 14,
        fontWeight: 600,
        color: "#fff",
        lineHeight: 1.4,
    },
    notiTime: {
        fontSize: 12,
        color: "rgba(255,255,255,0.3)",
        marginTop: 4,
    },
    statsStack: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    statCard: {
        background: "#2a2b2e",
        borderRadius: 20,
        padding: "32px 24px",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 800,
        color: "#fff",
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: 600,
        color: "rgba(255,255,255,0.4)",
    },
    empty: {
        padding: "20px 0",
        color: "rgba(255,255,255,0.3)",
        fontSize: 13,
    },
};
