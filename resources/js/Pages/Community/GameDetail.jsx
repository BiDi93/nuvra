import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = "/api/community";

function SlotVisual({ filled, max, teamName, side, onJoin, disabled, gameStatus }) {
    const remaining = max - filled;
    const pct = Math.min((filled / max) * 100, 100);
    const isFull = remaining <= 0;
    const isLow = remaining <= 5 && !isFull;
    const color = isFull ? "#ff4444" : isLow ? "#ff6b35" : "#00ff87";

    return (
        <div style={teamStyles.wrap}>
            <div style={teamStyles.header}>
                <span style={teamStyles.name}>{teamName}</span>
                <span style={{ ...teamStyles.slotBadge, color, borderColor: color + "33", background: color + "11" }}>
                    {isFull ? "FULL" : `${remaining} slots left`}
                </span>
            </div>

            {/* Seat grid — 4 columns of 5 rows = 20 seats */}
            <div style={teamStyles.seatGrid}>
                {Array.from({ length: max }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            ...teamStyles.seat,
                            background: i < filled
                                ? `linear-gradient(135deg, ${color}, ${isFull ? "#ff4444" : isLow ? "#ffa500" : "#00c9ff"})`
                                : "rgba(255,255,255,0.05)",
                            border: i < filled ? "none" : "1px solid rgba(255,255,255,0.08)",
                        }}
                    />
                ))}
            </div>

            <div style={teamStyles.barWrap}>
                <div style={teamStyles.bar}>
                    <div style={{ ...teamStyles.barFill, width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${isFull ? "#ff4444" : "#00c9ff"})` }} />
                </div>
                <span style={teamStyles.barLabel}>{filled}/{max} filled</span>
            </div>

            {gameStatus === "open" && !disabled && (
                <button
                    style={{ ...teamStyles.joinBtn, ...(isFull ? teamStyles.joinBtnFull : {}) }}
                    onClick={() => !isFull && onJoin(side)}
                    disabled={isFull}
                >
                    {isFull ? "Team Full" : `Join ${teamName} →`}
                </button>
            )}
        </div>
    );
}

export default function GameDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }

    const user = JSON.parse(localStorage.getItem("community_user") || "null");
    const token = localStorage.getItem("community_token");

    useEffect(() => { fetchGame(); }, [id]);

    const fetchGame = async () => {
        try {
            const res = await fetch(`${API}/games/${id}`);
            const json = await res.json();
            setData(json);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (side) => {
        if (!token) { navigate("/community"); return; }
        setJoining(true); setMsg(null);
        try {
            const res = await fetch(`${API}/games/${id}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ team_side: side }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            setMsg({ type: "success", text: json.message });
            fetchGame(); // refresh counts
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!token) return;
        setJoining(true); setMsg(null);
        try {
            const res = await fetch(`${API}/games/${id}/leave`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            setMsg({ type: "success", text: json.message });
            fetchGame();
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setJoining(false);
        }
    };

    const handleAdminCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this game?")) return;
        try {
            const res = await fetch(`${API}/games/${id}/cancel`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            fetchGame();
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        }
    };

    if (loading) return <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Inter, sans-serif" }}>Loading...</div>;
    if (!data?.game) return <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Inter, sans-serif" }}>Game not found.</div>;

    const { game, team_a, team_b } = data;
    const gameDate = new Date(game.game_date);
    const isAdmin = user?.role === "admin";

    return (
        <div style={styles.root}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { background: #080810; }`}</style>
            <div style={styles.bgGlow} />

            {/* Nav */}
            <nav style={styles.nav}>
                <button style={styles.backBtn} onClick={() => navigate("/community/feed")}>← Back to Feed</button>
                <span style={styles.navBrand}>NUVRA Community</span>
                {isAdmin && game.status === "open" && (
                    <button style={styles.cancelGameBtn} onClick={handleAdminCancel}>Cancel Game</button>
                )}
                {!isAdmin && <div style={{ width: 120 }} />}
            </nav>

            <div style={styles.content}>
                {/* Hero */}
                <div style={styles.hero}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <span style={{ ...styles.statusBadge, ...(game.status === "open" ? styles.statusOpen : game.status === "full" ? styles.statusFull : styles.statusCancelled) }}>
                            {game.status.toUpperCase()}
                        </span>
                        {isAdmin && <span style={styles.adminBadge}>👑 Admin View</span>}
                    </div>
                    <h1 style={styles.gameTitle}>{game.title}</h1>
                    <div style={styles.gameMeta}>
                        <span>📍 {game.venue}</span>
                        <span>📅 {gameDate.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                        <span>⏰ {gameDate.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {game.description && <p style={styles.gameDesc}>{game.description}</p>}
                </div>

                {/* Notification */}
                {msg && (
                    <div style={{ ...styles.msgBox, ...(msg.type === "success" ? styles.msgSuccess : styles.msgError) }}>
                        {msg.type === "success" ? "✅" : "⚠"} {msg.text}
                    </div>
                )}

                {/* Leave button if already joined */}
                {token && game.status !== "cancelled" && (
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <button style={styles.leaveBtn} onClick={handleLeave} disabled={joining}>
                            {joining ? "Processing..." : "Cancel My Booking"}
                        </button>
                    </div>
                )}

                {/* Login nudge */}
                {!token && game.status === "open" && (
                    <div style={styles.nudgeBox}>
                        <span>⚽ Want to play?</span>
                        <button style={styles.nudgeBtn} onClick={() => navigate("/community")}>Sign in to join</button>
                    </div>
                )}

                {/* Teams */}
                <div style={styles.teamsGrid}>
                    <SlotVisual
                        filled={team_a.length}
                        max={game.max_slots_per_team}
                        teamName={game.team_a_name}
                        side="team_a"
                        onJoin={handleJoin}
                        disabled={joining || !token}
                        gameStatus={game.status}
                    />
                    <div style={styles.vsDivider}>
                        <span style={styles.vsLabel}>VS</span>
                    </div>
                    <SlotVisual
                        filled={team_b.length}
                        max={game.max_slots_per_team}
                        teamName={game.team_b_name}
                        side="team_b"
                        onJoin={handleJoin}
                        disabled={joining || !token}
                        gameStatus={game.status}
                    />
                </div>

                {/* Player lists (admin only) */}
                {isAdmin && (
                    <div style={styles.rosterSection}>
                        <h2 style={styles.rosterTitle}>👑 Confirmed Roster</h2>
                        <div style={styles.rosterGrid}>
                            <PlayerList title={game.team_a_name} players={team_a} color="#00ff87" />
                            <PlayerList title={game.team_b_name} players={team_b} color="#00c9ff" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PlayerList({ title, players, color }) {
    return (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>{title} — {players.length} players</div>
            {players.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No players yet</div>
            ) : players.map((p, i) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, #00c9ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#080810" }}>
                        {p.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>#{i + 1}</span>
                </div>
            ))}
        </div>
    );
}

const teamStyles = {
    wrap: { flex: 1, display: "flex", flexDirection: "column", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    name: { fontSize: 18, fontWeight: 800 },
    slotBadge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, border: "1px solid" },
    seatGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 },
    seat: { height: 24, borderRadius: 6, transition: "all 0.3s" },
    barWrap: { display: "flex", alignItems: "center", gap: 10 },
    bar: { flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 4, transition: "width 0.6s" },
    barLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" },
    joinBtn: { padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #00ff87, #00c9ff)", color: "#080810", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 },
    joinBtnFull: { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" },
};

const styles = {
    root: { fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#080810", color: "#fff" },
    bgGlow: { position: "fixed", top: 0, left: 0, right: 0, height: "40vh", zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,135,0.06) 0%, transparent 70%)" },
    nav: { position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "rgba(8,8,16,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
    backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: 120 },
    navBrand: { fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2 },
    cancelGameBtn: { padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,68,68,0.3)", background: "rgba(255,68,68,0.08)", color: "#ff6b6b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: 120, textAlign: "right" },
    content: { position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" },
    hero: { marginBottom: 32 },
    statusBadge: { padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: 1 },
    statusOpen: { background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.3)" },
    statusFull: { background: "rgba(255,68,68,0.1)", color: "#ff4444", border: "1px solid rgba(255,68,68,0.3)" },
    statusCancelled: { background: "rgba(255,255,255,0.05)", color: "#888", border: "1px solid rgba(255,255,255,0.1)" },
    adminBadge: { fontSize: 12, fontWeight: 600, color: "rgba(255,215,0,0.8)" },
    gameTitle: { fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16 },
    gameMeta: { display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 },
    gameDesc: { fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 600 },
    msgBox: { borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, marginBottom: 24 },
    msgSuccess: { background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)", color: "#00ff87" },
    msgError: { background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", color: "#ff6b6b" },
    nudgeBox: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.15)", borderRadius: 12, padding: "14px 20px", marginBottom: 28, fontSize: 14, fontWeight: 600 },
    nudgeBtn: { padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #00ff87, #00c9ff)", color: "#080810", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    leaveBtn: { padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,68,68,0.2)", background: "rgba(255,68,68,0.06)", color: "#ff6b6b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    teamsGrid: { display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 40 },
    vsDivider: { display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 },
    vsLabel: { fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: "#00ff87" },
    rosterSection: { borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32 },
    rosterTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
    rosterGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
};
