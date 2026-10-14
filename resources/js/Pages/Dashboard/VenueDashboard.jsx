import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Contexts/AuthContext';
import {
    fetchVenues,
    fetchVenueSlots,
    createVenueSlot,
    isSupabaseConfigured
} from '../../lib/supabase';

export default function VenueDashboard() {
    const { user, profile } = useAuth();

    // Default Venue Profile
    const [venue, setVenue] = useState({
        id: 'v-1',
        name: 'Arena Sukan MBSJ Subang Jaya',
        district: 'Subang Jaya',
        state: 'Selangor',
        address: 'Persiaran Kewajipan, USJ 5, 47600 Subang Jaya',
        pitch_type: 'Artificial Turf 11v11',
        pricing_per_hour: 160,
        contact_phone: '+60 12-345 6789',
        facilities: ['Floodlights (Lampu Limpah)', 'Bilik Persalinan & Pancuran', 'Surau', 'Parkir Percuma', 'Grandstand Penonton'],
    });

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddSlotModal, setShowAddSlotModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form to create a new slot
    const [slotForm, setSlotForm] = useState({
        slot_date: new Date().toISOString().split('T')[0],
        start_time: '20:00',
        end_time: '22:00',
        price: '320',
        notes: 'Termasuk lampu limpah',
    });

    useEffect(() => {
        loadSlots();
    }, [selectedDate]);

    const loadSlots = async () => {
        setLoading(true);
        if (isSupabaseConfigured && venue?.id) {
            try {
                const data = await fetchVenueSlots(venue.id, selectedDate);
                setSlots(data || []);
            } catch (err) {
                console.warn('Gagal memuat slot:', err);
            }
        } else {
            // Mock slots for demo
            setSlots([
                {
                    id: 's-1',
                    slot_date: selectedDate,
                    start_time: '18:00',
                    end_time: '20:00',
                    price: 280,
                    status: 'available',
                    booking_reference: null,
                    notes: 'Slot petang / lampu mula menyala 19:15',
                },
                {
                    id: 's-2',
                    slot_date: selectedDate,
                    start_time: '20:00',
                    end_time: '22:00',
                    price: 320,
                    status: 'booked',
                    booking_reference: 'Subang Rovers vs Petaling Tigers (Sparring 50/50)',
                    notes: 'Ditempah melalui NUVRA Match Hub',
                },
                {
                    id: 's-3',
                    slot_date: selectedDate,
                    start_time: '22:00',
                    end_time: '00:00',
                    price: 320,
                    status: 'available',
                    booking_reference: null,
                    notes: 'Slot lewat malam',
                },
                {
                    id: 's-4',
                    slot_date: selectedDate,
                    start_time: '08:00',
                    end_time: '10:00',
                    price: 200,
                    status: 'locked',
                    booking_reference: 'Penyelenggaraan Rumput Tiruan',
                    notes: 'Kerja-kerja semburan getah getah rumput',
                }
            ]);
        }
        setLoading(false);
    };

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isSupabaseConfigured && venue?.id) {
                const newSlot = await createVenueSlot({
                    venue_id: venue.id,
                    slot_date: slotForm.slot_date,
                    start_time: slotForm.start_time,
                    end_time: slotForm.end_time,
                    price: parseFloat(slotForm.price) || 0,
                    status: 'available',
                    notes: slotForm.notes,
                });
                setSlots((prev) => [...prev, newSlot]);
            } else {
                const mockSlot = {
                    id: 's-' + Date.now(),
                    ...slotForm,
                    price: parseFloat(slotForm.price) || 0,
                    status: 'available',
                };
                setSlots((prev) => [...prev, mockSlot]);
            }
            setShowAddSlotModal(false);
        } catch (err) {
            alert('Gagal menambah slot: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleSlotLock = (slotId) => {
        setSlots((prev) =>
            prev.map((s) => {
                if (s.id === slotId) {
                    const nextStatus = s.status === 'locked' ? 'available' : 'locked';
                    return { ...s, status: nextStatus };
                }
                return s;
            })
        );
    };

    // Metrics calculations
    const totalSlots = slots.length;
    const bookedSlots = slots.filter((s) => s.status === 'booked').length;
    const availableSlots = slots.filter((s) => s.status === 'available').length;
    const projectedRevenue = slots
        .filter((s) => s.status === 'booked')
        .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

    return (
        <div style={V.container}>
            {/* TOP HEADER */}
            <div style={V.topBar}>
                <div>
                    <h1 style={V.pageTitle}>Dashboard Pengusaha Padang</h1>
                    <p style={V.pageSubtitle}>
                        Pengurusan Slot Waktu, Kadar Sewa & Tempahan Perlawanan
                    </p>
                </div>
                <button
                    onClick={() => setShowAddSlotModal(true)}
                    style={V.primaryBtn}
                >
                    + Buka Slot Padang Baharu
                </button>
            </div>

            {/* VENUE FACILITY BANNER */}
            <div style={V.facilityCard}>
                <div style={V.facilityMain}>
                    <div style={V.pitchIconWrap}>
                        🏟️
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h2 style={V.facilityHeading}>{venue.name}</h2>
                            <span style={V.pitchTypeBadge}>{venue.pitch_type}</span>
                        </div>
                        <p style={V.facilityAddress}>📍 {venue.address}</p>
                        <div style={V.tagRow}>
                            {venue.facilities.map((fac, idx) => (
                                <span key={idx} style={V.facilityPill}>{fac}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={V.pricingBadge}>
                    <span style={V.pricingLabel}>Kadar Sewaan Asas</span>
                    <div style={V.pricingValue}>RM {venue.pricing_per_hour} <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>/ jam</span></div>
                    <span style={V.contactText}>📞 {venue.contact_phone}</span>
                </div>
            </div>

            {/* DAILY OPERATIONAL METRICS */}
            <div style={V.statsRow}>
                <div style={V.statCard}>
                    <span style={V.statNum}>{totalSlots}</span>
                    <span style={V.statLabel}>Jumlah Slot Hari Ini</span>
                </div>
                <div style={V.statCard}>
                    <span style={{ ...V.statNum, color: '#34c759' }}>{availableSlots}</span>
                    <span style={V.statLabel}>Slot Boleh Ditempah</span>
                </div>
                <div style={V.statCard}>
                    <span style={{ ...V.statNum, color: '#00D4EC' }}>{bookedSlots}</span>
                    <span style={V.statLabel}>Slot Telah Ditempah</span>
                </div>
                <div style={V.statCard}>
                    <span style={{ ...V.statNum, color: '#D040EF' }}>RM {projectedRevenue}</span>
                    <span style={V.statLabel}>Hasil Tempahan ({selectedDate})</span>
                </div>
            </div>

            {/* DATE SELECTOR & SLOTS TIMETABLE */}
            <div style={V.slotPanel}>
                <div style={V.slotPanelHeader}>
                    <div>
                        <h2 style={V.slotPanelTitle}>Jadual Waktu Slot Padang</h2>
                        <p style={V.slotPanelSubtitle}>
                            Urus status pembukaan slot untuk perlawanan sparring atau perlawanan sosial komuniti.
                        </p>
                    </div>

                    <div style={V.datePickerWrap}>
                        <span style={V.dateLabel}>Pilih Tarikh:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={V.dateInput}
                        />
                    </div>
                </div>

                {/* SLOTS GRID */}
                <div style={V.slotsGrid}>
                    {slots.map((slot) => {
                        const isAvailable = slot.status === 'available';
                        const isBooked = slot.status === 'booked';
                        const isLocked = slot.status === 'locked';

                        return (
                            <div key={slot.id} style={{
                                ...V.slotCard,
                                ...(isBooked ? V.slotCardBooked : {}),
                                ...(isLocked ? V.slotCardLocked : {}),
                            }}>
                                <div style={V.slotTimeHeader}>
                                    <div style={V.slotTimeText}>
                                        ⏰ {slot.start_time} - {slot.end_time}
                                    </div>
                                    <span style={{
                                        ...V.slotStatusPill,
                                        ...(isAvailable ? V.pillAvailable : {}),
                                        ...(isBooked ? V.pillBooked : {}),
                                        ...(isLocked ? V.pillLocked : {}),
                                    }}>
                                        {isAvailable && 'TERSEDIA'}
                                        {isBooked && 'DITEMPAH'}
                                        {isLocked && 'DITUTUP'}
                                    </span>
                                </div>

                                <div style={V.slotPriceWrap}>
                                    <span style={V.priceText}>RM {slot.price}</span>
                                    <span style={V.sessionText}>(Sesi 2 Jam)</span>
                                </div>

                                {isBooked && (
                                    <div style={V.bookedInfoBox}>
                                        <span style={V.bookedInfoLabel}>Perincian Tempahan:</span>
                                        <strong style={V.bookedInfoVal}>{slot.booking_reference}</strong>
                                    </div>
                                )}

                                {slot.notes && (
                                    <p style={V.slotNotes}>
                                        ℹ️ {slot.notes}
                                    </p>
                                )}

                                <div style={V.slotActionRow}>
                                    {!isBooked && (
                                        <button
                                            onClick={() => toggleSlotLock(slot.id)}
                                            style={isLocked ? V.unlockBtn : V.lockBtn}
                                        >
                                            {isLocked ? 'Buka Semula Slot' : 'Kunci Slot (Maintenance)'}
                                        </button>
                                    )}
                                    {isBooked && (
                                        <div style={V.bookedTag}>
                                            ✓ Telah Disahkan Oleh Pasukan
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL: TAMBAH SLOT BAHARU */}
            {showAddSlotModal && (
                <div style={V.modalOverlay}>
                    <div style={V.modalCard}>
                        <div style={V.modalHeader}>
                            <h3 style={V.modalTitle}>Buka Slot Waktu Padang Baharu</h3>
                            <button onClick={() => setShowAddSlotModal(false)} style={V.closeBtn}>✕</button>
                        </div>
                        <form onSubmit={handleCreateSlot} style={V.modalForm}>
                            <div style={V.formGroup}>
                                <label style={V.label}>Tarikh Slot</label>
                                <input
                                    type="date"
                                    value={slotForm.slot_date}
                                    onChange={(e) => setSlotForm({ ...slotForm, slot_date: e.target.value })}
                                    style={V.input}
                                    required
                                />
                            </div>

                            <div style={V.formRow}>
                                <div style={{ flex: 1 }}>
                                    <label style={V.label}>Waktu Mula</label>
                                    <input
                                        type="time"
                                        value={slotForm.start_time}
                                        onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                                        style={V.input}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={V.label}>Waktu Tamat</label>
                                    <input
                                        type="time"
                                        value={slotForm.end_time}
                                        onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                                        style={V.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={V.formGroup}>
                                <label style={V.label}>Kadar Harga Slot (RM)</label>
                                <input
                                    type="number"
                                    value={slotForm.price}
                                    onChange={(e) => setSlotForm({ ...slotForm, price: e.target.value })}
                                    style={V.input}
                                    required
                                />
                            </div>

                            <div style={V.formGroup}>
                                <label style={V.label}>Catatan Tambahan</label>
                                <input
                                    type="text"
                                    placeholder="cth: Termasuk kemudahan lampu limpah stadium"
                                    value={slotForm.notes}
                                    onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                                    style={V.input}
                                />
                            </div>

                            <div style={V.modalActions}>
                                <button type="button" onClick={() => setShowAddSlotModal(false)} style={V.cancelBtn}>Batal</button>
                                <button type="submit" disabled={saving} style={V.primaryBtn}>
                                    {saving ? 'Menyimpan...' : 'Buka Slot Sekarang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const V = {
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
    facilityCard: {
        background: 'linear-gradient(135deg, #131322 0%, #0d0d17 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
    },
    facilityMain: {
        display: 'flex',
        alignItems: 'center',
        gap: 20,
    },
    pitchIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 14,
        background: 'rgba(0, 212, 236, 0.1)',
        border: '1px solid rgba(0, 212, 236, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
    },
    facilityHeading: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 26,
        fontWeight: 900,
        color: '#fff',
        letterSpacing: 0.5,
    },
    pitchTypeBadge: {
        background: 'rgba(52, 199, 89, 0.15)',
        color: '#34c759',
        fontSize: 11,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 4,
    },
    facilityAddress: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        margin: '4px 0 10px',
    },
    tagRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
    },
    facilityPill: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
    },
    pricingBadge: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '16px 20px',
        textAlign: 'right',
    },
    pricingLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 700,
        textTransform: 'uppercase',
    },
    pricingValue: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 28,
        fontWeight: 900,
        color: '#00D4EC',
        margin: '4px 0',
    },
    contactText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
    },
    statCard: {
        background: '#11121d',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    statNum: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 32,
        fontWeight: 900,
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.45)',
        fontWeight: 600,
    },
    slotPanel: {
        background: '#11121e',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    slotPanelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 16,
    },
    slotPanelTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        color: '#fff',
    },
    slotPanelSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 4,
    },
    datePickerWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.5)',
    },
    dateInput: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: 'inherit',
    },
    slotsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
    },
    slotCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(0, 212, 236, 0.3)',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    slotCardBooked: {
        borderColor: 'rgba(208, 64, 239, 0.4)',
        background: 'rgba(208, 64, 239, 0.04)',
    },
    slotCardLocked: {
        borderColor: 'rgba(255,255,255,0.1)',
        opacity: 0.6,
    },
    slotTimeHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    slotTimeText: {
        fontSize: 14,
        fontWeight: 800,
        color: '#fff',
    },
    slotStatusPill: {
        fontSize: 10,
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: 4,
        letterSpacing: 0.5,
    },
    pillAvailable: {
        background: 'rgba(0, 212, 236, 0.15)',
        color: '#00D4EC',
    },
    pillBooked: {
        background: 'rgba(208, 64, 239, 0.2)',
        color: '#D040EF',
    },
    pillLocked: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'rgba(255,255,255,0.5)',
    },
    slotPriceWrap: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
    },
    priceText: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 26,
        fontWeight: 900,
        color: '#00D4EC',
    },
    sessionText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
    },
    bookedInfoBox: {
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 11,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    bookedInfoLabel: {
        color: 'rgba(255,255,255,0.4)',
    },
    bookedInfoVal: {
        color: '#fff',
    },
    slotNotes: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        margin: 0,
    },
    slotActionRow: {
        marginTop: 'auto',
    },
    lockBtn: {
        width: '100%',
        background: 'none',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.7)',
        padding: '8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
    },
    unlockBtn: {
        width: '100%',
        background: 'rgba(52, 199, 89, 0.15)',
        border: '1px solid rgba(52, 199, 89, 0.3)',
        color: '#34c759',
        padding: '8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
    },
    bookedTag: {
        textAlign: 'center',
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 600,
        padding: 6,
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
        maxWidth: 480,
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
