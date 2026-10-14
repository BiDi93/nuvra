import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Contexts/AuthContext';
import {
    fetchProfile,
    updateProfile,
    fetchPlayerClubHistory,
    addPlayerClubHistory,
    deletePlayerClubHistory,
    isSupabaseConfigured
} from '../../lib/supabase';

export default function PlayerDashboard() {
    const { user, profile, refreshProfile } = useAuth();

    const [playerProfile, setPlayerProfile] = useState({
        full_name: 'Pemain NUVRA',
        position: 'Midfielder',
        dominant_foot: 'Right',
        district: 'Petaling Jaya',
        state: 'Selangor',
        bio: 'Grassroots football enthusiast.',
        pace: 75,
        shooting: 72,
        passing: 78,
        dribbling: 76,
        defending: 68,
        physical: 74,
        overall_rating: 74,
        vellar_id: '82',
    });

    const [clubHistory, setClubHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');

    // Modal Forms State
    const [editForm, setEditForm] = useState({
        full_name: '',
        position: 'Midfielder',
        dominant_foot: 'Right',
        district: 'Petaling Jaya',
        state: 'Selangor',
        bio: '',
        height_cm: '',
        weight_kg: '',
    });

    const [historyForm, setHistoryForm] = useState({
        club_name: '',
        league_name: '',
        season: '2025/2026',
        position_played: 'Midfielder',
        jersey_number: '10',
        appearances: '12',
        goals: '4',
        assists: '6',
        achievements: 'Semi-finalist',
        is_current: true,
    });

    useEffect(() => {
        loadData();
    }, [user, profile]);

    const loadData = async () => {
        setLoading(true);
        if (profile) {
            setPlayerProfile((prev) => ({ ...prev, ...profile }));
            setEditForm({
                full_name: profile.full_name || '',
                position: profile.position || 'Midfielder',
                dominant_foot: profile.dominant_foot || 'Right',
                district: profile.district || 'Petaling Jaya',
                state: profile.state || 'Selangor',
                bio: profile.bio || '',
                height_cm: profile.height_cm || '',
                weight_kg: profile.weight_kg || '',
            });
        }

        if (user?.id && isSupabaseConfigured) {
            try {
                const history = await fetchPlayerClubHistory(user.id);
                setClubHistory(history || []);
            } catch (err) {
                console.warn('Gagal memuat sejarah kelab:', err);
            }
        } else {
            // Data demo setempat jika Supabase belum disambung
            setClubHistory([
                {
                    id: 'demo-1',
                    club_name: 'Subang United FC',
                    league_name: 'Vellar League Season 1',
                    season: '2025',
                    position_played: 'Midfielder',
                    jersey_number: 8,
                    appearances: 14,
                    goals: 5,
                    assists: 7,
                    achievements: 'Juara Kumpulan A',
                    is_current: true,
                },
                {
                    id: 'demo-2',
                    club_name: 'Petaling Titans',
                    league_name: 'Liga Lembah Klang Social',
                    season: '2024',
                    position_played: 'Attacking Midfielder',
                    jersey_number: 10,
                    appearances: 10,
                    goals: 3,
                    assists: 4,
                    achievements: 'Naib Juara Piala Komuniti',
                    is_current: false,
                }
            ]);
        }
        setLoading(false);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFeedbackMsg('');
        try {
            if (user?.id && isSupabaseConfigured) {
                await updateProfile(user.id, {
                    full_name: editForm.full_name,
                    position: editForm.position,
                    dominant_foot: editForm.dominant_foot,
                    district: editForm.district,
                    state: editForm.state,
                    bio: editForm.bio,
                    height_cm: editForm.height_cm ? parseFloat(editForm.height_cm) : null,
                    weight_kg: editForm.weight_kg ? parseFloat(editForm.weight_kg) : null,
                    is_profile_completed: true,
                });
                await refreshProfile();
            } else {
                setPlayerProfile((prev) => ({ ...prev, ...editForm }));
            }
            setFeedbackMsg('Profil berjaya dikemas kini!');
            setShowEditProfileModal(false);
        } catch (err) {
            setFeedbackMsg('Ralat semasa mengemas kini profil: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddHistory = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (user?.id && isSupabaseConfigured) {
                const newRecord = await addPlayerClubHistory({
                    player_id: user.id,
                    club_name: historyForm.club_name,
                    league_name: historyForm.league_name,
                    season: historyForm.season,
                    position_played: historyForm.position_played,
                    jersey_number: parseInt(historyForm.jersey_number) || null,
                    appearances: parseInt(historyForm.appearances) || 0,
                    goals: parseInt(historyForm.goals) || 0,
                    assists: parseInt(historyForm.assists) || 0,
                    achievements: historyForm.achievements,
                    is_current: Boolean(historyForm.is_current),
                });
                setClubHistory((prev) => [newRecord, ...prev]);
            } else {
                const mockRecord = {
                    id: 'mock-' + Date.now(),
                    ...historyForm,
                    appearances: parseInt(historyForm.appearances) || 0,
                    goals: parseInt(historyForm.goals) || 0,
                    assists: parseInt(historyForm.assists) || 0,
                };
                setClubHistory((prev) => [mockRecord, ...prev]);
            }
            setShowAddHistoryModal(false);
            setHistoryForm({
                club_name: '',
                league_name: '',
                season: '2025/2026',
                position_played: playerProfile.position || 'Midfielder',
                jersey_number: '10',
                appearances: '0',
                goals: '0',
                assists: '0',
                achievements: '',
                is_current: true,
            });
        } catch (err) {
            alert('Gagal menambah rekod: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHistory = async (id) => {
        if (!confirm('Adakah anda pasti ingin memadam rekod kelab ini?')) return;
        try {
            if (isSupabaseConfigured && !id.startsWith('demo-') && !id.startsWith('mock-')) {
                await deletePlayerClubHistory(id);
            }
            setClubHistory((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            alert('Ralat semasa memadam: ' + err.message);
        }
    };

    const totalAppearances = clubHistory.reduce((sum, i) => sum + (i.appearances || 0), 0);
    const totalGoals = clubHistory.reduce((sum, i) => sum + (i.goals || 0), 0);
    const totalAssists = clubHistory.reduce((sum, i) => sum + (i.assists || 0), 0);

    return (
        <div style={P.container}>
            {/* TOP HEADER */}
            <div style={P.topBar}>
                <div>
                    <h1 style={P.pageTitle}>Dashboard Pemain</h1>
                    <p style={P.pageSubtitle}>
                        Kad Statistik Digital & Sejarah Pasukan Grassroots Bebas
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => setShowEditProfileModal(true)}
                        style={P.secondaryBtn}
                    >
                        Sunting Profil
                    </button>
                    <button
                        onClick={() => setShowAddHistoryModal(true)}
                        style={P.primaryBtn}
                    >
                        + Tambah Sejarah Kelab
                    </button>
                </div>
            </div>

            {feedbackMsg && (
                <div style={P.feedbackBanner}>
                    {feedbackMsg}
                </div>
            )}

            {/* MAIN TWO-COLUMN GRID */}
            <div style={P.gridContainer}>
                {/* LEFT: FIFA CARD & CORE PLAYER ATTRIBUTES */}
                <div style={P.leftCol}>
                    {/* FIFA CARD WRAPPER */}
                    <div style={P.fifaCard}>
                        <div style={P.fifaGlow} />
                        <div style={P.fifaTop}>
                            <div style={P.ratingBox}>
                                <span style={P.overallNumber}>{playerProfile.overall_rating || 74}</span>
                                <span style={P.positionCode}>{playerProfile.position?.substring(0, 3).toUpperCase() || 'MID'}</span>
                                <span style={P.nationText}>🇲🇾 MAS</span>
                            </div>
                            <div style={P.fifaAvatarWrap}>
                                <img
                                    src={playerProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerProfile.full_name)}&background=00D4EC&color=080810&bold=true`}
                                    alt={playerProfile.full_name}
                                    style={P.fifaAvatar}
                                />
                            </div>
                        </div>

                        <div style={P.fifaPlayerName}>
                            {playerProfile.full_name?.toUpperCase() || 'NUVRA PLAYER'}
                        </div>

                        {/* STATS BARS */}
                        <div style={P.statsGrid}>
                            <div style={P.statItem}><span style={P.statVal}>{playerProfile.pace || 75}</span> <span style={P.statKey}>PAC</span></div>
                            <div style={P.statItem}><span style={P.statVal}>{playerProfile.dribbling || 76}</span> <span style={P.statKey}>DRI</span></div>
                            <div style={P.statItem}><span style={P.statVal}>{playerProfile.shooting || 72}</span> <span style={P.statKey}>SHO</span></div>
                            <div style={P.statItem}><span style={P.statVal}>{playerProfile.defending || 68}</span> <span style={P.statKey}>DEF</span></div>
                            <div style={P.statItem}><span style={P.statVal}>{playerProfile.passing || 78}</span> <span style={P.statKey}>PAS</span></div>
                            <div style={P.statItem}><span style={P.statVal}>{playerProfile.physical || 74}</span> <span style={P.statKey}>PHY</span></div>
                        </div>

                        {/* BADGES AT BOTTOM OF CARD */}
                        <div style={P.fifaBottomBadges}>
                            <span>Kaki: <strong>{playerProfile.dominant_foot || 'Right'}</strong></span>
                            <span>•</span>
                            <span>Daerah: <strong>{playerProfile.district || 'Petaling'}</strong></span>
                        </div>
                    </div>

                    {/* PLAYER QUICK BIO & ATTRIBUTES SUMMARY */}
                    <div style={P.metaPanel}>
                        <h3 style={P.panelHeading}>Maklumat Pemain</h3>
                        <div style={P.metaList}>
                            <div style={P.metaRow}>
                                <span style={P.metaLabel}>Posisi Pilihan:</span>
                                <span style={P.metaVal}>{playerProfile.position}</span>
                            </div>
                            <div style={P.metaRow}>
                                <span style={P.metaLabel}>Kaki Dominan:</span>
                                <span style={P.metaVal}>{playerProfile.dominant_foot}</span>
                            </div>
                            <div style={P.metaRow}>
                                <span style={P.metaLabel}>Kawasan / Daerah:</span>
                                <span style={P.metaVal}>{playerProfile.district}, {playerProfile.state}</span>
                            </div>
                            <div style={P.metaRow}>
                                <span style={P.metaLabel}>Vellar ID:</span>
                                <span style={{ ...P.metaVal, color: '#00D4EC', fontWeight: 800 }}>
                                    VELLAR {playerProfile.vellar_id || 'PRO'}
                                </span>
                            </div>
                            {playerProfile.bio && (
                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span style={P.metaLabel}>Bio:</span>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.5 }}>
                                        {playerProfile.bio}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: CAREER HISTORY & METRICS */}
                <div style={P.rightCol}>
                    {/* CAREER COUNTER STATS */}
                    <div style={P.counterRow}>
                        <div style={P.counterCard}>
                            <span style={P.counterNum}>{totalAppearances}</span>
                            <span style={P.counterLabel}>Penampilan Keseluruhan</span>
                        </div>
                        <div style={P.counterCard}>
                            <span style={{ ...P.counterNum, color: '#00D4EC' }}>{totalGoals}</span>
                            <span style={P.counterLabel}>Jumlah Gol Rasmi</span>
                        </div>
                        <div style={P.counterCard}>
                            <span style={{ ...P.counterNum, color: '#D040EF' }}>{totalAssists}</span>
                            <span style={P.counterLabel}>Bantuan Gol (Assists)</span>
                        </div>
                    </div>

                    {/* PLAYER CLUB HISTORY SECTION (MODEL TERBUKA TANPA ROSTER TERIKAT) */}
                    <div style={P.historyPanel}>
                        <div style={P.historyHeader}>
                            <div>
                                <h2 style={P.historyTitle}>Sejarah Kelab & Penglibatan Liga</h2>
                                <p style={P.historySubtitle}>
                                    Model terbuka NUVRA: Anda boleh bermain dan merekod perlawanan bersama pelbagai pasukan sosial & kejohanan tanpa kekangan roster terikat.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddHistoryModal(true)}
                                style={P.addSmallBtn}
                            >
                                + Rekod Baru
                            </button>
                        </div>

                        {clubHistory.length === 0 ? (
                            <div style={P.emptyHistory}>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                                    Belum ada rekod kelab atau kejohanan yang dimasukkan.
                                </p>
                                <button
                                    onClick={() => setShowAddHistoryModal(true)}
                                    style={P.primaryBtn}
                                >
                                    Tambah Pengalaman Pertama Anda
                                </button>
                            </div>
                        ) : (
                            <div style={P.historyList}>
                                {clubHistory.map((item) => (
                                    <div key={item.id} style={P.historyCard}>
                                        <div style={P.historyCardTop}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={P.clubAvatar}>
                                                    {item.club_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={P.clubName}>
                                                        {item.club_name}
                                                        {item.is_current && (
                                                            <span style={P.currentBadge}>Aktif Semasa</span>
                                                        )}
                                                    </div>
                                                    <div style={P.leagueText}>
                                                        {item.league_name} • {item.season}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteHistory(item.id)}
                                                style={P.deleteBtn}
                                                title="Padam rekod"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div style={P.historyDetailsRow}>
                                            <div style={P.historyDetailPill}>
                                                Posisi: <strong>{item.position_played || 'Pemain'}</strong>
                                            </div>
                                            <div style={P.historyDetailPill}>
                                                Jersi: <strong>#{item.jersey_number || '-'}</strong>
                                            </div>
                                            <div style={P.historyDetailPill}>
                                                Apps: <strong>{item.appearances}</strong>
                                            </div>
                                            <div style={P.historyDetailPill}>
                                                Gol: <strong>{item.goals}</strong>
                                            </div>
                                            <div style={P.historyDetailPill}>
                                                Assist: <strong>{item.assists}</strong>
                                            </div>
                                        </div>

                                        {item.achievements && (
                                            <div style={P.achieveText}>
                                                🏆 <span>{item.achievements}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL: SUNTING PROFIL */}
            {showEditProfileModal && (
                <div style={P.modalOverlay}>
                    <div style={P.modalCard}>
                        <div style={P.modalHeader}>
                            <h3 style={P.modalTitle}>Sunting Maklumat Pemain</h3>
                            <button onClick={() => setShowEditProfileModal(false)} style={P.closeBtn}>✕</button>
                        </div>
                        <form onSubmit={handleSaveProfile} style={P.modalForm}>
                            <div style={P.formGroup}>
                                <label style={P.label}>Nama Penuh</label>
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    style={P.input}
                                    required
                                />
                            </div>

                            <div style={P.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Posisi Utama</label>
                                    <select
                                        value={editForm.position}
                                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                                        style={P.input}
                                    >
                                        <option value="Goalkeeper">Goalkeeper (GK)</option>
                                        <option value="Defender">Defender (CB/LB/RB)</option>
                                        <option value="Midfielder">Midfielder (CDM/CM/CAM)</option>
                                        <option value="Forward / Striker">Forward / Striker (ST/RW/LW)</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Kaki Dominan</label>
                                    <select
                                        value={editForm.dominant_foot}
                                        onChange={(e) => setEditForm({ ...editForm, dominant_foot: e.target.value })}
                                        style={P.input}
                                    >
                                        <option value="Right">Kanan (Right)</option>
                                        <option value="Left">Kiri (Left)</option>
                                        <option value="Both">Kedua-dua Kaki (Both)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={P.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Daerah</label>
                                    <input
                                        type="text"
                                        placeholder="cth: Petaling Jaya / Shah Alam"
                                        value={editForm.district}
                                        onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                                        style={P.input}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Negeri</label>
                                    <input
                                        type="text"
                                        placeholder="cth: Selangor"
                                        value={editForm.state}
                                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                        style={P.input}
                                    />
                                </div>
                            </div>

                            <div style={P.formGroup}>
                                <label style={P.label}>Bio / Ringkasan Gaya Permainan</label>
                                <textarea
                                    rows="3"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    style={{ ...P.input, resize: 'vertical' }}
                                    placeholder="Ceritakan serba sedikit tentang kelebihan atau gaya bola sepak anda..."
                                />
                            </div>

                            <div style={P.modalActions}>
                                <button type="button" onClick={() => setShowEditProfileModal(false)} style={P.cancelBtn}>Batal</button>
                                <button type="submit" disabled={saving} style={P.primaryBtn}>
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: TAMBAH SEJARAH KELAB */}
            {showAddHistoryModal && (
                <div style={P.modalOverlay}>
                    <div style={P.modalCard}>
                        <div style={P.modalHeader}>
                            <h3 style={P.modalTitle}>Tambah Sejarah Kelab / Kejohanan</h3>
                            <button onClick={() => setShowAddHistoryModal(false)} style={P.closeBtn}>✕</button>
                        </div>
                        <form onSubmit={handleAddHistory} style={P.modalForm}>
                            <div style={P.formGroup}>
                                <label style={P.label}>Nama Kelab / Pasukan *</label>
                                <input
                                    type="text"
                                    placeholder="cth: Damansara City FC"
                                    value={historyForm.club_name}
                                    onChange={(e) => setHistoryForm({ ...historyForm, club_name: e.target.value })}
                                    style={P.input}
                                    required
                                />
                            </div>

                            <div style={P.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Nama Liga / Kejohanan *</label>
                                    <input
                                        type="text"
                                        placeholder="cth: Vellar League S1 / FAS Division 2"
                                        value={historyForm.league_name}
                                        onChange={(e) => setHistoryForm({ ...historyForm, league_name: e.target.value })}
                                        style={P.input}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Musim / Tahun</label>
                                    <input
                                        type="text"
                                        placeholder="cth: 2025/2026"
                                        value={historyForm.season}
                                        onChange={(e) => setHistoryForm({ ...historyForm, season: e.target.value })}
                                        style={P.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={P.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Posisi Dimainkan</label>
                                    <input
                                        type="text"
                                        value={historyForm.position_played}
                                        onChange={(e) => setHistoryForm({ ...historyForm, position_played: e.target.value })}
                                        style={P.input}
                                    />
                                </div>
                                <div style={{ width: 90 }}>
                                    <label style={P.label}>No. Jersi</label>
                                    <input
                                        type="number"
                                        value={historyForm.jersey_number}
                                        onChange={(e) => setHistoryForm({ ...historyForm, jersey_number: e.target.value })}
                                        style={P.input}
                                    />
                                </div>
                            </div>

                            <div style={P.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Penampilan</label>
                                    <input
                                        type="number"
                                        value={historyForm.appearances}
                                        onChange={(e) => setHistoryForm({ ...historyForm, appearances: e.target.value })}
                                        style={P.input}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Gol</label>
                                    <input
                                        type="number"
                                        value={historyForm.goals}
                                        onChange={(e) => setHistoryForm({ ...historyForm, goals: e.target.value })}
                                        style={P.input}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={P.label}>Assists</label>
                                    <input
                                        type="number"
                                        value={historyForm.assists}
                                        onChange={(e) => setHistoryForm({ ...historyForm, assists: e.target.value })}
                                        style={P.input}
                                    />
                                </div>
                            </div>

                            <div style={P.formGroup}>
                                <label style={P.label}>Pencapaian / Catatan (Pilihan)</label>
                                <input
                                    type="text"
                                    placeholder="cth: Juara Kumpulan, Penjaring Terbanyak"
                                    value={historyForm.achievements}
                                    onChange={(e) => setHistoryForm({ ...historyForm, achievements: e.target.value })}
                                    style={P.input}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    id="is_current"
                                    checked={historyForm.is_current}
                                    onChange={(e) => setHistoryForm({ ...historyForm, is_current: e.target.checked })}
                                />
                                <label htmlFor="is_current" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                                    Pasukan / Kelab Aktif Semasa
                                </label>
                            </div>

                            <div style={P.modalActions}>
                                <button type="button" onClick={() => setShowAddHistoryModal(false)} style={P.cancelBtn}>Batal</button>
                                <button type="submit" disabled={saving} style={P.primaryBtn}>
                                    {saving ? 'Menyimpan...' : 'Simpan Rekod'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const P = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
    },
    pageTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 32,
        fontWeight: 900,
        letterSpacing: 1,
        color: '#fff',
    },
    pageSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        marginTop: 4,
    },
    primaryBtn: {
        background: 'linear-gradient(135deg, #00D4EC, #0088CC)',
        color: '#080810',
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        fontSize: 13,
        fontWeight: 800,
        cursor: 'pointer',
    },
    secondaryBtn: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff',
        padding: '10px 18px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
    },
    feedbackBanner: {
        background: 'rgba(0, 212, 236, 0.12)',
        border: '1px solid rgba(0, 212, 236, 0.3)',
        color: '#00D4EC',
        padding: '12px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: 28,
        alignItems: 'start',
    },
    leftCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    rightCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    fifaCard: {
        position: 'relative',
        background: 'linear-gradient(150deg, #181928 0%, #0d0e17 60%, #151624 100%)',
        border: '1.5px solid rgba(0, 212, 236, 0.4)',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
    },
    fifaGlow: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,236,0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    fifaTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    overallNumber: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 54,
        fontWeight: 900,
        color: '#00D4EC',
        lineHeight: 1,
    },
    positionCode: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: 1,
    },
    nationText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    fifaAvatarWrap: {
        width: 110,
        height: 110,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid rgba(0,212,236,0.5)',
    },
    fifaAvatar: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    fifaPlayerName: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: 2,
        textAlign: 'center',
        margin: '18px 0 14px',
        color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 10,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px 16px',
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    statVal: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 20,
        fontWeight: 800,
        color: '#fff',
        width: 26,
    },
    statKey: {
        fontSize: 12,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
    },
    fifaBottomBadges: {
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 18,
        paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    metaPanel: {
        background: '#11121d',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 20,
    },
    panelHeading: {
        fontSize: 14,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 14,
    },
    metaList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    metaRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
    },
    metaLabel: {
        color: 'rgba(255,255,255,0.4)',
    },
    metaVal: {
        color: '#fff',
        fontWeight: 600,
    },
    counterRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
    },
    counterCard: {
        background: '#11121d',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    counterNum: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 36,
        fontWeight: 900,
        color: '#fff',
    },
    counterLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.45)',
        fontWeight: 600,
    },
    historyPanel: {
        background: '#11121d',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 24,
    },
    historyHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        gap: 16,
    },
    historyTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: 0.5,
    },
    historySubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 4,
        maxWidth: 600,
        lineHeight: 1.5,
    },
    addSmallBtn: {
        background: 'rgba(0, 212, 236, 0.1)',
        border: '1px solid rgba(0, 212, 236, 0.3)',
        color: '#00D4EC',
        padding: '6px 14px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    emptyHistory: {
        textAlign: 'center',
        padding: '40px 20px',
    },
    historyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    historyCard: {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    historyCardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clubAvatar: {
        width: 38,
        height: 38,
        borderRadius: 8,
        background: 'rgba(0, 212, 236, 0.15)',
        color: '#00D4EC',
        fontWeight: 800,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clubName: {
        fontSize: 15,
        fontWeight: 700,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    currentBadge: {
        background: 'rgba(52, 199, 89, 0.15)',
        color: '#34c759',
        fontSize: 10,
        padding: '2px 6px',
        borderRadius: 4,
        fontWeight: 700,
    },
    leagueText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.45)',
        marginTop: 2,
    },
    deleteBtn: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.25)',
        fontSize: 14,
        cursor: 'pointer',
        padding: 4,
    },
    historyDetailsRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
    },
    historyDetailPill: {
        background: 'rgba(255,255,255,0.04)',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
    },
    achieveText: {
        fontSize: 12,
        color: '#ffd166',
        fontWeight: 600,
    },
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        background: '#141422',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 520,
        padding: 24,
        boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 800,
        color: '#fff',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 18,
        cursor: 'pointer',
    },
    modalForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    formRow: {
        display: 'flex',
        gap: 12,
    },
    label: {
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        fontSize: 13,
        fontFamily: 'inherit',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 10,
    },
    cancelBtn: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        padding: '8px 16px',
    },
};
