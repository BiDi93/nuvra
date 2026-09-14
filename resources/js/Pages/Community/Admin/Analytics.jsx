import React, { useState, useEffect } from "react";
import { IconCheck, IconX, IconUser, IconCreditCard } from "../../../Components/Icons";

const API = "/api/community";

const NOTI_ICON = {
    payment:    { Icon: IconCreditCard, tone: "warn" },
    confirmed:  { Icon: IconCheck, tone: "ok" },
    rejected:   { Icon: IconX, tone: "danger" },
    registered: { Icon: IconUser, tone: "accent" },
};

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
    const entry = NOTI_ICON[icon] || NOTI_ICON.registered;
    const { Icon, tone } = entry;
    return (
        <div style={S.notiItem}>
            <div style={{ ...S.notiIcon, ...S.notiToneMap[tone] }}>
                <Icon size={14} />
            </div>
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
        color: "var(--text-primary)",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: "var(--text-muted)",
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
        color: "var(--text-muted)",
        letterSpacing: 1,
        marginBottom: 20,
    },
    card: {
        background: "var(--bg-surface)",
        borderRadius: 20,
        padding: "10px 20px",
        border: "1px solid var(--border-subtle)",
    },
    notiItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "20px 0",
        borderBottom: "1px solid var(--border-subtle)",
    },
    notiIcon: {
        width: 30,
        height: 30,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    notiToneMap: {
        ok:     { background: "rgba(34, 197, 94, 0.14)", color: "var(--color-success)" },
        danger: { background: "rgba(239, 68, 68, 0.14)", color: "var(--color-danger)" },
        warn:   { background: "rgba(251, 191, 36, 0.14)", color: "var(--color-warning)" },
        accent: { background: "rgba(0, 212, 236, 0.14)", color: "var(--accent)" },
    },
    notiContent: {
        flex: 1,
    },
    notiMessage: {
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-primary)",
        lineHeight: 1.4,
    },
    notiTime: {
        fontSize: 12,
        color: "var(--text-muted)",
        marginTop: 4,
    },
    statsStack: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    statCard: {
        background: "var(--bg-surface)",
        borderRadius: 20,
        padding: "32px 24px",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 800,
        color: "var(--text-primary)",
        letterSpacing: -1,
        fontVariantNumeric: "tabular-nums",
    },
    statLabel: {
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-muted)",
    },
    empty: {
        padding: "20px 0",
        color: "var(--text-muted)",
        fontSize: 13,
    },
};
