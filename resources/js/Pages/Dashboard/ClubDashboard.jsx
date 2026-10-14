import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Contexts/AuthContext';
import {
    fetchOpenMatchChallenges,
    createMatchChallenge,
    acceptMatchChallenge,
    fetchVenues,
    isSupabaseConfigured
} from '../../lib/supabase';

export default function ClubDashboard() {
    const { user, profile } = useAuth();

    // Club Profile
    const [clubInfo, setClubInfo] = useState({
        club_name: profile?.primary_club_name || 'Shah Alam City FC',
        district: profile?.district || 'Shah Alam',
        manager_name: profile?.full_name || 'Pengurus Kelab',
        matches_played: 18,
        won: 11,
        drawn: 3,
        lost: 4,
    });

    const [matches, setMatches] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDistrict, setFilterDistrict] = useState('All');
    const [filterFormat, setFilterFormat] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State for creating a new match challenge
    const [form, setForm] = useState({
        title: 'Sparring Santai 11v11',
        format: '11v11',
        match_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        kickoff_time: '20:30',
        venue_id: '',
        venue_name_custom: '',
        district: profile?.district || 'Petaling Jaya',
        total_pitch_cost: '300',
        referee_cost: '100',
        preferred_opponent_level: 'Social / Casual',
        rules_notes: 'Jersi Tuan Rumah Gelap, Jersi Lawan Cerah. Sila bawa 2 bola.',
    });

    useEffect(() => {
        loadData();
    }, [filterDistrict, filterFormat]);

    const loadData = async () => {
        setLoading(true);
        if (isSupabaseConfigured) {
            try {
                const filters = {};
                if (filterDistrict !== 'All') filters.district = filterDistrict;
                const matchData = await fetchOpenMatchChallenges(filters);
                setMatches(matchData || []);

                const venueData = await fetchVenues();
                setVenues(venueData || []);
            } catch (err) {
                console.warn('Gagal memuat senarai sparring:', err);
            }
        } else {
            // Mock data demo sparring jika Supabase belum disambung
            setMatches([
                {
                    id: 'mock-1',
                    title: 'Sparring 11v11 Jumaat Malam',
                    format: '11v11',
                    host_manager_id: 'host-1',
                    host_club_name: 'Subang Rovers FC',
                    opponent_club_name: null,
                    district: 'Subang Jaya',
                    venue_name_custom: 'Arena MBSJ Subang Jaya',
                    match_date: '2026-10-18',
                    kickoff_time: '20:30',
                    total_pitch_cost: 320,
                    referee_cost: 100,
                    host_share_cost: 210,
                    opponent_share_cost: 210,
                    split_mode: '50_50',
                    status: 'open_challenge',
                    preferred_opponent_level: 'Social / Casual',
                    rules_notes: 'Padang rumput tiruan penuh. Sediakan kit kecemasan.',
                },
                {
                    id: 'mock-2',
                    title: 'Persahabatan Prapentas Akhir',
                    format: '11v11',
                    host_manager_id: 'host-2',
                    host_club_name: 'Petaling Tigers',
                    opponent_club_name: null,
                    district: 'Petaling Jaya',
                    venue_name_custom: 'Stadium MBPJ Kelana Jaya',
                    match_date: '2026-10-20',
                    kickoff_time: '21:00',
                    total_pitch_cost: 360,
                    referee_cost: 120,
                    host_share_cost: 240,
                    opponent_share_cost: 240,
                    split_mode: '50_50',
                    status: 'open_challenge',
                    preferred_opponent_level: 'Semi-Pro',
                    rules_notes: 'Pengadil FAM berlesen. Jersi biru atau hitam.',
                },
                {
                    id: 'mock-3',
                    title: 'Sparring Veteran 35+',
                    format: '7v7',
                    host_manager_id: 'host-3',
                    host_club_name: 'Klang All Stars',
                    opponent_club_name: 'Shah Alam City FC',
                    district: 'Klang',
                    venue_name_custom: 'Rhinos Futsal & 7s Port Klang',
                    match_date: '2026-10-22',
                    kickoff_time: '20:00',
                    total_pitch_cost: 200,
                    referee_cost: 60,
                    host_share_cost: 130,
                    opponent_share_cost: 130,
                    split_mode: '50_50',
                    status: 'matched',
                    preferred_opponent_level: 'Veteran 35+',
                    rules_notes: 'Santai & hormat pemain veteran.',
                }
            ]);

            setVenues([
                { id: 'v1', name: 'Kompleks Sukan Panasonic Shah Alam', district: 'Shah Alam' },
                { id: 'v2', name: 'Arena MBSJ Subang Jaya', district: 'Subang Jaya' },
                { id: 'v3', name: 'Padang Sintetik Astaka PJ', district: 'Petaling Jaya' },
            ]);
        }
        setLoading(false);
    };

    const handleCreateChallenge = async (e) => {
        e.preventDefault();
        setSaving(true);

        const pitchCost = parseFloat(form.total_pitch_cost) || 0;
        const refCost = parseFloat(form.referee_cost) || 0;
        const total = pitchCost + refCost;
        const halfShare = total / 2;

        try {
            if (user?.id && isSupabaseConfigured) {
                const newMatch = await createMatchChallenge({
                    title: form.title,
                    format: form.format,
                    host_manager_id: user.id,
                    host_club_name: clubInfo.club_name,
                    district: form.district,
                    venue_id: form.venue_id || null,
                    venue_name_custom: form.venue_name_custom || 'Padang Pilihan',
                    match_date: form.match_date,
                    kickoff_time: form.kickoff_time,
                    total_pitch_cost: pitchCost,
                    referee_cost: refCost,
                    split_mode: '50_50',
                    host_share_cost: halfShare,
                    opponent_share_cost: halfShare,
                    status: 'open_challenge',
                    preferred_opponent_level: form.preferred_opponent_level,
                    rules_notes: form.rules_notes,
                });
                setMatches((prev) => [newMatch, ...prev]);
            } else {
                const mock = {
                    id: 'mock-' + Date.now(),
                    ...form,
                    host_manager_id: user?.id || 'demo-user',
                    host_club_name: clubInfo.club_name,
                    host_share_cost: halfShare,
                    opponent_share_cost: halfShare,
                    status: 'open_challenge',
                    total_pitch_cost: pitchCost,
                    referee_cost: refCost,
                };
                setMatches((prev) => [mock, ...prev]);
            }
            setShowCreateModal(false);
        } catch (err) {
            alert('Gagal menyiarkan cabaran sparring: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAcceptChallenge = async (match) => {
        if (!confirm(`Sahkan perlawanan menentang ${match.host_club_name}? Kos padang 50/50 bagi kelab anda adalah RM ${match.opponent_share_cost}.`)) {
            return;
        }

        try {
            if (user?.id && isSupabaseConfigured) {
                await acceptMatchChallenge(match.id, {
                    opponent_manager_id: user.id,
                    opponent_club_name: clubInfo.club_name,
                });
            }
            // Update local state
            setMatches((prev) =>
                prev.map((m) =>
                    m.id === match.id
                        ? { ...m, opponent_club_name: clubInfo.club_name, status: 'matched' }
                        : m
                )
            );
            alert(`Tahniah! Cabaran perlawanan telah dipadankan dengan ${match.host_club_name}.`);
        } catch (err) {
            alert('Ralat semasa menerima cabaran: ' + err.message);
        }
    };

    // Calculate auto split summary for form modal
    const calcPitch = parseFloat(form.total_pitch_cost) || 0;
    const calcRef = parseFloat(form.referee_cost) || 0;
    const calcTotal = calcPitch + calcRef;
    const calcShare = (calcTotal / 2).toFixed(2);

    return (
        <div style={C.container}>
            {/* TOP HEADER */}
            <div style={C.topBar}>
                <div>
                    <h1 style={C.pageTitle}>Hab Pengurus Kelab & Cari Lawan</h1>
                    <p style={C.pageSubtitle}>
                        Papan Padanan Sparring Grassroots dengan Pengiraan Kos 50/50 Telus
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={C.primaryBtn}
                >
                    + Cipta Cabaran Cari Lawan
                </button>
            </div>

            {/* CLUB PROFILE & RECORD STRIP */}
            <div style={C.clubBanner}>
                <div style={C.clubMainInfo}>
                    <div style={C.clubLogo}>
                        {clubInfo.club_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h2 style={C.clubNameHeading}>{clubInfo.club_name}</h2>
                            <span style={C.clubDistrictPill}>{clubInfo.district}</span>
                        </div>
                        <p style={C.clubManagerText}>
                            Pengurus: <strong>{clubInfo.manager_name}</strong> • Status: Pasukan Aktif
                        </p>
                    </div>
                </div>

                <div style={C.clubStatsGroup}>
                    <div style={C.clubStatBox}>
                        <span style={C.clubStatNum}>{clubInfo.matches_played}</span>
                        <span style={C.clubStatLabel}>Perlawanan</span>
                    </div>
                    <div style={C.clubStatBox}>
                        <span style={{ ...C.clubStatNum, color: '#34c759' }}>{clubInfo.won}</span>
                        <span style={C.clubStatLabel}>Menang</span>
                    </div>
                    <div style={C.clubStatBox}>
                        <span style={{ ...C.clubStatNum, color: '#ffb300' }}>{clubInfo.drawn}</span>
                        <span style={C.clubStatLabel}>Seri</span>
                    </div>
                    <div style={C.clubStatBox}>
                        <span style={{ ...C.clubStatNum, color: '#ff6b6b' }}>{clubInfo.lost}</span>
                        <span style={C.clubStatLabel}>Kalah</span>
                    </div>
                </div>
            </div>

            {/* FILTER BAR */}
            <div style={C.filterBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={C.filterLabel}>Tapis Mengikut Daerah:</span>
                    {['All', 'Shah Alam', 'Subang Jaya', 'Petaling Jaya', 'Klang'].map((dist) => (
                        <button
                            key={dist}
                            onClick={() => setFilterDistrict(dist)}
                            style={{
                                ...C.filterChip,
                                ...(filterDistrict === dist ? C.filterChipActive : {})
                            }}
                        >
                            {dist === 'All' ? 'Semua Daerah' : dist}
                        </button>
                    ))}
                </div>
            </div>

            {/* SPARRING MATCH CHALLENGES GRID */}
            <div style={C.sectionHeader}>
                <h2 style={C.sectionTitle}>Papan Cabaran Terbuka (Cari Lawan)</h2>
                <span style={C.countBadge}>{matches.filter(m => m.status === 'open_challenge').length} Cabaran Tersedia</span>
            </div>

            <div style={C.matchGrid}>
                {matches.map((match) => {
                    const isMyClubHost = match.host_club_name === clubInfo.club_name;
                    const isOpen = match.status === 'open_challenge';
                    const isMatched = match.status === 'matched';

                    return (
                        <div key={match.id} style={C.matchCard}>
                            {/* Card Top: Match Type & Format */}
                            <div style={C.matchCardTop}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={C.formatBadge}>{match.format || '11v11'}</span>
                                    <span style={C.levelBadge}>{match.preferred_opponent_level || 'Social'}</span>
                                </div>
                                <span style={{
                                    ...C.statusBadge,
                                    ...(isOpen ? C.statusBadgeOpen : C.statusBadgeMatched)
                                }}>
                                    {isOpen ? 'MENUNGGU LAWAN' : 'DIPADANKAN'}
                                </span>
                            </div>

                            {/* Versus Section */}
                            <div style={C.versusWrap}>
                                <div style={C.teamCol}>
                                    <div style={C.teamAvatarHost}>
                                        {match.host_club_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div style={C.teamTitle}>{match.host_club_name}</div>
                                    <span style={C.teamRole}>TUAN RUMAH</span>
                                </div>

                                <div style={C.vsCircle}>VS</div>

                                <div style={C.teamCol}>
                                    {match.opponent_club_name ? (
                                        <>
                                            <div style={C.teamAvatarOpponent}>
                                                {match.opponent_club_name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div style={C.teamTitle}>{match.opponent_club_name}</div>
                                            <span style={C.teamRole}>PELAWAT</span>
                                        </>
                                    ) : (
                                        <>
                                            <div style={C.teamAvatarEmpty}>?</div>
                                            <div style={{ ...C.teamTitle, color: 'rgba(255,255,255,0.35)' }}>
                                                Mencari Lawan...
                                            </div>
                                            <span style={C.teamRole}>SLOT TERBUKA</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Match Logistics */}
                            <div style={C.logisticsBox}>
                                <div style={C.logisticsRow}>
                                    <span>🗓️ Tarikh:</span>
                                    <strong>{match.match_date} ({match.kickoff_time})</strong>
                                </div>
                                <div style={C.logisticsRow}>
                                    <span>📍 Padang:</span>
                                    <strong>{match.venue_name_custom || 'Venue'} ({match.district})</strong>
                                </div>
                            </div>

                            {/* 50/50 COST SPLIT BREAKDOWN */}
                            <div style={C.costSplitBox}>
                                <div style={C.costSplitTitle}>
                                    <span>MODEL KOS 50/50 NUVRA</span>
                                    <span style={{ color: '#00D4EC', fontWeight: 800 }}>
                                        RM {match.total_pitch_cost + (match.referee_cost || 0)} Jumlah
                                    </span>
                                </div>
                                <div style={C.costSplitGrid}>
                                    <div style={C.costSplitItem}>
                                        <span>Bahagian Tuan Rumah:</span>
                                        <strong>RM {match.host_share_cost}</strong>
                                    </div>
                                    <div style={C.costSplitItem}>
                                        <span>Bahagian Lawan:</span>
                                        <strong style={{ color: '#00D4EC' }}>RM {match.opponent_share_cost}</strong>
                                    </div>
                                </div>
                            </div>

                            {match.rules_notes && (
                                <p style={C.notesText}>
                                    💬 <em>"{match.rules_notes}"</em>
                                </p>
                            )}

                            {/* Action Button */}
                            <div style={C.cardActions}>
                                {isOpen && !isMyClubHost && (
                                    <button
                                        onClick={() => handleAcceptChallenge(match)}
                                        style={C.acceptBtn}
                                    >
                                        Terima Cabaran (Bayar RM {match.opponent_share_cost})
                                    </button>
                                )}
                                {isOpen && isMyClubHost && (
                                    <div style={C.myHostNotice}>
                                        Kelab Anda Sedang Menunggu Pasukan Lawan Menerima Cabaran Ini
                                    </div>
                                )}
                                {isMatched && (
                                    <div style={C.matchedNotice}>
                                        ✓ Perlawanan ini telah dipadankan dan disahkan.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL: CIPTA CABARAN SPARRING BARU */}
            {showCreateModal && (
                <div style={C.modalOverlay}>
                    <div style={C.modalCard}>
                        <div style={C.modalHeader}>
                            <h3 style={C.modalTitle}>Cipta Cabaran Cari Lawan (Sparring 50/50)</h3>
                            <button onClick={() => setShowCreateModal(false)} style={C.closeBtn}>✕</button>
                        </div>
                        <form onSubmit={handleCreateChallenge} style={C.modalForm}>
                            <div style={C.formGroup}>
                                <label style={C.label}>Tajuk Cabaran Perlawanan</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    style={C.input}
                                    required
                                />
                            </div>

                            <div style={C.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={C.label}>Format Perlawanan</label>
                                    <select
                                        value={form.format}
                                        onChange={(e) => setForm({ ...form, format: e.target.value })}
                                        style={C.input}
                                    >
                                        <option value="11v11">11v11 Penuh (Padang Besar)</option>
                                        <option value="9v9">9v9 Mini Football</option>
                                        <option value="7v7">7v7 Arena Sintetik</option>
                                        <option value="5v5">5v5 Futsal Court</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={C.label}>Tahap Lawan Dicari</label>
                                    <select
                                        value={form.preferred_opponent_level}
                                        onChange={(e) => setForm({ ...form, preferred_opponent_level: e.target.value })}
                                        style={C.input}
                                    >
                                        <option value="Social / Casual">Social / Santai</option>
                                        <option value="Semi-Pro">Semi-Pro / Liga Terbuka</option>
                                        <option value="Veteran 35+">Veteran 35+ Tahun</option>
                                        <option value="Under 18">Bawah 18 Tahun</option>
                                    </select>
                                </div>
                            </div>

                            <div style={C.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={C.label}>Tarikh Perlawanan</label>
                                    <input
                                        type="date"
                                        value={form.match_date}
                                        onChange={(e) => setForm({ ...form, match_date: e.target.value })}
                                        style={C.input}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={C.label}>Masa Sepak Mula</label>
                                    <input
                                        type="time"
                                        value={form.kickoff_time}
                                        onChange={(e) => setForm({ ...form, kickoff_time: e.target.value })}
                                        style={C.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={C.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={C.label}>Daerah</label>
                                    <input
                                        type="text"
                                        value={form.district}
                                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                                        style={C.input}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1.5 }}>
                                    <label style={C.label}>Nama Padang / Kompleks Sukan</label>
                                    <input
                                        type="text"
                                        placeholder="cth: Arena MBSJ Subang Jaya"
                                        value={form.venue_name_custom}
                                        onChange={(e) => setForm({ ...form, venue_name_custom: e.target.value })}
                                        style={C.input}
                                        required
                                    />
                                </div>
                            </div>

                            {/* COST CALCULATION SECTION */}
                            <div style={C.calcBox}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#00D4EC', marginBottom: 10 }}>
                                    PENGIRAAN KOS PADANG & PENGADIL (50/50 SPLIT)
                                </div>
                                <div style={C.formRow}>
                                    <div style={{ flex: 1 }}>
                                        <label style={C.label}>Sewa Padang (RM)</label>
                                        <input
                                            type="number"
                                            value={form.total_pitch_cost}
                                            onChange={(e) => setForm({ ...form, total_pitch_cost: e.target.value })}
                                            style={C.input}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={C.label}>Yuran Pengadil (RM)</label>
                                        <input
                                            type="number"
                                            value={form.referee_cost}
                                            onChange={(e) => setForm({ ...form, referee_cost: e.target.value })}
                                            style={C.input}
                                        />
                                    </div>
                                </div>
                                <div style={C.calcResultBar}>
                                    <span>Setiap Pasukan Membayar:</span>
                                    <strong style={{ color: '#00D4EC', fontSize: 16 }}>RM {calcShare}</strong>
                                </div>
                            </div>

                            <div style={C.formGroup}>
                                <label style={C.label}>Nota Khas / Peraturan / Warna Jersi</label>
                                <textarea
                                    rows="2"
                                    value={form.rules_notes}
                                    onChange={(e) => setForm({ ...form, rules_notes: e.target.value })}
                                    style={{ ...C.input, resize: 'vertical' }}
                                />
                            </div>

                            <div style={C.modalActions}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={C.cancelBtn}>Batal</button>
                                <button type="submit" disabled={saving} style={C.primaryBtn}>
                                    {saving ? 'Menyiarkan...' : 'Siarkan Cabaran (Open Challenge)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const C = {
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
    clubBanner: {
        background: 'linear-gradient(135deg, #131322 0%, #0d0d18 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 24,
    },
    clubMainInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 18,
    },
    clubLogo: {
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #00D4EC, #D040EF)',
        color: '#080810',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 26,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clubNameHeading: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 26,
        fontWeight: 900,
        color: '#fff',
        letterSpacing: 0.5,
    },
    clubDistrictPill: {
        background: 'rgba(0, 212, 236, 0.12)',
        color: '#00D4EC',
        border: '1px solid rgba(0, 212, 236, 0.25)',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
    },
    clubManagerText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
    },
    clubStatsGroup: {
        display: 'flex',
        gap: 14,
    },
    clubStatBox: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: '10px 16px',
        textAlign: 'center',
        minWidth: 70,
    },
    clubStatNum: {
        display: 'block',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24,
        fontWeight: 900,
        color: '#fff',
    },
    clubStatLabel: {
        display: 'block',
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
    },
    filterBar: {
        display: 'flex',
        alignItems: 'center',
        background: '#11121d',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '12px 18px',
        overflowX: 'auto',
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginRight: 6,
    },
    filterChip: {
        background: 'none',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.6)',
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    filterChipActive: {
        background: '#00D4EC',
        color: '#080810',
        borderColor: '#00D4EC',
        fontWeight: 800,
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: 0.5,
    },
    countBadge: {
        background: 'rgba(0,212,236,0.15)',
        color: '#00D4EC',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 700,
    },
    matchGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
        gap: 20,
    },
    matchCard: {
        background: '#11121e',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    matchCardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    formatBadge: {
        background: 'rgba(255,255,255,0.08)',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 800,
    },
    levelBadge: {
        background: 'rgba(208, 64, 239, 0.15)',
        color: '#D040EF',
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.5,
    },
    statusBadgeOpen: {
        background: 'rgba(0, 212, 236, 0.15)',
        color: '#00D4EC',
        border: '1px solid rgba(0, 212, 236, 0.3)',
    },
    statusBadgeMatched: {
        background: 'rgba(52, 199, 89, 0.15)',
        color: '#34c759',
        border: '1px solid rgba(52, 199, 89, 0.3)',
    },
    versusWrap: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: '14px 18px',
    },
    teamCol: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 4,
    },
    teamAvatarHost: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: '#00D4EC',
        color: '#080810',
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
    },
    teamAvatarOpponent: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: '#D040EF',
        color: '#fff',
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
    },
    teamAvatarEmpty: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.05)',
        border: '1px dashed rgba(255,255,255,0.2)',
        color: 'rgba(255,255,255,0.3)',
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
    },
    teamTitle: {
        fontSize: 13,
        fontWeight: 700,
        color: '#fff',
        marginTop: 4,
    },
    teamRole: {
        fontSize: 9,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 0.5,
    },
    vsCircle: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logisticsBox: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: 'rgba(0,0,0,0.2)',
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: 12,
    },
    logisticsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        color: 'rgba(255,255,255,0.7)',
    },
    costSplitBox: {
        background: 'rgba(0, 212, 236, 0.05)',
        border: '1px solid rgba(0, 212, 236, 0.15)',
        borderRadius: 10,
        padding: '10px 14px',
    },
    costSplitTitle: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 8,
    },
    costSplitGrid: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
    },
    costSplitItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    notesText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        margin: 0,
        lineHeight: 1.4,
    },
    cardActions: {
        marginTop: 'auto',
    },
    acceptBtn: {
        width: '100%',
        background: 'linear-gradient(135deg, #00D4EC, #0088CC)',
        color: '#080810',
        padding: '12px',
        borderRadius: 8,
        border: 'none',
        fontSize: 13,
        fontWeight: 800,
        cursor: 'pointer',
    },
    myHostNotice: {
        background: 'rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        textAlign: 'center',
        padding: '10px',
        borderRadius: 8,
        fontWeight: 600,
    },
    matchedNotice: {
        background: 'rgba(52, 199, 89, 0.1)',
        color: '#34c759',
        fontSize: 12,
        textAlign: 'center',
        padding: '10px',
        borderRadius: 8,
        fontWeight: 700,
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
        maxWidth: 540,
        padding: 24,
        boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
        maxHeight: '90vh',
        overflowY: 'auto',
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
        gap: 14,
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
    calcBox: {
        background: 'rgba(0, 212, 236, 0.05)',
        border: '1px solid rgba(0, 212, 236, 0.15)',
        borderRadius: 10,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    calcResultBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(0, 212, 236, 0.15)',
        paddingTop: 10,
        fontSize: 13,
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
