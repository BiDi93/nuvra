import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLoader from "../../Components/PageLoader";

const API = "/api/community";

export default function GameDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const res = await fetch(`${API}/games/${id}`);
            const json = await res.json();
            if (res.ok) setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const resData = await res.json();
            if (res.ok) {
                setMessage(resData.message);
                if (data.game.price > 0) setShowQR(true);
                fetchDetail();
            } else {
                alert(resData.message);
            }
        } catch (err) {
            alert("Error joining game");
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <PageLoader />;
    if (!data) return <div style={{ color: "#fff", textAlign: "center", padding: 100 }}>Match not found</div>;

    const { game, players } = data;
    const isFull = (players?.length || 0) >= (game?.total_slots || 0);
    const isPast = new Date(game.game_date) < new Date().setHours(0,0,0,0);

    const getButtonText = () => {
        if (joining) return "JOINING...";
        if (game.status === 'completed' || isPast) return "MATCH COMPLETED";
        if (game.status === 'cancelled') return "MATCH CANCELLED";
        if (isFull) return "MATCH FULL";
        return "JOIN THIS MATCH";
    };

    const isDisabled = joining || game.status !== 'open' || isFull || isPast;

    return (
        <div style={S.container}>
            <style>{`
                @media (max-width: 768px) {
                    .game-grid { grid-template-columns: 1fr !important; }
                    .game-title { font-size: 26px !important; }
                }
            `}</style>
            {/* Header / Banner */}
            <div style={S.hero}>
                <button onClick={() => navigate("/community/feed")} style={S.backBtn}>← BACK TO FEED</button>
                <h1 style={S.title} className="game-title">{game.title}</h1>
                <p style={S.venue}>📍 {game.venue}</p>
            </div>

            <div style={S.grid} className="game-grid">
                {/* Left: Info */}
                <div style={S.infoCol}>
                    <div className="glass-panel" style={S.card}>
                        <h3 style={S.cardTitle}>Match Details</h3>
                        <div style={S.detailRow}>
                            <span>Date:</span>
                            <strong>{game.game_date}</strong>
                        </div>
                        <div style={S.detailRow}>
                            <span>Time:</span>
                            <strong>{game.game_time}</strong>
                        </div>
                        <div style={S.detailRow}>
                            <span>Price:</span>
                            <strong style={{ color: "#00D4EC" }}>RM {game.price}</strong>
                        </div>
                        <div style={S.detailRow}>
                            <span>Teams:</span>
                            <strong>{game.team_a_name} vs {game.team_b_name}</strong>
                        </div>
                        
                        <p style={S.desc}>{game.description}</p>

                        <button 
                            style={{ 
                                ...S.joinBtn, 
                                background: isDisabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00D4EC, #D040EF)',
                                color: isDisabled ? 'rgba(255,255,255,0.2)' : '#080810'
                            }} 
                            onClick={handleJoin}
                            disabled={isDisabled}
                        >
                            {getButtonText()}
                        </button>
                    </div>

                    {showQR && (
                        <div className="glass-panel" style={{ ...S.card, marginTop: 20, textAlign: 'center' }}>
                            <h3 style={S.cardTitle}>Payment Required</h3>
                            <p style={{ fontSize: 13, color: '#72727e', marginBottom: 15 }}>
                                Please scan this QR to pay <strong>RM {game.price}</strong> to the organizer.
                            </p>
                            <img src={game.qr_code_url || "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NuvraMatch"} style={{ width: 200, borderRadius: 10, margin: '0 auto' }} />
                            <button onClick={() => setShowQR(false)} style={{ ...S.backBtn, marginTop: 15 }}>Close</button>
                        </div>
                    )}
                </div>

                {/* Right: Players */}
                <div style={S.playerCol}>
                    <div className="glass-panel" style={S.card}>
                        <h3 style={S.cardTitle}>Joined Players ({players.length}/{game.total_slots})</h3>
                        <div style={S.playerList}>
                            {players.length === 0 ? (
                                <p style={{ color: '#555', fontSize: 13 }}>No players yet. Be the first!</p>
                            ) : (
                                players.map(p => (
                                    <div 
                                        key={p.id} 
                                        style={{ ...S.playerRow, cursor: 'pointer' }}
                                        onClick={() => navigate(`/community/members/${p.id}`)}
                                    >
                                        <div style={S.avatar}>
                                            {p.avatar ? (
                                                <img src={p.avatar} alt="" style={S.avatarImg} />
                                            ) : (
                                                p.name[0]
                                            )}
                                        </div>
                                        <span style={S.playerName}>{p.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    container: { maxWidth: 1000, margin: "0 auto", padding: "40px 20px" },
    hero: { marginBottom: 40 },
    backBtn: { background: "none", border: "none", color: "#00D4EC", fontWeight: 800, fontSize: 12, cursor: "pointer", marginBottom: 20 },
    title: { fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 8 },
    venue: { fontSize: 16, color: "rgba(255,255,255,0.5)" },
    grid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 30 },
    card: { padding: 30, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" },
    cardTitle: { fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 24 },
    detailRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 14 },
    desc: { marginTop: 24, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" },
    joinBtn: { width: "100%", marginTop: 30, padding: 16, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #00D4EC, #D040EF)", color: "#080810", fontWeight: 800, cursor: "pointer" },
    playerList: { display: "flex", flexDirection: "column", gap: 12 },
    playerRow: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0" },
    avatar: { width: 32, height: 32, borderRadius: "50%", background: "#2a2a30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    playerName: { fontSize: 14, color: "#fff" },
};
