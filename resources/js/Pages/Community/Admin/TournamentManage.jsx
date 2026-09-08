import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLoader from "../../../Components/PageLoader";

const API = "/api/community";
const BRAND_CYAN = "#00D4EC";

const authHeaders = () => {
    const token = localStorage.getItem("community_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function TournamentManage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("teams"); // teams, fixtures

    // Team form state
    const [teamName, setTeamName] = useState("");
    const [groupName, setGroupName] = useState("");
    const [addingTeam, setAddingTeam] = useState(false);

    // Fixture form state
    const [fixtureGw, setFixtureGw] = useState("Matchweek 1");
    const [homeTeam, setHomeTeam] = useState("");
    const [awayTeam, setAwayTeam] = useState("");
    const [fixtureDate, setFixtureDate] = useState("");
    const [fixtureTime, setFixtureTime] = useState("20:00");
    const [fixtureVenue, setFixtureVenue] = useState("");
    const [addingFixture, setAddingFixture] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const res = await fetch(`${API}/tournaments/${id}`, { headers: { ...authHeaders() } });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                if (json.teams && json.teams.length >= 2) {
                    if (!homeTeam) setHomeTeam(json.teams[0].name);
                    if (!awayTeam) setAwayTeam(json.teams[1].name);
                }
                if (!fixtureVenue && json.tournament?.venue) {
                    setFixtureVenue(json.tournament.venue);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeam = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) return;
        setAddingTeam(true);
        try {
            const res = await fetch(`${API}/tournaments/${id}/teams`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ name: teamName.trim(), group_name: groupName.trim() || null })
            });
            if (res.ok) {
                setTeamName("");
                setGroupName("");
                fetchDetail();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to add team");
            }
        } catch {
            alert("Error adding team");
        } finally {
            setAddingTeam(false);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!confirm("Adakah anda pasti mahu memadam pasukan ini?")) return;
        try {
            const res = await fetch(`${API}/tournaments/${id}/teams/${teamId}`, {
                method: "DELETE",
                headers: { ...authHeaders() }
            });
            if (res.ok) fetchDetail();
        } catch {
            alert("Error deleting team");
        }
    };

    const handleAddFixture = async (e) => {
        e.preventDefault();
        if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
            return alert("Sila pilih dua pasukan berbeza untuk perlawanan!");
        }
        if (!fixtureDate) return alert("Sila pilih tarikh perlawanan!");

        setAddingFixture(true);
        try {
            const hObj = data.teams.find(t => t.name === homeTeam);
            const aObj = data.teams.find(t => t.name === awayTeam);

            const res = await fetch(`${API}/tournaments/${id}/fixtures`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameweek: fixtureGw,
                    home_team_id: hObj ? hObj.id : null,
                    away_team_id: aObj ? aObj.id : null,
                    home_team_name: homeTeam,
                    away_team_name: awayTeam,
                    match_date: fixtureDate,
                    match_time: fixtureTime,
                    venue: fixtureVenue
                })
            });
            if (res.ok) {
                alert("Perlawanan berjaya ditambah!");
                fetchDetail();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to add fixture");
            }
        } catch {
            alert("Error adding fixture");
        } finally {
            setAddingFixture(false);
        }
    };

    const handleDeleteFixture = async (matchId) => {
        if (!confirm("Padam perlawanan ini?")) return;
        try {
            const res = await fetch(`${API}/matches/${matchId}`, {
                method: "DELETE",
                headers: { ...authHeaders() }
            });
            if (res.ok) fetchDetail();
        } catch {
            alert("Error deleting fixture");
        }
    };

    if (loading) return <PageLoader />;
    if (!data) return <div style={{ color: "#fff", textAlign: "center", padding: 100 }}>Kejohanan tidak dijumpai</div>;

    const { tournament, teams, gameweeks } = data;

    return (
        <div style={S.container}>
            <div style={S.topBar}>
                <button onClick={() => navigate(`/community/tournaments/${tournament.id}`)} style={S.backBtn}>
                    ← KEMBALI KE PAPARAN AWAM
                </button>
                <span style={S.badgeAdmin}>👑 PENGANJUR</span>
            </div>

            <h1 style={S.pageTitle}>Urus Kejohanan: {tournament.name}</h1>
            <p style={S.pageSub}>Tambah pasukan dan susun jadual perlawanan mengikut pusingan Gameweek.</p>

            <div style={S.tabs}>
                <button
                    style={{ ...S.tabBtn, ...(tab === "teams" ? S.activeTabBtn : {}) }}
                    onClick={() => setTab("teams")}
                >
                    🛡️ PASUKAN BERTANDING ({teams.length})
                </button>
                <button
                    style={{ ...S.tabBtn, ...(tab === "fixtures" ? S.activeTabBtn : {}) }}
                    onClick={() => setTab("fixtures")}
                >
                    📅 JADUAL GAMEWEEK & PERLAWANAN
                </button>
            </div>

            {/* TAB: TEAMS */}
            {tab === "teams" && (
                <div style={S.grid}>
                    {/* Add Team Form */}
                    <div style={S.card}>
                        <h3 style={S.cardTitle}>Daftar Pasukan Baru</h3>
                        <form onSubmit={handleAddTeam} style={S.form}>
                            <div>
                                <label style={S.label}>Nama Pasukan *</label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="cth: Komu FC, AI FC"
                                    style={S.input}
                                    required
                                />
                            </div>
                            <div>
                                <label style={S.label}>Kumpulan (Pilihan jika ada)</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="cth: Group A"
                                    style={S.input}
                                />
                            </div>
                            <button type="submit" disabled={addingTeam} style={S.submitBtn}>
                                {addingTeam ? "Menambah..." : "+ Tambah Pasukan"}
                            </button>
                        </form>
                    </div>

                    {/* Teams List */}
                    <div style={S.card}>
                        <h3 style={S.cardTitle}>Senarai Pasukan Berdaftar ({teams.length})</h3>
                        <div style={S.list}>
                            {teams.length === 0 ? (
                                <p style={{ color: "#666", fontSize: 13 }}>Belum ada pasukan. Sila tambah di sebelah.</p>
                            ) : (
                                teams.map((t) => (
                                    <div key={t.id} style={S.teamRow}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={S.teamMiniShield}>{t.name.substring(0, 2).toUpperCase()}</div>
                                            <div>
                                                <span style={{ fontWeight: 800, color: "#fff" }}>{t.name}</span>
                                                {t.group_name && <span style={S.groupLabel}>{t.group_name}</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTeam(t.id)}
                                            style={S.deleteBtn}
                                            title="Padam Pasukan"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: FIXTURES */}
            {tab === "fixtures" && (
                <div style={S.grid}>
                    {/* Add Fixture Form */}
                    <div style={S.card}>
                        <h3 style={S.cardTitle}>Jadualkan Perlawanan Baru</h3>
                        <form onSubmit={handleAddFixture} style={S.form}>
                            <div>
                                <label style={S.label}>Pusingan / Gameweek *</label>
                                <input
                                    type="text"
                                    value={fixtureGw}
                                    onChange={(e) => setFixtureGw(e.target.value)}
                                    placeholder="cth: Matchweek 1, Separuh Akhir"
                                    style={S.input}
                                    required
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                    <label style={S.label}>Pasukan Tuan Rumah *</label>
                                    <select
                                        value={homeTeam}
                                        onChange={(e) => setHomeTeam(e.target.value)}
                                        style={S.select}
                                        required
                                    >
                                        <option value="">-- Pilih Pasukan --</option>
                                        {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={S.label}>Pasukan Pelawat *</label>
                                    <select
                                        value={awayTeam}
                                        onChange={(e) => setAwayTeam(e.target.value)}
                                        style={S.select}
                                        required
                                    >
                                        <option value="">-- Pilih Pasukan --</option>
                                        {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                    <label style={S.label}>Tarikh Perlawanan *</label>
                                    <input
                                        type="date"
                                        value={fixtureDate}
                                        onChange={(e) => setFixtureDate(e.target.value)}
                                        style={S.input}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={S.label}>Masa Sepak Mula *</label>
                                    <input
                                        type="time"
                                        value={fixtureTime}
                                        onChange={(e) => setFixtureTime(e.target.value)}
                                        style={S.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={S.label}>Padang / Gelanggang</label>
                                <input
                                    type="text"
                                    value={fixtureVenue}
                                    onChange={(e) => setFixtureVenue(e.target.value)}
                                    placeholder="cth: Padang A, Uptown Sports"
                                    style={S.input}
                                />
                            </div>

                            <button type="submit" disabled={addingFixture} style={S.submitBtn}>
                                {addingFixture ? "Menjadualkan..." : "+ Tambah Perlawanan"}
                            </button>
                        </form>
                    </div>

                    {/* Existing Fixtures List Grouped by Gameweek */}
                    <div style={S.card}>
                        <h3 style={S.cardTitle}>Perlawanan Yang Telah Dijadualkan</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                            {Object.entries(gameweeks).length === 0 ? (
                                <p style={{ color: "#666", fontSize: 13 }}>Belum ada perlawanan.</p>
                            ) : (
                                Object.entries(gameweeks).map(([gw, matches]) => (
                                    <div key={gw} style={S.gwGroup}>
                                        <div style={S.gwHeader}>{gw} ({matches.length} Perlawanan)</div>
                                        {matches.map((m) => (
                                            <div key={m.id} style={S.fixtureRow}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>
                                                        {m.home_team_name} {m.home_score !== null ? `(${m.home_score})` : ""} vs {m.away_team_name} {m.away_score !== null ? `(${m.away_score})` : ""}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                                                        {m.match_date} • {m.match_time?.substring(0, 5)} • {m.venue}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteFixture(m.id)}
                                                    style={S.deleteMiniBtn}
                                                    title="Padam Perlawanan"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const S = {
    container: {
        maxWidth: 1050,
        margin: "0 auto",
        padding: "20px 16px 80px",
        fontFamily: "'Inter', sans-serif",
        color: "#fff",
    },
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    backBtn: {
        background: "none",
        border: "none",
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
    },
    badgeAdmin: {
        background: "rgba(0, 212, 236, 0.1)",
        color: BRAND_CYAN,
        border: "1px solid rgba(0, 212, 236, 0.3)",
        fontSize: 11,
        fontWeight: 900,
        padding: "4px 10px",
        borderRadius: 6,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 900,
        marginBottom: 4,
    },
    pageSub: {
        fontSize: 13,
        color: "rgba(255,255,255,0.5)",
        marginBottom: 24,
    },
    tabs: {
        display: "flex",
        gap: 8,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 24,
    },
    tabBtn: {
        background: "none",
        border: "none",
        color: "rgba(255,255,255,0.45)",
        fontSize: 13,
        fontWeight: 800,
        padding: "10px 16px",
        cursor: "pointer",
        borderRadius: 8,
    },
    activeTabBtn: {
        color: BRAND_CYAN,
        background: "rgba(0, 212, 236, 0.08)",
        borderBottom: `2px solid ${BRAND_CYAN}`,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 20,
    },
    card: {
        background: "rgba(18, 22, 32, 0.8)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 24,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 800,
        marginBottom: 16,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },
    label: {
        display: "block",
        fontSize: 11,
        fontWeight: 800,
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "#fff",
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
    },
    select: {
        width: "100%",
        padding: "10px 12px",
        background: "#161a24",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "#fff",
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
    },
    submitBtn: {
        background: BRAND_CYAN,
        border: "none",
        color: "#000",
        padding: 12,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 900,
        cursor: "pointer",
        marginTop: 4,
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    teamRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
    },
    teamMiniShield: {
        width: 28,
        height: 28,
        borderRadius: 6,
        background: "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 900,
        color: BRAND_CYAN,
    },
    groupLabel: {
        marginLeft: 8,
        fontSize: 10,
        background: "rgba(255,255,255,0.08)",
        color: "#aaa",
        padding: "2px 6px",
        borderRadius: 4,
    },
    deleteBtn: {
        background: "rgba(239, 68, 68, 0.1)",
        border: "none",
        color: "#ef4444",
        width: 26,
        height: 26,
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 900,
    },
    gwGroup: {
        background: "rgba(0,0,0,0.2)",
        borderRadius: 8,
        padding: 12,
        border: "1px solid rgba(255,255,255,0.04)",
    },
    gwHeader: {
        fontSize: 12,
        fontWeight: 900,
        color: BRAND_CYAN,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    fixtureRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderTop: "1px solid rgba(255,255,255,0.04)",
    },
    deleteMiniBtn: {
        background: "none",
        border: "none",
        color: "rgba(255,255,255,0.3)",
        fontSize: 12,
        cursor: "pointer",
        padding: 4,
    },
};
