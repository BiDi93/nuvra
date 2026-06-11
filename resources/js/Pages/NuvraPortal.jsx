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
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);
const IconArrowDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
    </svg>
);

// ── Gallery Strip ──────────────────────────────────────────────────────────────
const ROW_A = [
    "/images/gallery/g1.webp",
    "/images/gallery/g3.webp",
    "/images/gallery/g5.webp",
    "/images/gallery/g7.webp",
    "/images/gallery/g9.webp",
];
const ROW_B = [
    "/images/gallery/g2.webp",
    "/images/gallery/g4.webp",
    "/images/gallery/g6.webp",
    "/images/gallery/g8.webp",
    "/images/gallery/g10.webp",
];

function GalleryStrip() {
    const rowA = [...ROW_A, ...ROW_A];
    const rowB = [...ROW_B, ...ROW_B];
    return (
        <section style={G.section}>
            <div style={G.header}>
                <div style={G.headerLine} />
                <div style={G.headerInner}>
                    <span style={G.tag}>FROM THE PITCH</span>
                    <h2 style={G.title}>REAL GAMES.<br />REAL PLAYERS.</h2>
                    <p style={G.sub}>Captured live from Nuvra community matchdays.</p>
                </div>
                <div style={G.headerLine} />
            </div>
            <div style={G.stripOuter}>
                <div style={G.fadeLeft} />
                <div style={G.fadeRight} />
                <div style={G.row}>
                    <div className="marquee-left" style={G.track}>
                        {rowA.map((src, i) => (
                            <div key={i} style={G.imgWrap} className="gallery-img-wrap">
                                <img src={src} alt="" style={G.img} loading="lazy" />
                                <div className="gallery-overlay" style={G.overlay} />
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ ...G.row, marginTop: 12 }}>
                    <div className="marquee-right" style={G.track}>
                        {rowB.map((src, i) => (
                            <div key={i} style={G.imgWrap} className="gallery-img-wrap">
                                <img src={src} alt="" style={G.img} loading="lazy" />
                                <div className="gallery-overlay" style={G.overlay} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

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
                .portal-nav-link:hover { color: #00D4EC !important; }
                .portal-footer-link:hover { color: #00D4EC !important; }
                .portal-step:hover { border-color: #00D4EC !important; background: #1a1a1f !important; }
                .btn-primary:hover { background: #33DDFF !important; transform: translateY(-1px); }
                .marquee-left  { animation: marquee-left  40s linear infinite; }
                .marquee-right { animation: marquee-right 40s linear infinite; }
                @keyframes marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                @keyframes marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                .gallery-img-wrap { position: relative; overflow: hidden; border-radius: 6px; flex-shrink: 0; }
                .gallery-overlay  { position: absolute; inset: 0; background: rgba(0,0,0,0.35); transition: opacity 0.3s; }
                .gallery-img-wrap:hover .gallery-overlay { opacity: 0; }
                @media (max-width: 768px) {
                    .portal-two-col { grid-template-columns: 1fr !important; }
                    .portal-nav-links { display: none !important; }
                    .portal-stats-inner { flex-wrap: wrap !important; }
                }
            `}</style>

            <nav style={{ ...S.nav, ...(scrolled ? S.navScrolled : {}) }}>
                <div style={S.navLogo} onClick={() => navigate("/")}>
                    <img src="/images/logoImage/NUVRA_LOGO.webp" alt="Nuvra" style={{ height: 40 }} />
                </div>
                <div className="portal-nav-links" style={S.navLinks}>
                    <button className="portal-nav-link" style={S.navLink} onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How It Works</button>
                    <button className="portal-nav-link" style={S.navLink} onClick={() => navigate("/games")}>Join Game</button>
                    <button className="btn-primary" style={S.navCta} onClick={() => navigate("/community")}>Sign In</button>
                </div>
            </nav>

            <section style={S.hero}>
                <h1 style={S.heroTitle}>THE FOOTBALL<br /><span style={{ color: "#00D4EC" }}>COMMUNITY</span></h1>
                <p style={S.heroTagline}>The platform for amateur players and match organizers to connect, play, and track records.</p>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button className="btn-primary" style={S.btnPrimaryHero} onClick={() => navigate("/games")}>EXPLORE GAMES</button>
                    <button style={S.btnSecondaryHero} onClick={() => navigate("/community")}>ORGANIZER LOGIN</button>
                </div>
            </section>

            <section style={S.statsSection}>
                <div className="portal-stats-inner" style={S.statsInner}>
                    <StatCard value={1000} suffix="+" label="Players" />
                    <StatCard value={250} suffix="+" label="Matches" />
                    <StatCard value={50} suffix="+" label="Organizers" />
                </div>
            </section>

            <GalleryStrip />

            <section id="how-it-works" style={S.section}>
                <div style={{ textAlign: "center", marginBottom: 56 }}>
                    <h2 style={S.sectionTitle}>How It Works</h2>
                    <p style={{ color: "#72727e" }}>Simple steps to get you on the pitch</p>
                </div>
                <div style={S.stepsGrid}>
                    {[
                        { num: "01", title: "Browse", desc: "Find games hosted by organizers near you." },
                        { num: "02", title: "Join", desc: "Book your slot and pay the organizer via QR code." },
                        { num: "03", title: "Play & Record", desc: "Show up, play, and see your stats updated on your profile." },
                    ].map(s => (
                        <div key={s.num} className="portal-step" style={S.step}>
                            <div style={{ ...S.stepNum, color: "#00D4EC" }}>{s.num}</div>
                            <div style={S.stepTitle}>{s.title}</div>
                            <div style={S.stepDesc}>{s.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            <footer style={S.footer}>
                <span style={S.footerBrand}>NUVRA SPORTS</span>
                <span style={S.footerCopy}>© {new Date().getFullYear()} Nuvra Sports. All rights reserved.</span>
            </footer>
        </div>
    );
}

const S = {
    root: { fontFamily: "'Inter', sans-serif", background: "#0d0d10", color: "#F5F5F7", minHeight: "100vh", overflowX: "hidden" },
    nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", transition: "all 0.25s ease" },
    navScrolled: { background: "rgba(13,13,16,0.96)", borderBottom: "1px solid #222228", padding: "14px 48px" },
    navLogo: { cursor: "pointer" },
    navLinks: { display: "flex", gap: 28, alignItems: "center" },
    navLink: { color: "#72727e", fontSize: 14, fontWeight: 500, background: "none", border: "none", cursor: "pointer" },
    navCta: { padding: "8px 20px", background: "#00D4EC", color: "#0d0d10", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer" },
    hero: { minHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" },
    heroTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(50px, 8vw, 100px)", fontWeight: 800, lineHeight: 0.92, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 },
    heroTagline: { fontSize: "clamp(16px, 2vw, 20px)", color: "#72727e", maxWidth: 600, margin: "0 auto 40px" },
    btnPrimaryHero: { padding: "16px 40px", background: "#00D4EC", color: "#0d0d10", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 800, cursor: "pointer" },
    btnSecondaryHero: { padding: "16px 40px", background: "transparent", color: "#F5F5F7", border: "1px solid #2a2a30", borderRadius: 4, fontSize: 14, fontWeight: 800, cursor: "pointer" },
    statsSection: { background: "#0f0f13", borderY: "1px solid #222228", padding: "60px 24px" },
    statsInner: { display: "flex", justifyContent: "center", gap: 40, maxWidth: 1000, margin: "0 auto" },
    statCard: { textAlign: "center" },
    statNumber: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 48, fontWeight: 700, color: "#00D4EC" },
    statLabel: { fontSize: 12, color: "#72727e", textTransform: "uppercase", letterSpacing: 1 },
    section: { padding: "100px 24px", maxWidth: 1100, margin: "0 auto" },
    sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 700, textTransform: "uppercase" },
    stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 40 },
    step: { background: "#161619", border: "1px solid #222228", padding: "32px", borderRadius: 8 },
    stepNum: { fontSize: 40, fontWeight: 800, marginBottom: 16 },
    stepTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
    stepDesc: { color: "#72727e", lineHeight: 1.6 },
    footer: { padding: "40px 48px", borderTop: "1px solid #222228", display: "flex", justifyContent: "space-between" },
    footerBrand: { fontWeight: 800, letterSpacing: 2 },
    footerCopy: { color: "#555", fontSize: 12 }
};

const G = {
    section: { background: "#080810", padding: "80px 0", overflow: "hidden" },
    header: { display: "flex", alignItems: "center", gap: 20, maxWidth: 1100, margin: "0 auto 40px", padding: "0 24px" },
    headerLine: { flex: 1, height: 1, background: "#222" },
    headerInner: { textAlign: "center" },
    tag: { color: "#00D4EC", fontSize: 12, fontWeight: 700, letterSpacing: 2 },
    title: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 800 },
    sub: { color: "#555" },
    stripOuter: { position: "relative" },
    fadeLeft: { position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: "linear-gradient(to right, #080810, transparent)", zIndex: 2 },
    fadeRight: { position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: "linear-gradient(to left, #080810, transparent)", zIndex: 2 },
    row: { display: "flex", gap: 12 },
    track: { display: "flex", gap: 12 },
    imgWrap: { width: 300, height: 200 },
    img: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 },
    overlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }
};
