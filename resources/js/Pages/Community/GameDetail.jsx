import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";
const BRAND_BLUE = "#00D4EC";

const authHeaders = () => {
    const token = localStorage.getItem("community_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function GameDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Organizer review panel
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const res = await fetch(`${API}/games/${id}`, { headers: { ...authHeaders() } });
            const json = await res.json();
            if (res.ok) {
                setData(json);
                if (json.is_owner) fetchBookings();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API}/games/${id}/bookings`, { headers: { ...authHeaders() } });
            const json = await res.json();
            if (res.ok) setBookings(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleJoin = async () => {
        const token = localStorage.getItem("community_token");
        if (!token) {
            alert("Please sign in first");
            return navigate("/community");
        }
        setJoining(true);
        try {
            const res = await fetch(`${API}/games/${id}/join`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
            });
            const resData = await res.json();
            if (!res.ok) alert(resData.message);
            fetchDetail();
        } catch (err) {
            alert("Error joining game");
        } finally {
            setJoining(false);
        }
    };

    const handleUploadReceipt = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("receipt", file);

        setUploading(true);
        try {
            const res = await fetch(`${API}/games/${id}/receipt`, {
                method: "POST",
                headers: { ...authHeaders() },
                body: formData,
            });
            const resData = await res.json();
            if (!res.ok) alert(resData.message || "Upload failed");
            fetchDetail();
        } catch (err) {
            alert("Error uploading receipt");
        } finally {
            setUploading(false);
        }
    };

    const handleApprove = async (bookingId) => {
        await fetch(`${API}/bookings/${bookingId}/approve`, { method: "PATCH", headers: { ...authHeaders() } });
        fetchBookings();
        fetchDetail();
    };

    const handleReject = async (bookingId) => {
        await fetch(`${API}/bookings/${bookingId}/reject`, { method: "PATCH", headers: { ...authHeaders() } });
        fetchBookings();
        fetchDetail();
    };

    if (loading) return <PageLoader />;
    if (!data) return <div style={{ color: "#fff", textAlign: "center", padding: 100 }}>Match not found</div>;

    const { game, players, my_booking, is_owner } = data;
    const isFull = (players?.length || 0) >= (game?.total_slots || 0);
    const isPast = new Date(game.game_date) < new Date().setHours(0, 0, 0, 0);
    const isPaid = game.price > 0;

    return (
        <div style={S.container}>
            <style>{`
                @media (max-width: 768px) {
                    .game-grid { grid-template-columns: 1fr !important; }
                    .game-title { font-size: 26px !important; }
                }
            `}</style>

            <div style={S.hero}>
                <button onClick={() => navigate("/community/feed")} style={S.backBtn}>← BACK TO FEED</button>
                <h1 style={S.title} className="game-title">{game.title}</h1>
                <p style={S.venue}>📍 {game.venue}</p>
            </div>

            <div style={S.grid} className="game-grid">
                {/* Left: Info + Action */}
                <div style={S.infoCol}>
                    <div className="glass-panel" style={S.card}>
                        <h3 style={S.cardTitle}>Match Details</h3>
                        <div style={S.detailRow}><span>Date:</span><strong>{game.game_date}</strong></div>
                        <div style={S.detailRow}><span>Time:</span><strong>{game.game_time}</strong></div>
                        <div style={S.detailRow}><span>Price:</span><strong style={{ color: BRAND_BLUE }}>{isPaid ? `RM ${game.price}` : "FREE"}</strong></div>
                        <div style={S.detailRow}><span>Teams:</span><strong>{game.team_a_name} vs {game.team_b_name}</strong></div>
                        {game.description && <p style={S.desc}>{game.description}</p>}

                        {!is_owner && (
                            <ActionPanel
                                booking={my_booking}
                                game={game}
                                isPaid={isPaid}
                                isFull={isFull}
                                isPast={isPast}
                                joining={joining}
                                uploading={uploading}
                                onJoin={handleJoin}
                                onUpload={handleUploadReceipt}
                            />
                        )}

                        {is_owner && (
                            <div style={S.ownerNote}>You are the organizer of this match.</div>
                        )}
                    </div>
                </div>

                {/* Right: Players or Organizer Review */}
                <div style={S.playerCol}>
                    {is_owner ? (
                        <OrganizerReview
                            bookings={bookings}
                            total={game.total_slots}
                            onApprove={handleApprove}
                            onReject={handleReject}
                        />
                    ) : (
                        <div className="glass-panel" style={S.card}>
                            <h3 style={S.cardTitle}>Confirmed Players ({players.length}/{game.total_slots})</h3>
                            <div style={S.playerList}>
                                {players.length === 0 ? (
                                    <p style={{ color: "#555", fontSize: 13 }}>No confirmed players yet. Be the first!</p>
                                ) : (
                                    players.map(p => (
                                        <div key={p.id} style={{ ...S.playerRow, cursor: "pointer" }} onClick={() => navigate(`/community/members/${p.id}`)}>
                                            <div style={S.avatar}>
                                                {p.avatar ? <img src={p.avatar} alt="" style={S.avatarImg} /> : p.name[0]}
                                            </div>
                                            <span style={S.playerName}>{p.name}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Player action panel: drives join → pay → upload → status ──────────────────
function ActionPanel({ booking, game, isPaid, isFull, isPast, joining, uploading, onJoin, onUpload }) {
    const status = booking?.status || null;

    // Match closed states
    if (isPast || game.status === "completed")
        return <div style={{ ...S.statusBox, ...S.statusMuted }}>MATCH COMPLETED</div>;
    if (game.status === "cancelled")
        return <div style={{ ...S.statusBox, ...S.statusMuted }}>MATCH CANCELLED</div>;

    // Confirmed
    if (status === "confirmed")
        return <div style={{ ...S.statusBox, ...S.statusGood }}>✓ YOU'RE CONFIRMED FOR THIS MATCH</div>;

    // Awaiting organizer approval
    if (status === "awaiting_approval")
        return (
            <div>
                <div style={{ ...S.statusBox, ...S.statusWarn }}>⏳ RECEIPT SUBMITTED — AWAITING ORGANIZER APPROVAL</div>
                {booking?.receipt_url && (
                    <a href={booking.receipt_url} target="_blank" rel="noreferrer" style={S.viewReceiptLink}>View submitted receipt →</a>
                )}
            </div>
        );

    // Rejected → allow re-upload
    if (status === "rejected")
        return (
            <div>
                <div style={{ ...S.statusBox, ...S.statusBad }}>✗ PAYMENT REJECTED — PLEASE RE-UPLOAD A VALID RECEIPT</div>
                <PaymentBlock game={game} uploading={uploading} onUpload={onUpload} />
            </div>
        );

    // Pending → show QR + upload receipt
    if (status === "pending")
        return <PaymentBlock game={game} uploading={uploading} onUpload={onUpload} />;

    // Not joined yet
    const disabled = joining || game.status !== "open" || isFull;
    return (
        <button
            style={{ ...S.joinBtn, background: disabled ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #00D4EC, #D040EF)", color: disabled ? "rgba(255,255,255,0.2)" : "#080810" }}
            onClick={onJoin}
            disabled={disabled}
        >
            {joining ? "JOINING..." : isFull ? "MATCH FULL" : isPaid ? "JOIN & PAY" : "JOIN THIS MATCH"}
        </button>
    );
}

// ── QR + receipt upload block ─────────────────────────────────────────────────
function PaymentBlock({ game, uploading, onUpload }) {
    return (
        <div style={S.payBlock}>
            <div style={S.payTitle}>STEP 1 — PAY RM {game.price}</div>
            <p style={S.paySub}>Scan this QR with your banking app to pay the organizer.</p>
            <img
                src={game.qr_code_url || "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NuvraMatch"}
                style={S.qr}
                alt="Payment QR"
            />
            <div style={{ ...S.payTitle, marginTop: 24 }}>STEP 2 — UPLOAD RECEIPT</div>
            <p style={S.paySub}>Upload a screenshot of your payment. The organizer will confirm your spot.</p>
            <label style={{ ...S.uploadBtn, opacity: uploading ? 0.6 : 1 }}>
                <input type="file" hidden accept="image/*" onChange={onUpload} disabled={uploading} />
                {uploading ? "UPLOADING..." : "📤 UPLOAD PAYMENT RECEIPT"}
            </label>
        </div>
    );
}

// ── Organizer review panel ────────────────────────────────────────────────────
function OrganizerReview({ bookings, total, onApprove, onReject }) {
    const confirmed = bookings.filter(b => b.status === "confirmed").length;
    const badge = (status) => {
        const map = {
            awaiting_approval: { label: "AWAITING REVIEW", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
            pending: { label: "NOT PAID", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
            confirmed: { label: "CONFIRMED", color: BRAND_BLUE, bg: "rgba(0,212,236,0.12)" },
        };
        const s = map[status] || map.pending;
        return <span style={{ ...S.statusBadge, color: s.color, background: s.bg }}>{s.label}</span>;
    };

    return (
        <div className="glass-panel" style={S.card}>
            <h3 style={S.cardTitle}>Manage Bookings ({confirmed}/{total} confirmed)</h3>
            <div style={S.playerList}>
                {bookings.length === 0 ? (
                    <p style={{ color: "#555", fontSize: 13 }}>No bookings yet.</p>
                ) : (
                    bookings.map(b => (
                        <div key={b.booking_id} style={S.bookingRow}>
                            <div style={S.bookingTop}>
                                <div style={S.avatar}>
                                    {b.avatar ? <img src={b.avatar} alt="" style={S.avatarImg} /> : b.name[0]}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={S.playerName}>{b.name}</div>
                                    {badge(b.status)}
                                </div>
                            </div>

                            {b.payment_receipt && (
                                <a href={b.payment_receipt} target="_blank" rel="noreferrer">
                                    <img src={b.payment_receipt} alt="receipt" style={S.receiptThumb} />
                                </a>
                            )}

                            {b.status === "awaiting_approval" && (
                                <div style={S.actionRow}>
                                    <button style={S.approveBtn} onClick={() => onApprove(b.booking_id)}>✓ Approve</button>
                                    <button style={S.rejectBtn} onClick={() => onReject(b.booking_id)}>✗ Reject</button>
                                </div>
                            )}
                            {b.status === "pending" && (
                                <p style={S.awaitingPay}>Waiting for player to pay & upload receipt.</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const S = {
    container: { maxWidth: 1000, margin: "0 auto", padding: "40px 20px" },
    hero: { marginBottom: 40 },
    backBtn: { background: "none", border: "none", color: BRAND_BLUE, fontWeight: 800, fontSize: 12, cursor: "pointer", marginBottom: 20 },
    title: { fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 8 },
    venue: { fontSize: 16, color: "rgba(255,255,255,0.5)" },
    grid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 30 },
    card: { padding: 30, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" },
    cardTitle: { fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 },
    detailRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 14 },
    desc: { marginTop: 24, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" },
    joinBtn: { width: "100%", marginTop: 30, padding: 16, borderRadius: 12, border: "none", fontWeight: 800, cursor: "pointer", fontSize: 14 },
    ownerNote: { marginTop: 30, padding: 14, borderRadius: 12, background: "rgba(0,212,236,0.08)", color: BRAND_BLUE, fontSize: 13, fontWeight: 700, textAlign: "center" },

    // status boxes
    statusBox: { marginTop: 30, padding: 16, borderRadius: 12, fontSize: 13, fontWeight: 800, textAlign: "center", letterSpacing: 0.3 },
    statusGood: { background: "rgba(34,197,94,0.12)", color: "#22c55e" },
    statusWarn: { background: "rgba(245,158,11,0.12)", color: "#f59e0b" },
    statusBad: { background: "rgba(239,68,68,0.12)", color: "#ef4444" },
    statusMuted: { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" },
    viewReceiptLink: { display: "block", marginTop: 12, textAlign: "center", color: BRAND_BLUE, fontSize: 12, fontWeight: 700, textDecoration: "none" },

    // payment block
    payBlock: { marginTop: 30, padding: 20, borderRadius: 16, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" },
    payTitle: { fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: 1, marginBottom: 6 },
    paySub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14, lineHeight: 1.5 },
    qr: { width: "100%", maxWidth: 360, height: "auto", display: "block", borderRadius: 12, margin: "0 auto", background: "#fff", padding: 12 },
    uploadBtn: { display: "block", marginTop: 12, padding: 14, borderRadius: 12, background: "linear-gradient(135deg, #00D4EC, #D040EF)", color: "#080810", fontWeight: 800, fontSize: 13, cursor: "pointer" },

    // players / bookings
    playerList: { display: "flex", flexDirection: "column", gap: 12 },
    playerRow: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0" },
    avatar: { width: 36, height: 36, borderRadius: "50%", background: "#2a2a30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    playerName: { fontSize: 14, color: "#fff", fontWeight: 600 },

    // organizer review rows
    bookingRow: { padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" },
    bookingTop: { display: "flex", alignItems: "center", gap: 12 },
    statusBadge: { display: "inline-block", marginTop: 4, padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 0.5 },
    receiptThumb: { width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 10, marginTop: 12, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" },
    actionRow: { display: "flex", gap: 10, marginTop: 12 },
    approveBtn: { flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontWeight: 800, fontSize: 12, cursor: "pointer" },
    rejectBtn: { flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 800, fontSize: 12, cursor: "pointer" },
    awaitingPay: { marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.35)", fontStyle: "italic" },
};
