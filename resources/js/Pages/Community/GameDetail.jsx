import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

// ── Seat Grid Visual ──────────────────────────────────────────────────────────
function SlotVisual({ filled, max, teamName, side, onJoin, disabled, gameStatus }) {
    const remaining = max - filled;
    const pct  = Math.min((filled / max) * 100, 100);
    const isFull = remaining <= 0;
    const isLow  = remaining <= 5 && !isFull;
    const color  = isFull ? "#ff4444" : isLow ? "#ff6b35" : "#00ff87";

    return (
        <div style={T.wrap}>
            <div style={T.header}>
                <span style={T.teamName}>{teamName}</span>
                <span style={{ ...T.badge, color, background: color + "15", border: `1px solid ${color}33` }}>
                    {isFull ? "FULL" : `${remaining} left`}
                </span>
            </div>

            {/* Seat grid */}
            <div style={T.seatGrid}>
                {Array.from({ length: max }).map((_, i) => (
                    <div key={i} style={{
                        ...T.seat,
                        background: i < filled
                            ? `linear-gradient(135deg, ${color}, ${isFull ? "#ff4444" : "#00c9ff"})`
                            : "rgba(255,255,255,0.04)",
                        border: i < filled ? "none" : "1px solid rgba(255,255,255,0.07)",
                    }} />
                ))}
            </div>

            <div style={T.barRow}>
                <div style={T.barTrack}>
                    <div style={{ ...T.barFill, width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #00c9ff)` }} />
                </div>
                <span style={T.barLabel}>{filled}/{max}</span>
            </div>

            {gameStatus === "open" && !disabled && (
                <button
                    style={{ ...T.joinBtn, ...(isFull ? T.joinBtnDisabled : {}) }}
                    onClick={() => !isFull && onJoin(side)}
                    disabled={isFull}
                >
                    {isFull ? "TEAM FULL" : `JOIN ${teamName.toUpperCase()} →`}
                </button>
            )}
        </div>
    );
}

// ── Player Roster List ────────────────────────────────────────────────────────
function PlayerList({ title, players, color }) {
    return (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color, textTransform: "uppercase" }}>{title}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{players.length} PLAYERS</span>
            </div>
            <div style={{ padding: "8px 0" }}>
                {players.length === 0 ? (
                    <div style={{ padding: "16px", color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center" }}>No players yet</div>
                ) : players.map((p, i) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, #00c9ff)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#080810", flexShrink: 0 }}>
                            {p.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{p.name}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>#{i + 1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GameDetail() {
    const { id } = useParams();
    const navigate  = useNavigate();
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [msg,     setMsg]     = useState(null);

    const user  = JSON.parse(localStorage.getItem("community_user") || "null");
    const token = localStorage.getItem("community_token");

    useEffect(() => { fetchGame(); }, [id]);

    const fetchGame = async () => {
        try {
            const res  = await fetch(`${API}/games/${id}`);
            setData(await res.json());
        } catch { setData(null); }
        finally  { setLoading(false); }
    };

    const handleJoin = async (side) => {
        if (!token) { navigate("/community"); return; }
        setJoining(true); setMsg(null);
        try {
            const res  = await fetch(`${API}/games/${id}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ team_side: side }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            setMsg({ type: "success", text: json.message });
            fetchGame();
        } catch (err) { setMsg({ type: "error", text: err.message }); }
        finally        { setJoining(false); }
    };

    const handleLeave = async () => {
        if (!token) return;
        setJoining(true); setMsg(null);
        try {
            const res  = await fetch(`${API}/games/${id}/leave`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            setMsg({ type: "success", text: json.message });
            fetchGame();
        } catch (err) { setMsg({ type: "error", text: err.message }); }
        finally        { setJoining(false); }
    };

    const handleAdminCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this game?")) return;
        try {
            const res  = await fetch(`${API}/games/${id}/cancel`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            fetchGame();
        } catch (err) { setMsg({ type: "error", text: err.message }); }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#080a12", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", fontSize: 13, letterSpacing: 2 }}>
            LOADING...
        </div>
    );
    if (!data?.game) return (
        <div style={{ minHeight: "100vh", background: "#080a12", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", fontSize: 13, letterSpacing: 2 }}>
            GAME NOT FOUND
        </div>
    );

    const { game, team_a, team_b } = data;
    const gameDate = new Date(game.game_date);
    const isAdmin  = user?.role === "admin";
    const statusColors = {
        open:      { color: "#00ff87", bg: "rgba(0,255,135,0.1)", border: "rgba(0,255,135,0.3)" },
        full:      { color: "#ff4444", bg: "rgba(255,68,68,0.1)",  border: "rgba(255,68,68,0.3)" },
        cancelled: { color: "#888",    bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
        completed: { color: "#888",    bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
    };
    const sc = statusColors[game.status] || statusColors.open;

    return (
        <div style={S.root}>
            <PageLoader />
            <DynamicBackground />
            <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }`}</style>

            {/* LEFT SIDEBAR */}
            <aside style={S.sidebar}>
                <div style={S.brand} onClick={() => navigate("/")}>
                    <div style={S.brandText}>THE GRID</div>
                    <div style={S.brandSub}>FOOTBALL COMMUNITY</div>
                </div>
                <nav style={S.sideNav}>
                    {[
                        { icon: "⊞", label: "DASHBOARD",     path: "/community/feed" },
                        { icon: "📅", label: "FIXTURES",      path: null },
                        { icon: "📢", label: "ANNOUNCEMENTS", path: "/community/announcements" },
                        { icon: "👥", label: "COMMUNITY",     path: null },
                    ].map(item => (
                        <button key={item.label} style={S.navItem} onClick={() => item.path && navigate(item.path)}>
                            <span style={S.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div style={{ flex: 1 }} />
                {user ? (
                    <div style={S.userBox}>
                        <div style={S.userAvatar}>{user.name?.[0]?.toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={S.userName}>{user.name}</div>
                            <div style={S.userRole}>{user.role?.toUpperCase() || "MEMBER"}</div>
                        </div>
                    </div>
                ) : (
                    <button style={S.signInBtn} onClick={() => navigate("/community")}>SIGN IN</button>
                )}
            </aside>

            {/* MAIN */}
            <main style={S.main}>
                {/* Top bar */}
                <div style={S.topBar}>
                    <button style={S.backBtn} onClick={() => navigate("/community/feed")}>← BACK TO FEED</button>
                    <div style={S.topBarRight}>
                        <span style={{ ...S.statusBadge, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                            {game.status.toUpperCase()}
                        </span>
                        {isAdmin && game.status === "open" && (
                            <button style={S.cancelBtn} onClick={handleAdminCancel}>CANCEL GAME</button>
                        )}
                    </div>
                </div>

                {/* Game header */}
                <div style={S.gameHeader}>
                    <div style={S.sectionLabel}>THE GRID // MATCH DETAIL</div>
                    <h1 style={S.gameTitle}>{game.title}</h1>
                    <div style={S.gameMeta}>
                        <span>📍 {game.venue}</span>
                        <span>📅 {gameDate.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                        <span>⏰ {gameDate.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {game.description && <p style={S.gameDesc}>{game.description}</p>}
                </div>

                {/* Notification */}
                {msg && (
                    <div style={{ ...S.msgBox, ...(msg.type === "success" ? S.msgSuccess : S.msgError) }}>
                        {msg.type === "success" ? "✅" : "⚠"} {msg.text}
                    </div>
                )}

                {/* Leave / Sign-in nudge */}
                {token && game.status !== "cancelled" && (
                    <div style={{ marginBottom: 24 }}>
                        <button style={S.leaveBtn} onClick={handleLeave} disabled={joining}>
                            {joining ? "PROCESSING..." : "CANCEL MY BOOKING"}
                        </button>
                    </div>
                )}
                {!token && game.status === "open" && (
                    <div style={S.nudgeBox}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>⚽ Want to play?</span>
                        <button style={S.nudgeBtn} onClick={() => navigate("/community")}>SIGN IN TO JOIN</button>
                    </div>
                )}

                {/* Teams layout */}
                <div style={S.sectionHeader}>
                    <span style={S.sectionTitle}>SQUAD SLOTS</span>
                </div>
                <div style={S.teamsGrid}>
                    <SlotVisual filled={team_a.length} max={game.max_slots_per_team} teamName={game.team_a_name} side="team_a" onJoin={handleJoin} disabled={joining || !token} gameStatus={game.status} />
                    <div style={S.vsDivider}>
                        <div style={S.vsChip}>VS</div>
                    </div>
                    <SlotVisual filled={team_b.length} max={game.max_slots_per_team} teamName={game.team_b_name} side="team_b" onJoin={handleJoin} disabled={joining || !token} gameStatus={game.status} />
                </div>

                {/* Admin roster */}
                {isAdmin && (
                    <>
                        <div style={{ ...S.sectionHeader, marginTop: 36 }}>
                            <span style={S.sectionTitle}>👑 CONFIRMED ROSTER</span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>ADMIN VIEW</span>
                        </div>
                        <div style={S.rosterGrid}>
                            <PlayerList title={game.team_a_name} players={team_a} color="#00ff87" />
                            <PlayerList title={game.team_b_name} players={team_b} color="#00c9ff" />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
    root: { display: "flex", minHeight: "100vh", background: "#080a12", color: "#fff", fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden" },
    sidebar: { width: 210, minWidth: 210, minHeight: "100vh", background: "rgba(6,7,18,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, backdropFilter: "blur(20px)" },
    brand: { padding: "28px 20px 20px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 8 },
    brandText: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, letterSpacing: 3, color: "#fff", lineHeight: 1 },
    brandSub: { fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.3)", marginTop: 3, textTransform: "uppercase" },
    sideNav: { display: "flex", flexDirection: "column", gap: 2, padding: "8px 0" },
    navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" },
    navIcon: { fontSize: 14, width: 20, textAlign: "center" },
    userBox: { display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" },
    userAvatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #00ff87, #00c9ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#080810", flexShrink: 0 },
    userName: { fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    userRole: { fontSize: 9, letterSpacing: 1, color: "rgba(255,255,255,0.3)", marginTop: 1 },
    signInBtn: { margin: "12px 16px 20px", padding: "10px", borderRadius: 6, border: "1px solid rgba(0,255,135,0.3)", background: "rgba(0,255,135,0.05)", color: "#00ff87", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, cursor: "pointer", fontFamily: "inherit" },

    main: { marginLeft: 210, flex: 1, padding: "0 32px 60px", position: "relative", zIndex: 10 },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24 },
    backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "inherit" },
    topBarRight: { display: "flex", gap: 12, alignItems: "center" },
    statusBadge: { padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: 1 },
    cancelBtn: { padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,68,68,0.3)", background: "rgba(255,68,68,0.08)", color: "#ff6b6b", fontSize: 10, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "inherit" },

    gameHeader: { marginBottom: 28 },
    sectionLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", marginBottom: 10 },
    gameTitle: { fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 12 },
    gameMeta: { display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 10 },
    gameDesc: { fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 600 },

    msgBox: { borderRadius: 8, padding: "12px 16px", fontSize: 13, fontWeight: 700, marginBottom: 20, letterSpacing: 0.3 },
    msgSuccess: { background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)", color: "#00ff87" },
    msgError:   { background: "rgba(255,80,80,0.08)",  border: "1px solid rgba(255,80,80,0.2)",  color: "#ff6b6b" },
    leaveBtn: { padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(255,68,68,0.2)", background: "rgba(255,68,68,0.06)", color: "#ff6b6b", fontSize: 10, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "inherit" },
    nudgeBox: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,255,135,0.04)", border: "1px solid rgba(0,255,135,0.12)", borderRadius: 8, padding: "12px 20px", marginBottom: 24 },
    nudgeBtn: { padding: "7px 16px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #00ff87, #00c9ff)", color: "#080810", fontSize: 10, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "inherit" },

    sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    sectionTitle:  { fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,0.5)" },
    teamsGrid: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 20, alignItems: "start", marginBottom: 20 },
    vsDivider: { display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 },
    vsChip: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, letterSpacing: 3, color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 4, padding: "6px 10px" },
    rosterGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
};

const T = {
    wrap:     { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14 },
    header:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
    teamName: { fontSize: 15, fontWeight: 800 },
    badge:    { fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 },
    seatGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 },
    seat:     { height: 22, borderRadius: 4, transition: "all 0.3s" },
    barRow:   { display: "flex", alignItems: "center", gap: 10 },
    barTrack: { flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" },
    barFill:  { height: "100%", borderRadius: 2, transition: "width 0.6s ease" },
    barLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", fontWeight: 700 },
    joinBtn:  { padding: "10px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #00ff87, #00c9ff)", color: "#080810", fontSize: 10, fontWeight: 800, letterSpacing: 1.5, cursor: "pointer", fontFamily: "Inter, sans-serif" },
    joinBtnDisabled: { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)", cursor: "not-allowed" },
};
