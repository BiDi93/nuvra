import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import DynamicBackground from "../../Components/DynamicBackground";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ game, side, onClose, onSuccess }) {
    const token = localStorage.getItem("community_token");
    const [receipt, setReceipt] = useState(null);
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef();

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setReceipt(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!receipt) { toast.error("Please upload your payment receipt."); return; }
        setSubmitting(true);
        const toastId = toast.loading("Submitting booking...");
        try {
            const fd = new FormData();
            fd.append("team_side", side);
            fd.append("receipt", receipt);

            const res = await fetch(`${API}/games/${game.id}/join`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            toast.success(json.message, { id: toastId });
            onSuccess();
        } catch (err) {
            toast.error(err.message || "Failed to submit.", { id: toastId });
            setSubmitting(false);
        }
    };

    const teamLabel = side === "team_a" ? game.team_a_name : game.team_b_name;

    return (
        <div style={M.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={M.modal}>
                <div style={M.header}>
                    <div>
                        <div style={M.title}>RESERVE YOUR SLOT</div>
                        <div style={M.sub}>Joining {teamLabel} — RM {parseFloat(game.price_per_player).toFixed(2)} per person</div>
                    </div>
                    <button style={M.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={M.notice}>
                    Your slot is locked once payment is confirmed by admin.
                </div>

                {/* QR Code */}
                {game.payment_qr_url ? (
                    <div style={M.qrWrap}>
                        <div style={M.qrLabel}>SCAN TO PAY</div>
                        <img src={game.payment_qr_url} alt="Payment QR" style={M.qrImg} />
                        <div style={M.qrAmount}>RM {parseFloat(game.price_per_player).toFixed(2)}</div>
                    </div>
                ) : (
                    <div style={M.noQr}>No QR code set. Please contact the admin for payment details.</div>
                )}

                <div style={M.divider} />

                {/* Receipt Upload */}
                <div style={M.uploadSection}>
                    <div style={M.uploadLabel}>UPLOAD PAYMENT RECEIPT *</div>
                    <label style={M.fileLabel}>
                        <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} style={{ display: "none" }} />
                        {preview ? (
                            <img src={preview} alt="Receipt preview" style={M.receiptPreview} />
                        ) : (
                            <div style={M.filePlaceholder}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>Tap to upload receipt</div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>JPG, PNG — max 8MB</div>
                            </div>
                        )}
                    </label>
                    {preview && (
                        <button style={M.changeFile} onClick={() => fileRef.current?.click()}>Change receipt</button>
                    )}
                </div>

                <button
                    style={{ ...M.submitBtn, ...(submitting ? M.submitBtnDisabled : {}) }}
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? "SUBMITTING..." : "CONFIRM & LOCK MY SLOT →"}
                </button>
            </div>
        </div>
    );
}

// ── Team Logo Helper ────────────────────────────────────────────────────────
function TeamLogo({ name, color }) {
    return (
        <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${color}, #080a12)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#fff",
            fontFamily: "'Inter', sans-serif",
            border: `1px solid ${color}44`,
            flexShrink: 0
        }}>
            {name?.[0]?.toUpperCase() || "T"}
        </div>
    );
}

// ── Seat Grid Visual ──────────────────────────────────────────────────────────
function SlotVisual({ filled, max, teamName, side, onJoin, disabled, gameStatus }) {
    const remaining = max - filled;
    const pct  = Math.min((filled / max) * 100, 100);
    const isFull = remaining <= 0;
    const isLow  = remaining <= 5 && !isFull;
    const color  = isFull ? "#ff4444" : isLow ? "#ff6b35" : "#00D4EC";

    return (
        <div style={T.wrap}>
            <div style={T.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <TeamLogo name={teamName} color={side === "team_a" ? "#00D4EC" : "#D040EF"} />
                    <span style={T.teamName}>{teamName}</span>
                </div>
                <span style={{ ...T.badge, color, background: color + "15", border: `1px solid ${color}33` }}>
                    {isFull ? "FULL" : `${remaining} left`}
                </span>
            </div>

            <div style={T.seatGrid}>
                {Array.from({ length: max }).map((_, i) => (
                    <div key={i} style={{
                        ...T.seat,
                        background: i < filled
                            ? `linear-gradient(135deg, ${color}, ${isFull ? "#ff4444" : "#00D4EC"})`
                            : "rgba(255,255,255,0.05)",
                        border: i < filled ? "none" : "1px solid rgba(255,255,255,0.08)",
                    }} />
                ))}
            </div>

            <div style={T.barRow}>
                <div style={T.barTrack}>
                    <div style={{ ...T.barFill, width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #00D4EC)` }} />
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

// ── Admin Bookings Panel ──────────────────────────────────────────────────────
function AdminBookingsPanel({ gameId, token, onAction }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API}/games/${gameId}/bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBookings(await res.json());
        } catch { setBookings([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBookings(); }, [gameId]);

    const handleApprove = async (bookingId) => {
        const toastId = toast.loading("Approving...");
        try {
            const res = await fetch(`${API}/bookings/${bookingId}/approve`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            toast.success(json.message, { id: toastId });
            fetchBookings();
            onAction();
        } catch (err) { toast.error(err.message, { id: toastId }); }
    };

    const handleReject = async (bookingId) => {
        if (!window.confirm("Reject this booking and free the slot?")) return;
        const toastId = toast.loading("Rejecting...");
        try {
            const res = await fetch(`${API}/bookings/${bookingId}/reject`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            toast.success(json.message, { id: toastId });
            fetchBookings();
            onAction();
        } catch (err) { toast.error(err.message, { id: toastId }); }
    };

    const pending   = bookings.filter(b => b.status === "payment_submitted");
    const confirmed = bookings.filter(b => b.status === "confirmed");

    if (loading) return <div style={A.loadingText}>Loading bookings...</div>;

    return (
        <div style={A.wrap}>
            <div style={A.panelHeader}>
                <span style={A.panelTitle}>👑 BOOKINGS OVERVIEW</span>
                <span style={A.adminTag}>ADMIN VIEW</span>
            </div>

            {/* Awaiting Approval */}
            <div style={A.group}>
                <div style={A.groupLabel}>
                    <span style={{ color: "#ff6b35" }}>📨 AWAITING APPROVAL</span>
                    <span style={A.count}>{pending.length}</span>
                </div>
                {pending.length === 0 ? (
                    <div style={A.empty}>No pending approvals</div>
                ) : pending.map(b => (
                    <div key={b.id} style={A.row}>
                        <div style={A.avatar}>{b.player_name?.[0]?.toUpperCase()}</div>
                        <div style={A.info}>
                            <div style={A.name}>{b.player_name}</div>
                            <div style={A.meta}>{b.team_side === "team_a" ? "Team A" : "Team B"} · {new Date(b.created_at).toLocaleDateString("en-MY")}</div>
                        </div>
                        <div style={A.actions}>
                            {b.receipt_url && (
                                <a href={b.receipt_url} target="_blank" rel="noopener noreferrer" style={A.receiptLink}>View Receipt ↗</a>
                            )}
                            <button style={A.approveBtn} onClick={() => handleApprove(b.id)}>✓ APPROVE</button>
                            <button style={A.rejectBtn} onClick={() => handleReject(b.id)}>✗ REJECT</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Confirmed */}
            <div style={A.group}>
                <div style={A.groupLabel}>
                    <span style={{ color: "#00D4EC" }}>✅ CONFIRMED</span>
                    <span style={A.count}>{confirmed.length}</span>
                </div>
                {confirmed.length === 0 ? (
                    <div style={A.empty}>No confirmed players yet</div>
                ) : confirmed.map((b, i) => (
                    <div key={b.id} style={{ ...A.row, opacity: 0.8 }}>
                        <div style={{ ...A.avatar, background: "linear-gradient(135deg, #00D4EC, #D040EF)" }}>{b.player_name?.[0]?.toUpperCase()}</div>
                        <div style={A.info}>
                            <div style={A.name}>{b.player_name}</div>
                            <div style={A.meta}>{b.team_side === "team_a" ? "Team A" : "Team B"} · #{i + 1}</div>
                        </div>
                        <span style={A.confirmedBadge}>CONFIRMED</span>
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
    const [modal,   setModal]   = useState(null); // null | 'team_a' | 'team_b'

    const user  = JSON.parse(localStorage.getItem("community_user") || "null");
    const token = localStorage.getItem("community_token");

    useEffect(() => { fetchGame(); }, [id]);

    const fetchGame = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${API}/games/${id}`);
            setData(await res.json());
        } catch { setData(null); }
        finally  { setLoading(false); }
    };

    const handleAdminCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this game?")) return;
        const toastId = toast.loading("Cancelling game...");
        try {
            const res  = await fetch(`${API}/games/${id}/cancel`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            toast.success(json.message, { id: toastId });
            fetchGame();
        } catch (err) { toast.error(err.message, { id: toastId }); }
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
    const isPaid   = game.price_per_player > 0;

    // Find current user's booking in this game
    const myBooking = user && (
        team_a.find(p => p.id === user.id) ||
        team_b.find(p => p.id === user.id)
    );
    const userJoined = !!myBooking;
    const bookingStatus = myBooking?.booking_status;

    const statusColors = {
        open:      { color: "#00D4EC", bg: "rgba(0,212,236,0.1)", border: "rgba(0,212,236,0.3)" },
        full:      { color: "#ff4444", bg: "rgba(255,68,68,0.1)",  border: "rgba(255,68,68,0.3)" },
        cancelled: { color: "#888",    bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
        completed: { color: "#888",    bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
    };
    const sc = statusColors[game.status] || statusColors.open;

    return (
        <>
            <Toaster position="top-right" reverseOrder={false} />
            <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }`}</style>

            {/* Payment Modal */}
            {modal && (
                <PaymentModal
                    game={game}
                    side={modal}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); fetchGame(); }}
                />
            )}

            {/* TOP BAR */}
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
                    {isPaid && <span style={S.priceBadge}>💳 RM {parseFloat(game.price_per_player).toFixed(2)} / person</span>}
                    {!isPaid && <span style={S.freeBadge}>🆓 FREE</span>}
                </div>
                {game.description && <p style={S.gameDesc}>{game.description}</p>}
            </div>

            {/* Player booking status banner */}
            {!isAdmin && token && userJoined && (
                <div style={{
                    ...S.bookingBanner,
                    ...(bookingStatus === "confirmed" ? S.bookingBannerConfirmed : S.bookingBannerPending),
                }}>
                    {bookingStatus === "confirmed" && (
                        <>✅ <strong>You're in!</strong> Your slot is confirmed. See you on the pitch.</>
                    )}
                    {bookingStatus === "payment_submitted" && (
                        <>📨 <strong>Receipt submitted.</strong> Waiting for admin to verify your payment.</>
                    )}
                </div>
            )}

            {/* Sign-in nudge for guests */}
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
                <SlotVisual
                    filled={team_a.length}
                    max={game.max_slots_per_team}
                    teamName={game.team_a_name}
                    side="team_a"
                    onJoin={(side) => isPaid ? setModal(side) : joinFree(side)}
                    disabled={!token || isAdmin || userJoined}
                    gameStatus={game.status}
                />
                <div style={S.vsDivider}>
                    <div style={S.vsChip}>VS</div>
                </div>
                <SlotVisual
                    filled={team_b.length}
                    max={game.max_slots_per_team}
                    teamName={game.team_b_name}
                    side="team_b"
                    onJoin={(side) => isPaid ? setModal(side) : joinFree(side)}
                    disabled={!token || isAdmin || userJoined}
                    gameStatus={game.status}
                />
            </div>

            {/* Admin bookings panel */}
            {isAdmin && (
                <AdminBookingsPanel gameId={id} token={token} onAction={fetchGame} />
            )}
        </>
    );

    // Free game join (no receipt needed)
    async function joinFree(side) {
        const toastId = toast.loading("Booking slot...");
        try {
            const fd = new FormData();
            fd.append("team_side", side);
            const res = await fetch(`${API}/games/${id}/join`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            toast.success(json.message, { id: toastId });
            fetchGame();
        } catch (err) {
            toast.error(err.message || "Failed to join.", { id: toastId });
        }
    }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24 },
    backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
    topBarRight: { display: "flex", gap: 12, alignItems: "center" },
    statusBadge: { padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: 1, fontFamily: "'Inter', sans-serif" },
    cancelBtn: { padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,68,68,0.3)", background: "rgba(255,68,68,0.08)", color: "#ff6b6b", fontSize: 11, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "'Inter', sans-serif" },

    gameHeader: { marginBottom: 28 },
    sectionLabel: { fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,0.35)", marginBottom: 12 },
    gameTitle: { fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, fontFamily: "'Inter', sans-serif" },
    gameMeta: { display: "flex", flexWrap: "wrap", gap: 20, fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 14, alignItems: "center", fontFamily: "'Inter', sans-serif" },
    gameDesc: { fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 700, fontFamily: "'Inter', sans-serif" },
    priceBadge: { padding: "4px 12px", borderRadius: 6, background: "rgba(0,201,255,0.12)", border: "1px solid rgba(0,201,255,0.3)", color: "#00D4EC", fontSize: 12, fontWeight: 800, letterSpacing: 0.5 },
    freeBadge:  { padding: "4px 12px", borderRadius: 6, background: "rgba(0,212,236,0.1)", border: "1px solid rgba(0,212,236,0.25)", color: "#00D4EC", fontSize: 12, fontWeight: 800, letterSpacing: 0.5 },

    bookingBanner: { borderRadius: 12, padding: "16px 24px", fontSize: 14, fontWeight: 600, marginBottom: 28, letterSpacing: 0.2, fontFamily: "'Inter', sans-serif" },
    bookingBannerConfirmed: { background: "rgba(0,212,236,0.08)", border: "1px solid rgba(0,212,236,0.25)", color: "#00D4EC" },
    bookingBannerPending:   { background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.25)", color: "#ff9966" },

    nudgeBox: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,212,236,0.05)", border: "1px solid rgba(0,212,236,0.15)", borderRadius: 10, padding: "14px 24px", marginBottom: 28 },
    nudgeBtn: { padding: "10px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #00D4EC, #D040EF)", color: "#080810", fontSize: 12, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "'Inter', sans-serif" },

    sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    sectionTitle:  { fontSize: 13, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif" },
    teamsGrid: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "start", marginBottom: 40 },
    vsDivider: { display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 },
    vsChip: { fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: 2, color: "#00D4EC", border: "1px solid rgba(0,212,236,0.3)", background: "rgba(0,212,236,0.05)", borderRadius: 8, padding: "8px 12px" },
};

const T = {
    wrap:     { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16 },
    header:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
    teamName: {
        fontFamily: "'Inter', sans-serif",
        fontSize: 18,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#fff",
    },
    badge:    { fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 6, letterSpacing: 0.5, fontFamily: "'Inter', sans-serif" },
    seatGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 },
    seat:     { height: 24, borderRadius: 6, transition: "all 0.3s" },
    barRow:   { display: "flex", alignItems: "center", gap: 12 },
    barTrack: { flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
    barFill:  { height: "100%", borderRadius: 2, transition: "width 0.6s ease" },
    barLabel: { fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", fontWeight: 700, fontFamily: "'Inter', sans-serif" },
    joinBtn:  { padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #00D4EC, #D040EF)", color: "#080810", fontSize: 12, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
    joinBtnDisabled: { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)", cursor: "not-allowed" },
};


// ── Payment Modal Styles ───────────────────────────────────────────────────────
const M = {
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
    modal: { background: "#0e1020", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    title: { fontSize: 16, fontWeight: 800, letterSpacing: 1, color: "#fff" },
    sub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 },
    closeBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 },
    notice: { background: "rgba(0,201,255,0.06)", border: "1px solid rgba(0,201,255,0.15)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "rgba(0,201,255,0.8)", fontWeight: 600 },
    qrWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 0" },
    qrLabel: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,0.3)" },
    qrImg: { width: 180, height: 180, objectFit: "contain", borderRadius: 12, background: "#fff", padding: 8 },
    qrAmount: { fontSize: 22, fontWeight: 800, color: "#00D4EC", letterSpacing: 1 },
    noQr: { background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" },
    divider: { height: 1, background: "rgba(255,255,255,0.07)" },
    uploadSection: { display: "flex", flexDirection: "column", gap: 10 },
    uploadLabel: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)" },
    fileLabel: { cursor: "pointer", display: "block" },
    filePlaceholder: { borderRadius: 10, border: "2px dashed rgba(255,255,255,0.12)", padding: "28px 20px", textAlign: "center", color: "rgba(255,255,255,0.5)" },
    receiptPreview: { width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" },
    changeFile: { background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", padding: 0 },
    submitBtn: { padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #00D4EC, #D040EF)", color: "#080810", fontSize: 13, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "inherit" },
    submitBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
};

// ── Admin Panel Styles ─────────────────────────────────────────────────────────
const A = {
    wrap: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" },
    panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
    panelTitle: { fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,0.6)" },
    adminTag: { fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: "rgba(255,215,0,0.5)", background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)", padding: "2px 8px", borderRadius: 4 },
    group: { padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
    groupLabel: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, marginBottom: 12 },
    count: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 },
    empty: { fontSize: 12, color: "rgba(255,255,255,0.2)", padding: "8px 0" },
    row: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" },
    avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #ff6b35, #ff4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 },
    info: { flex: 1, minWidth: 0 },
    name: { fontSize: 13, fontWeight: 700, color: "#fff" },
    meta: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 },
    actions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
    receiptLink: { fontSize: 10, color: "#00D4EC", fontWeight: 700, textDecoration: "none", letterSpacing: 0.5 },
    approveBtn: { padding: "5px 12px", borderRadius: 5, border: "1px solid rgba(0,212,236,0.3)", background: "rgba(0,212,236,0.08)", color: "#00D4EC", fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: "Inter, sans-serif", letterSpacing: 0.5 },
    rejectBtn: { padding: "5px 12px", borderRadius: 5, border: "1px solid rgba(255,68,68,0.3)", background: "rgba(255,68,68,0.08)", color: "#ff6b6b", fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: "Inter, sans-serif", letterSpacing: 0.5 },
    confirmedBadge: { fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: "#00D4EC", background: "rgba(0,212,236,0.08)", border: "1px solid rgba(0,212,236,0.2)", padding: "3px 8px", borderRadius: 4 },
    loadingText: { padding: 24, color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center" },
};
