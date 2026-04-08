import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "../Components/PageLoader";

// ── Count-up hook ──────────────────────────────────────────────────────────────
function useCountUp(target, duration = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                let start = 0;
                const step = target / (duration / 16);
                const timer = setInterval(() => {
                    start += step;
                    if (start >= target) { setCount(target); clearInterval(timer); }
                    else setCount(Math.floor(start));
                }, 16);
                observer.disconnect();
            }
        }, { threshold: 0.4 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);
    return { count, ref };
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ value, suffix = "", label }) {
    const { count, ref } = useCountUp(value);
    return (
        <div ref={ref} style={S.statCard}>
            <span style={S.statNumber}>{count.toLocaleString()}{suffix}</span>
            <span style={S.statLabel}>{label}</span>
        </div>
    );
}

// ── Feature row ────────────────────────────────────────────────────────────────
function FeatureItem({ text }) {
    return (
        <div style={S.featureItem}>
            <span style={S.featureDot} />
            <span>{text}</span>
        </div>
    );
}

// ── SVG icons ──────────────────────────────────────────────────────────────────
const IconArrowRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
    </svg>
);
const IconArrowDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
    </svg>
);

// ── Portal ─────────────────────────────────────────────────────────────────────
export default function NuvraPortal() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div style={S.root}>
            <PageLoader />
            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 2px; }

                .portal-nav-link:hover { color: #F5F5F7 !important; }
                .portal-footer-link:hover { color: #F5F5F7 !important; }

                .portal-card-community:hover { border-color: #00D4EC !important; }
                .portal-card-club:hover { border-color: rgba(245,245,247,0.3) !important; }

                .portal-step:hover { border-color: #2a2a30 !important; background: #1a1a1f !important; }

                .btn-primary:hover { background: #33DDFF !important; transform: translateY(-1px); }
                .btn-secondary:hover { background: rgba(245,245,247,0.06) !important; transform: translateY(-1px); }
                .btn-card-community:hover { background: #00D4EC !important; color: #0d0d10 !important; }
                .btn-card-club:hover { background: rgba(208,64,239,0.12) !important; }

                @keyframes bounce-down {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(5px); }
                }
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.4); }
                }

                @media (max-width: 768px) {
                    .portal-two-col { grid-template-columns: 1fr !important; gap: 40px !important; }
                    .portal-nav-links { display: none !important; }
                    .portal-stats-inner { flex-wrap: wrap !important; }
                    .portal-steps-grid { grid-template-columns: 1fr !important; }
                    .portal-cards-wrapper { grid-template-columns: 1fr !important; }
                    .portal-nav { padding: 14px 24px !important; }
                }
            `}</style>

            {/* ── NAV ── */}
            <nav style={{ ...S.nav, ...(scrolled ? S.navScrolled : {}) }}>
                <div style={S.navLogo} onClick={() => navigate("/")}>
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="Nuvra" style={{ height: 32 }} />
                    <span style={S.navBrand}>NUVRA</span>
                </div>
                <div className="portal-nav-links" style={S.navLinks}>
                    <button className="portal-nav-link" style={S.navLink}
                        onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                        How It Works
                    </button>
                    <button className="portal-nav-link" style={S.navLink}
                        onClick={() => document.getElementById("community-section")?.scrollIntoView({ behavior: "smooth" })}>
                        Community
                    </button>
                    <button className="portal-nav-link" style={S.navLink}
                        onClick={() => document.getElementById("club-section")?.scrollIntoView({ behavior: "smooth" })}>
                        Nuvra Club
                    </button>
                    <button
                        className="btn-primary"
                        style={S.navCta}
                        onClick={() => navigate("/community")}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section style={S.hero}>
                {/* Live badge */}
                <div style={S.heroBadge}>
                    <span style={S.heroBadgeDot} />
                    <span>Now Live — Football for Every Level</span>
                </div>

                {/* Title */}
                <h1 style={S.heroTitle}>
                    THE FOOTBALL<br />
                    <span style={{ color: "#00D4EC" }}>ECOSYSTEM</span>
                </h1>

                <p style={S.heroTagline}>
                    Whether you're a casual player looking for a game tonight, or a coach managing a full squad — Nuvra has a place for you.
                </p>

                {/* Portal cards */}
                <div className="portal-cards-wrapper" style={S.cardsWrapper}>

                    {/* Community Card */}
                    <div
                        className="portal-card-community"
                        style={S.card}
                        onClick={() => navigate("/community")}
                    >
                        <div style={{ ...S.cardAccentBar, background: "#00D4EC" }} />
                        <h2 style={{ ...S.cardTitle, color: "#00D4EC" }}>NUVRA COMMUNITY</h2>
                        <p style={S.cardSubtitle}>
                            No club? No problem. Find pickup games near you, pick your team, and book your slot.
                        </p>
                        <div style={S.cardFeatures}>
                            {["Browse open pickup games", "Join Team A or Team B", "Real-time slot availability", "Community announcements"].map(f => (
                                <div key={f} style={S.cardFeatureRow}>
                                    <span style={{ ...S.cardFeatureDot, background: "#00D4EC" }} />{f}
                                </div>
                            ))}
                        </div>
                        <button className="btn-card-community" style={{ ...S.cardBtn, color: "#00D4EC", borderColor: "rgba(0,212,236,0.3)" }}>
                            JOIN THE COMMUNITY <IconArrowRight />
                        </button>
                    </div>

                    {/* Club Card */}
                    <div
                        className="portal-card-club"
                        style={S.card}
                        onClick={() => navigate("/login")}
                    >
                        <div style={{ ...S.cardAccentBar, background: "#D040EF" }} />
                        <h2 style={{ ...S.cardTitle, color: "#D040EF" }}>NUVRA CLUB</h2>
                        <p style={S.cardSubtitle}>
                            The complete club management platform. Stats, squad, payments, and performance — all in one place.
                        </p>
                        <div style={S.cardFeatures}>
                            {["Player performance tracking", "Squad & jersey management", "Match stats & ratings", "Payment management"].map(f => (
                                <div key={f} style={S.cardFeatureRow}>
                                    <span style={{ ...S.cardFeatureDot, background: "#D040EF" }} />{f}
                                </div>
                            ))}
                        </div>
                        <button className="btn-card-club" style={{ ...S.cardBtn, color: "#D040EF", borderColor: "rgba(208,64,239,0.3)" }}>
                            ACCESS CLUB PORTAL <IconArrowRight />
                        </button>
                    </div>
                </div>

                {/* Scroll hint */}
                <div style={S.scrollHint}>
                    <span style={{ fontSize: 12, color: "#72727e" }}>Scroll to explore</span>
                    <span style={{ color: "#72727e", animation: "bounce-down 2s infinite" }}><IconArrowDown /></span>
                </div>
            </section>

            {/* ── STATS ── */}
            <section style={S.statsSection}>
                <div className="portal-stats-inner" style={S.statsInner}>
                    <StatCard value={500}  suffix="+" label="Community Players" />
                    <StatCard value={120}  suffix="+" label="Games Organised" />
                    <StatCard value={30}   suffix="+" label="Clubs on Platform" />
                    <StatCard value={2500} suffix="+" label="Stats Recorded" />
                </div>
            </section>

            {/* ── COMMUNITY SECTION ── */}
            <section id="community-section" style={S.section}>
                <div className="portal-two-col" style={S.twoCol}>
                    <div>
                        <span style={{ ...S.sectionTag, color: "#00D4EC", borderColor: "rgba(0,212,236,0.3)" }}>
                            COMMUNITY
                        </span>
                        <h2 style={S.sectionTitle}>Football without<br />the commitment</h2>
                        <p style={S.sectionDesc}>
                            Not everyone wants to join a club. Nuvra Community lets you show up, pick a side, and play. No contracts. No stats pressure. Just football.
                        </p>
                        <div>
                            <FeatureItem text="Games announced in advance with full details" />
                            <FeatureItem text="Live seat tracker — see exactly how many slots remain" />
                            <FeatureItem text="One-tap booking — in and out in under a minute" />
                            <FeatureItem text="Community announcements from organisers" />
                            <FeatureItem text="Email alerts when new games are posted" />
                        </div>
                    </div>

                    {/* Community Mock */}
                    <div style={S.mockCard}>
                        <div style={S.mockHeader}>
                            <span style={S.mockTitle}>UPCOMING GAMES</span>
                            <span style={{ ...S.mockBadge, color: "#00D4EC", borderColor: "rgba(0,212,236,0.3)" }}>3 OPEN</span>
                        </div>
                        {[
                            { title: "Team Alpha vs Team Beta", venue: "Cheras Futsal Arena", slots: 14, max: 20 },
                            { title: "The Reds vs The Blues",   venue: "Desa Park Turf",     slots: 7,  max: 20 },
                        ].map((g, i) => (
                            <div key={i} style={S.gameCard}>
                                <div style={S.gameVs}>{g.title}</div>
                                <div style={S.gameMeta}>
                                    <span>{g.venue}</span>
                                    <span>Tonight, 9PM</span>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <div style={S.slotLabel}>
                                        <span>Slots</span>
                                        <span style={{ color: g.slots < 5 ? "#EF4444" : "#00D4EC" }}>{g.slots}/{g.max} left</span>
                                    </div>
                                    <div style={S.slotTrack}>
                                        <div style={{ ...S.slotFill, width: `${(g.slots / g.max) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CLUB SECTION ── */}
            <section id="club-section" style={{ ...S.section, borderTop: "1px solid #222228" }}>
                <div className="portal-two-col" style={S.twoCol}>
                    {/* Club Mock */}
                    <div style={S.mockCard}>
                        <div style={S.mockHeader}>
                            <span style={S.mockTitle}>SQUAD ROSTER</span>
                            <span style={{ ...S.mockBadge, color: "#D040EF", borderColor: "rgba(208,64,239,0.3)" }}>ACTIVE</span>
                        </div>
                        {[
                            { name: "Haziq Amirul", pos: "Forward",    rating: "87", initial: "H" },
                            { name: "Danial Razif", pos: "Midfielder", rating: "82", initial: "D" },
                            { name: "Syafiq Nizam", pos: "Defender",   rating: "79", initial: "S" },
                        ].map((p, i) => (
                            <div key={i} style={S.playerRow}>
                                <div style={S.playerAvatar}>{p.initial}</div>
                                <div>
                                    <div style={S.playerName}>{p.name}</div>
                                    <div style={S.playerPos}>{p.pos}</div>
                                </div>
                                <span style={S.playerRating}>{p.rating}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <span style={{ ...S.sectionTag, color: "#D040EF", borderColor: "rgba(208,64,239,0.3)" }}>
                            NUVRA CLUB
                        </span>
                        <h2 style={S.sectionTitle}>The complete club<br />management system</h2>
                        <p style={S.sectionDesc}>
                            Built for coaches and club owners who need a single platform to track every player, manage every match, and run every payment.
                        </p>
                        <div>
                            <FeatureItem text="FIFA-style player cards with real attributes" />
                            <FeatureItem text="Match stats — goals, assists, ratings, cleansheets" />
                            <FeatureItem text="Integrated payments via Billplz" />
                            <FeatureItem text="Team announcements & scheduling" />
                            <FeatureItem text="Squad management & recruitment pipeline" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how-it-works" style={{ ...S.section, borderTop: "1px solid #222228", background: "#0f0f13" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 56 }}>
                        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                            How It Works
                        </h2>
                        <p style={{ color: "#72727e", marginTop: 10, fontSize: 15 }}>Simple paths, powerful outcomes</p>
                    </div>

                    {/* Community path */}
                    <div style={{ marginBottom: 56 }}>
                        <div style={S.pathLabel}>
                            <span style={{ ...S.pathDot, background: "#00D4EC" }} />
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 2, color: "#00D4EC", textTransform: "uppercase" }}>
                                Community Path
                            </span>
                        </div>
                        <div className="portal-steps-grid" style={S.stepsGrid}>
                            {[
                                { num: "01", title: "Sign Up Free",    desc: "Create your community account in under a minute. No club needed." },
                                { num: "02", title: "Browse Games",    desc: "See all upcoming pickup games — venue, time, teams, and slots remaining." },
                                { num: "03", title: "Book Your Slot",  desc: "Pick a side and confirm your spot. You'll get an email confirmation." },
                            ].map(s => (
                                <div key={s.num} className="portal-step" style={S.step}>
                                    <div style={{ ...S.stepNum, color: "#00D4EC" }}>{s.num}</div>
                                    <div style={S.stepTitle}>{s.title}</div>
                                    <div style={S.stepDesc}>{s.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Club path */}
                    <div>
                        <div style={S.pathLabel}>
                            <span style={{ ...S.pathDot, background: "#D040EF" }} />
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 2, color: "#D040EF", textTransform: "uppercase" }}>
                                Club Path
                            </span>
                        </div>
                        <div className="portal-steps-grid" style={S.stepsGrid}>
                            {[
                                { num: "01", title: "Coach Registers",      desc: "Coach creates the team and sets up the club on Nuvra Club." },
                                { num: "02", title: "Players Join",         desc: "Players apply to the club and get approved by the coach." },
                                { num: "03", title: "Manage Everything",    desc: "Track stats, schedule matches, post announcements, manage payments." },
                            ].map(s => (
                                <div key={s.num} className="portal-step" style={S.step}>
                                    <div style={{ ...S.stepNum, color: "#D040EF" }}>{s.num}</div>
                                    <div style={S.stepTitle}>{s.title}</div>
                                    <div style={S.stepDesc}>{s.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={S.ctaSection}>
                <h2 style={S.ctaTitle}>READY TO PLAY?</h2>
                <p style={S.ctaDesc}>Join Nuvra today — the football platform built for Malaysians.</p>
                <div style={S.ctaButtons}>
                    <button className="btn-primary" style={S.btnPrimary} onClick={() => navigate("/community")}>
                        JOIN COMMUNITY — IT'S FREE
                    </button>
                    <button className="btn-secondary" style={S.btnSecondary} onClick={() => navigate("/login")}>
                        CLUB PORTAL <IconArrowRight />
                    </button>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={S.footer}>
                <span style={S.footerBrand}>NUVRA SPORTS</span>
                <div style={{ display: "flex", gap: 24 }}>
                    <button className="portal-footer-link" style={S.footerLink} onClick={() => navigate("/community")}>Community</button>
                    <button className="portal-footer-link" style={S.footerLink} onClick={() => navigate("/login")}>Club Portal</button>
                </div>
                <span style={S.footerCopy}>© {new Date().getFullYear()} Nuvra Sports. All rights reserved.</span>
            </footer>
        </div>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
    root: {
        fontFamily: "'Inter', sans-serif",
        background: "#0d0d10",
        color: "#F5F5F7",
        minHeight: "100vh",
        overflowX: "hidden",
    },

    // Nav
    nav: {
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 48px",
        transition: "all 0.25s ease",
    },
    navScrolled: {
        background: "rgba(13,13,16,0.96)",
        borderBottom: "1px solid #222228",
        padding: "14px 48px",
    },
    navLogo: {
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer",
    },
    navBrand: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 26, fontWeight: 700, letterSpacing: 3,
        color: "#F5F5F7",
    },
    navLinks: {
        display: "flex", gap: 28, alignItems: "center",
    },
    navLink: {
        color: "#72727e", fontSize: 14, fontWeight: 500,
        background: "none", border: "none", cursor: "pointer",
        transition: "color 0.15s",
    },
    navCta: {
        padding: "8px 20px",
        background: "#00D4EC",
        color: "#0d0d10",
        border: "none",
        borderRadius: 4,
        fontSize: 13, fontWeight: 700,
        cursor: "pointer",
        transition: "background 0.15s, transform 0.15s",
        letterSpacing: 0.5,
    },

    // Hero
    hero: {
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "120px 24px 80px",
        position: "relative",
    },
    heroBadge: {
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#161619", border: "1px solid #2a2a30",
        borderRadius: 3, padding: "6px 14px",
        fontSize: 12, fontWeight: 600, color: "#72727e",
        marginBottom: 28, letterSpacing: 0.5,
    },
    heroBadgeDot: {
        width: 6, height: 6, borderRadius: "50%",
        background: "#00D4EC",
        display: "inline-block",
        animation: "pulse-dot 2s infinite",
    },
    heroTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(64px, 10vw, 136px)",
        fontWeight: 800,
        lineHeight: 0.92,
        letterSpacing: 4,
        textTransform: "uppercase",
        marginBottom: 24,
        color: "#F5F5F7",
    },
    heroTagline: {
        fontSize: "clamp(15px, 2vw, 18px)",
        color: "#72727e",
        maxWidth: 520, lineHeight: 1.7,
        margin: "0 auto 48px",
        fontWeight: 400,
    },

    // Portal cards
    cardsWrapper: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(280px, 320px))",
        gap: 16,
        justifyContent: "center",
        marginBottom: 40,
    },
    card: {
        background: "#161619",
        border: "1px solid #222228",
        borderRadius: 4,
        padding: "28px 28px 24px",
        textAlign: "left",
        cursor: "pointer",
        transition: "border-color 0.2s",
        position: "relative",
        overflow: "hidden",
    },
    cardAccentBar: {
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
    },
    cardTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22, fontWeight: 700,
        letterSpacing: 2,
        marginBottom: 10,
        marginTop: 12,
    },
    cardSubtitle: {
        fontSize: 13, color: "#72727e", lineHeight: 1.65, marginBottom: 20,
    },
    cardFeatures: {
        display: "flex", flexDirection: "column", gap: 8, marginBottom: 24,
    },
    cardFeatureRow: {
        display: "flex", alignItems: "center", gap: 10,
        fontSize: 13, color: "#b0b0be", fontWeight: 500,
    },
    cardFeatureDot: {
        width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
    },
    cardBtn: {
        width: "100%", padding: "11px 16px",
        background: "transparent", border: "1px solid",
        borderRadius: 4,
        fontSize: 12, fontWeight: 700, letterSpacing: 0.8,
        cursor: "pointer", transition: "background 0.2s, color 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    },

    // Scroll hint
    scrollHint: {
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    },

    // Stats
    statsSection: {
        borderTop: "1px solid #222228",
        borderBottom: "1px solid #222228",
        background: "#0f0f13",
        display: "flex", justifyContent: "center",
        padding: "64px 24px",
    },
    statsInner: {
        display: "flex", flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 900, width: "100%",
    },
    statCard: {
        flex: 1, minWidth: 160,
        textAlign: "center", padding: "16px 32px",
        borderRight: "1px solid #222228",
        display: "flex", flexDirection: "column", gap: 6,
    },
    statNumber: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 52, fontWeight: 700, lineHeight: 1,
        color: "#F5F5F7",
    },
    statLabel: {
        fontSize: 11, color: "#72727e", fontWeight: 500,
        textTransform: "uppercase", letterSpacing: 1.5,
    },

    // Section
    section: {
        padding: "88px 24px",
        maxWidth: 1100, margin: "0 auto",
    },
    twoCol: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 72, alignItems: "center",
    },
    sectionTag: {
        display: "inline-block",
        padding: "3px 10px",
        border: "1px solid",
        borderRadius: 3,
        fontSize: 10, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 2,
        marginBottom: 18,
        fontFamily: "'Barlow Condensed', sans-serif",
    },
    sectionTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(28px, 4vw, 44px)",
        fontWeight: 700, lineHeight: 1.1,
        letterSpacing: 1,
        marginBottom: 16,
        textTransform: "uppercase",
    },
    sectionDesc: {
        fontSize: 15, color: "#72727e",
        lineHeight: 1.75, maxWidth: 460, marginBottom: 32,
    },
    featureItem: {
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 0",
        borderBottom: "1px solid #1e1e23",
        fontSize: 14, fontWeight: 500, color: "#b0b0be",
    },
    featureDot: {
        width: 4, height: 4,
        background: "#00D4EC",
        borderRadius: "50%", flexShrink: 0,
    },

    // Mock card
    mockCard: {
        background: "#161619",
        border: "1px solid #222228",
        borderRadius: 4,
        padding: "24px",
    },
    mockHeader: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 18,
    },
    mockTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 13, fontWeight: 700,
        color: "#72727e", letterSpacing: 2, textTransform: "uppercase",
    },
    mockBadge: {
        padding: "3px 9px",
        border: "1px solid",
        borderRadius: 3,
        fontSize: 10, fontWeight: 700, letterSpacing: 1,
    },
    gameCard: {
        background: "#1a1a1f",
        border: "1px solid #2a2a30",
        borderRadius: 4,
        padding: "14px", marginBottom: 10,
    },
    gameVs: {
        fontSize: 14, fontWeight: 700, marginBottom: 6, color: "#F5F5F7",
    },
    gameMeta: {
        display: "flex", gap: 16, fontSize: 12, color: "#72727e",
    },
    slotLabel: {
        display: "flex", justifyContent: "space-between",
        fontSize: 11, color: "#72727e", marginBottom: 5,
    },
    slotTrack: {
        height: 3, background: "#2a2a30", borderRadius: 3, overflow: "hidden",
    },
    slotFill: {
        height: "100%", borderRadius: 3, background: "#00D4EC",
        transition: "width 0.5s",
    },
    playerRow: {
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 0", borderBottom: "1px solid #1e1e23",
    },
    playerAvatar: {
        width: 34, height: 34, borderRadius: "50%",
        background: "#1a1a1f",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, flexShrink: 0,
        color: "#D040EF",
        border: "1px solid rgba(208,64,239,0.25)",
    },
    playerName: { fontSize: 14, fontWeight: 600, color: "#F5F5F7" },
    playerPos:  { fontSize: 12, color: "#72727e" },
    playerRating: {
        marginLeft: "auto",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 20, fontWeight: 700, color: "#D040EF",
    },

    // How it works
    pathLabel: {
        display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
    },
    pathDot: {
        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
    },
    stepsGrid: {
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
    },
    step: {
        background: "#161619",
        border: "1px solid #222228",
        borderRadius: 4,
        padding: "24px",
        transition: "border-color 0.2s, background 0.2s",
    },
    stepNum: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 44, fontWeight: 700, lineHeight: 1, marginBottom: 14,
    },
    stepTitle: { fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#F5F5F7" },
    stepDesc:  { fontSize: 13, color: "#72727e", lineHeight: 1.65 },

    // CTA
    ctaSection: {
        padding: "96px 24px",
        textAlign: "center",
        borderTop: "1px solid #222228",
    },
    ctaTitle: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(40px, 6vw, 80px)",
        fontWeight: 800, letterSpacing: 4,
        textTransform: "uppercase",
        marginBottom: 14,
    },
    ctaDesc: {
        color: "#72727e", fontSize: 16, marginBottom: 40,
    },
    ctaButtons: {
        display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap",
    },
    btnPrimary: {
        padding: "14px 36px",
        background: "#00D4EC",
        color: "#0d0d10",
        border: "none", borderRadius: 4,
        fontSize: 14, fontWeight: 700, letterSpacing: 0.8,
        cursor: "pointer",
        transition: "background 0.15s, transform 0.15s",
    },
    btnSecondary: {
        padding: "14px 36px",
        background: "transparent",
        color: "#F5F5F7",
        border: "1px solid #2a2a30",
        borderRadius: 4,
        fontSize: 14, fontWeight: 700, letterSpacing: 0.8,
        cursor: "pointer",
        transition: "background 0.15s, transform 0.15s",
        display: "flex", alignItems: "center", gap: 8,
    },

    // Footer
    footer: {
        padding: "32px 48px",
        borderTop: "1px solid #222228",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 16,
    },
    footerBrand: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 20, fontWeight: 700, letterSpacing: 3, color: "#F5F5F7",
    },
    footerLink: {
        fontSize: 13, color: "#72727e", cursor: "pointer",
        background: "none", border: "none",
        transition: "color 0.15s",
    },
    footerCopy: {
        fontSize: 12, color: "#72727e",
    },
};
