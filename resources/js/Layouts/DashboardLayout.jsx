import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const navTabs = [
        {
            path: '/dashboard/player',
            label: 'Pemain',
            badge: 'Player Card',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
            )
        },
        {
            path: '/dashboard/club',
            label: 'Kelab & Sparring',
            badge: 'Cari Lawan 50/50',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            )
        },
        {
            path: '/dashboard/venue',
            label: 'Pengusaha Padang',
            badge: 'Slot & Venues',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 12h18" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )
        }
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'Pengguna NUVRA';
    const userRole = profile?.role || 'player';
    const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=00D4EC&color=080810&bold=true`;

    return (
        <div style={S.root}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                .dash-nav-tab {
                    position: relative;
                    transition: all 0.2s ease;
                }
                .dash-nav-tab:hover {
                    color: #fff !important;
                    background: rgba(255,255,255,0.06) !important;
                }
                .dash-btn-action {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .dash-btn-action:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(0, 212, 236, 0.25);
                }
                @media (max-width: 768px) {
                    .dash-topbar-tabs { display: none !important; }
                    .dash-mobile-nav { display: flex !important; }
                    .dash-main-container { padding-bottom: 84px !important; }
                }
            `}</style>

            {/* HEADER / TOPBAR */}
            <header style={S.topbar}>
                <div style={S.topbarInner}>
                    {/* Logo & Platform Info */}
                    <div style={S.brandWrap} onClick={() => navigate('/dashboard/player')}>
                        <img
                            src="/images/logoImage/NUVRA_LOGO.webp"
                            alt="NUVRA"
                            style={{ height: 32, cursor: 'pointer' }}
                        />
                        <span style={S.badgeVersion}>2.0 CORE</span>
                    </div>

                    {/* Navigation Tabs (Desktop) */}
                    <nav className="dash-topbar-tabs" style={S.tabsNav}>
                        {navTabs.map((tab) => {
                            const isActive = location.pathname.startsWith(tab.path);
                            return (
                                <Link
                                    key={tab.path}
                                    to={tab.path}
                                    className="dash-nav-tab"
                                    style={{
                                        ...S.tabItem,
                                        ...(isActive ? S.tabItemActive : {})
                                    }}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    {isActive && <div style={S.activeIndicator} />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right User Actions */}
                    <div style={S.rightActions}>
                        {/* Quick link to Tournaments / Public */}
                        <button
                            onClick={() => navigate('/community/feed')}
                            style={S.communityBtn}
                            title="Ke Komuniti Awam & Kejohanan"
                        >
                            Komuniti
                        </button>

                        {/* Supabase status badge */}
                        <div
                            style={{
                                ...S.statusPill,
                                ...(isSupabaseConfigured ? S.statusConnected : S.statusLocal)
                            }}
                            title={isSupabaseConfigured ? "Pangkalan Data Supabase Aktif" : "Mod Demo / Kunci Supabase Belum Lengkap"}
                        >
                            <span style={S.statusDot(isSupabaseConfigured)} />
                            <span>{isSupabaseConfigured ? 'Supabase Live' : 'Local Mode'}</span>
                        </div>

                        {/* Profile dropdown trigger */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                style={S.profileBtn}
                            >
                                <img
                                    src={avatarUrl}
                                    alt={userDisplayName}
                                    style={S.avatar}
                                />
                                <span style={S.profileName}>{userDisplayName}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <div style={S.dropdownMenu}>
                                    <div style={S.dropdownHeader}>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{userDisplayName}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user?.email || 'NUVRA Community Member'}</div>
                                        <span style={S.rolePill}>{userRole.toUpperCase()}</span>
                                    </div>
                                    <div style={S.dropdownDivider} />
                                    <button
                                        style={S.dropdownItem}
                                        onClick={() => { setShowProfileMenu(false); navigate('/dashboard/player'); }}
                                    >
                                        Profil & Kad FIFA Saya
                                    </button>
                                    <button
                                        style={S.dropdownItem}
                                        onClick={() => { setShowProfileMenu(false); navigate('/dashboard/club'); }}
                                    >
                                        Hab Pengurus Kelab
                                    </button>
                                    <button
                                        style={S.dropdownItem}
                                        onClick={() => { setShowProfileMenu(false); navigate('/dashboard/venue'); }}
                                    >
                                        Urus Slot & Padang
                                    </button>
                                    <div style={S.dropdownDivider} />
                                    <button
                                        style={{ ...S.dropdownItem, color: '#ff6b6b' }}
                                        onClick={handleLogout}
                                    >
                                        Log Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT OUTLET */}
            <main className="dash-main-container" style={S.main}>
                <Outlet />
            </main>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <nav className="dash-mobile-nav" style={S.mobileNav}>
                {navTabs.map((tab) => {
                    const isActive = location.pathname.startsWith(tab.path);
                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            style={{
                                ...S.mobileNavItem,
                                ...(isActive ? S.mobileNavItemActive : {})
                            }}
                        >
                            {tab.icon}
                            <span style={{ fontSize: 10, fontWeight: 700 }}>{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

const S = {
    root: {
        minHeight: '100vh',
        background: '#09090f',
        color: '#f3f4f6',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
    },
    topbar: {
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(13, 13, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    },
    topbarInner: {
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
    },
    brandWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
    },
    badgeVersion: {
        background: 'rgba(0, 212, 236, 0.12)',
        color: '#00D4EC',
        border: '1px solid rgba(0, 212, 236, 0.3)',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1,
        padding: '2px 8px',
        borderRadius: 20,
        fontFamily: "'Barlow Condensed', sans-serif",
    },
    tabsNav: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        padding: 4,
        borderRadius: 12,
    },
    tabItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 8,
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        position: 'relative',
    },
    tabItemActive: {
        color: '#fff',
        background: 'rgba(255, 255, 255, 0.08)',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 2,
        background: '#00D4EC',
        borderRadius: 2,
    },
    rightActions: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
    },
    communityBtn: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontWeight: 600,
        padding: '6px 12px',
        borderRadius: 8,
        cursor: 'pointer',
    },
    statusPill: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
    },
    statusConnected: {
        background: 'rgba(52, 199, 89, 0.12)',
        color: '#34c759',
        border: '1px solid rgba(52, 199, 89, 0.25)',
    },
    statusLocal: {
        background: 'rgba(255, 179, 0, 0.12)',
        color: '#ffb300',
        border: '1px solid rgba(255, 179, 0, 0.25)',
    },
    statusDot: (active) => ({
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: active ? '#34c759' : '#ffb300',
    }),
    profileBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 8,
        color: '#fff',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid rgba(0, 212, 236, 0.4)',
    },
    profileName: {
        fontSize: 13,
        fontWeight: 600,
        maxWidth: 120,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 230,
        background: '#131320',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        padding: 6,
        zIndex: 100,
    },
    dropdownHeader: {
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    rolePill: {
        alignSelf: 'flex-start',
        background: 'rgba(0, 212, 236, 0.15)',
        color: '#00D4EC',
        fontSize: 9,
        fontWeight: 800,
        padding: '2px 6px',
        borderRadius: 4,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    dropdownDivider: {
        height: 1,
        background: 'rgba(255, 255, 255, 0.07)',
        margin: '4px 0',
    },
    dropdownItem: {
        width: '100%',
        padding: '10px 14px',
        background: 'none',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: 8,
        transition: 'background 0.15s ease',
    },
    main: {
        flex: 1,
        maxWidth: 1400,
        width: '100%',
        margin: '0 auto',
        padding: '24px 24px 60px',
    },
    mobileNav: {
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(13, 13, 23, 0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '8px 16px',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    mobileNavItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        color: 'rgba(255, 255, 255, 0.45)',
        textDecoration: 'none',
        padding: 6,
    },
    mobileNavItemActive: {
        color: '#00D4EC',
    },
};
