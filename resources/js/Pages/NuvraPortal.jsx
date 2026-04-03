import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Animated counter hook ─────────────────────────────────────────────────
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

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ value, suffix = "", label }) {
    const { count, ref } = useCountUp(value);
    return (
        <div ref={ref} className="portal-stat-card">
            <span className="portal-stat-number">{count.toLocaleString()}{suffix}</span>
            <span className="portal-stat-label">{label}</span>
        </div>
    );
}

// ─── Feature Row ───────────────────────────────────────────────────────────
function FeatureItem({ icon, text }) {
    return (
        <div className="portal-feature-item">
            <span className="portal-feature-icon">{icon}</span>
            <span>{text}</span>
        </div>
    );
}

export default function NuvraPortal() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="portal-root">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .portal-root {
                    font-family: 'Inter', sans-serif;
                    background: #080810;
                    color: #fff;
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                /* ── Nav ── */
                .portal-nav {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 20px 48px;
                    transition: all 0.3s ease;
                }
                .portal-nav.scrolled {
                    background: rgba(8,8,16,0.92);
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    padding: 14px 48px;
                }
                .portal-nav-logo {
                    display: flex; align-items: center; gap: 10px;
                }
                .portal-nav-logo img { height: 36px; }
                .portal-nav-brand {
                    font-family: 'Bebas Neue', cursive;
                    font-size: 28px; letter-spacing: 2px;
                    background: linear-gradient(135deg, #fff, #a78bfa);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .portal-nav-links { display: flex; gap: 32px; align-items: center; }
                .portal-nav-link {
                    color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 500;
                    text-decoration: none; transition: color 0.2s;
                    cursor: pointer; background: none; border: none;
                }
                .portal-nav-link:hover { color: #fff; }
                .portal-nav-cta {
                    padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;
                    background: linear-gradient(135deg, #7c3aed, #4f46e5);
                    color: #fff; border: none; cursor: pointer; transition: opacity 0.2s;
                }
                .portal-nav-cta:hover { opacity: 0.85; }

                /* ── Hero ── */
                .portal-hero {
                    min-height: 100vh;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    text-align: center; padding: 120px 24px 80px;
                    position: relative; overflow: hidden;
                }
                .portal-hero-bg {
                    position: absolute; inset: 0; z-index: 0;
                    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 70%),
                                radial-gradient(ellipse 60% 50% at 20% 80%, rgba(0,255,135,0.08) 0%, transparent 60%),
                                radial-gradient(ellipse 60% 50% at 80% 80%, rgba(255,107,53,0.08) 0%, transparent 60%);
                }
                .portal-hero-badge {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.4);
                    border-radius: 100px; padding: 6px 16px; font-size: 13px; font-weight: 600;
                    color: #a78bfa; margin-bottom: 32px; position: relative; z-index: 1;
                }
                .portal-hero-badge-dot {
                    width: 6px; height: 6px; border-radius: 50%; background: #00ff87;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.3); }
                }
                .portal-hero-title {
                    font-family: 'Bebas Neue', cursive;
                    font-size: clamp(64px, 10vw, 140px);
                    line-height: 0.9; letter-spacing: 4px;
                    position: relative; z-index: 1; margin-bottom: 8px;
                }
                .portal-hero-title-green {
                    background: linear-gradient(135deg, #00ff87, #00c9ff);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .portal-hero-tagline {
                    font-size: clamp(16px, 2.5vw, 22px); color: rgba(255,255,255,0.55);
                    max-width: 560px; line-height: 1.6; margin: 20px auto 48px;
                    position: relative; z-index: 1; font-weight: 500;
                }

                /* ── Portal Cards ── */
                .portal-cards-wrapper {
                    display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;
                    position: relative; z-index: 1; margin-bottom: 48px;
                }
                .portal-card {
                    width: 320px; border-radius: 24px; padding: 32px;
                    cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border: 1px solid;
                    text-align: left; position: relative; overflow: hidden;
                    background: none;
                }
                .portal-card:hover { transform: translateY(-8px); }
                .portal-card-community {
                    background: linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,201,255,0.05));
                    border-color: rgba(0,255,135,0.25);
                    box-shadow: 0 0 40px rgba(0,255,135,0.08);
                }
                .portal-card-community:hover { box-shadow: 0 20px 60px rgba(0,255,135,0.15); }
                .portal-card-club {
                    background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08));
                    border-color: rgba(124,58,237,0.35);
                    box-shadow: 0 0 40px rgba(124,58,237,0.08);
                }
                .portal-card-club:hover { box-shadow: 0 20px 60px rgba(124,58,237,0.2); }
                .portal-card-icon {
                    font-size: 40px; margin-bottom: 16px; display: block;
                }
                .portal-card-title {
                    font-size: 22px; font-weight: 800; margin-bottom: 8px;
                }
                .portal-card-community .portal-card-title { color: #00ff87; }
                .portal-card-club .portal-card-title { color: #a78bfa; }
                .portal-card-subtitle {
                    font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6; margin-bottom: 24px;
                }
                .portal-card-features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 28px; }
                .portal-card-feature {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500;
                }
                .portal-card-feature-dot {
                    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
                }
                .portal-card-community .portal-card-feature-dot { background: #00ff87; }
                .portal-card-club .portal-card-feature-dot { background: #a78bfa; }
                .portal-card-btn {
                    width: 100%; padding: 12px; border-radius: 12px;
                    font-size: 14px; font-weight: 700; border: none; cursor: pointer;
                    transition: opacity 0.2s, transform 0.2s;
                    letter-spacing: 0.5px;
                }
                .portal-card-btn:hover { opacity: 0.9; transform: scale(1.02); }
                .portal-card-community .portal-card-btn {
                    background: linear-gradient(135deg, #00ff87, #00c9ff);
                    color: #080810;
                }
                .portal-card-club .portal-card-btn {
                    background: linear-gradient(135deg, #7c3aed, #4f46e5);
                    color: #fff;
                }
                .portal-card-glow {
                    position: absolute; bottom: -40px; right: -40px;
                    width: 120px; height: 120px; border-radius: 50%; filter: blur(40px);
                    pointer-events: none;
                }
                .portal-card-community .portal-card-glow { background: rgba(0,255,135,0.2); }
                .portal-card-club .portal-card-glow { background: rgba(124,58,237,0.3); }

                .portal-scroll-hint {
                    position: relative; z-index: 1; color: rgba(255,255,255,0.3);
                    font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px;
                    animation: bounce 2s infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(6px); }
                }

                /* ── Stats Section ── */
                .portal-stats {
                    padding: 80px 24px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    display: flex; justify-content: center;
                    background: rgba(255,255,255,0.02);
                }
                .portal-stats-inner {
                    display: flex; gap: 0; flex-wrap: wrap; justify-content: center;
                    max-width: 900px; width: 100%;
                }
                .portal-stat-card {
                    flex: 1; min-width: 160px; text-align: center; padding: 24px 32px;
                    border-right: 1px solid rgba(255,255,255,0.06);
                    display: flex; flex-direction: column; gap: 8px;
                }
                .portal-stat-card:last-child { border-right: none; }
                .portal-stat-number {
                    font-family: 'Bebas Neue', cursive;
                    font-size: 52px; line-height: 1;
                    background: linear-gradient(135deg, #fff, #a78bfa);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .portal-stat-label {
                    font-size: 13px; color: rgba(255,255,255,0.45); font-weight: 500; text-transform: uppercase; letter-spacing: 1px;
                }

                /* ── Features Section ── */
                .portal-section {
                    padding: 100px 24px; max-width: 1100px; margin: 0 auto;
                }
                .portal-section-tag {
                    display: inline-block; padding: 4px 14px; border-radius: 100px;
                    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
                    margin-bottom: 16px;
                }
                .portal-section-tag-green { background: rgba(0,255,135,0.1); color: #00ff87; }
                .portal-section-tag-purple { background: rgba(124,58,237,0.15); color: #a78bfa; }
                .portal-section-title {
                    font-size: clamp(28px, 4vw, 48px); font-weight: 800; line-height: 1.15;
                    margin-bottom: 16px;
                }
                .portal-section-desc {
                    font-size: 16px; color: rgba(255,255,255,0.5); line-height: 1.7;
                    max-width: 480px; margin-bottom: 40px;
                }
                .portal-two-col {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
                }
                @media (max-width: 768px) {
                    .portal-two-col { grid-template-columns: 1fr; gap: 48px; }
                    .portal-nav { padding: 16px 24px; }
                    .portal-nav.scrolled { padding: 12px 24px; }
                    .portal-nav-links { display: none; }
                    .portal-stats-inner { gap: 0; }
                    .portal-stat-card { min-width: 140px; }
                }
                .portal-feature-item {
                    display: flex; align-items: center; gap: 14px;
                    padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
                    font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.8);
                }
                .portal-feature-icon { font-size: 22px; }

                /* ── Visual Mock Card ── */
                .portal-mock {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px; padding: 28px; overflow: hidden;
                }
                .portal-mock-header {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 20px;
                }
                .portal-mock-title { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
                .portal-mock-badge {
                    padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700;
                }
                .portal-mock-badge-green { background: rgba(0,255,135,0.15); color: #00ff87; }
                .portal-mock-badge-purple { background: rgba(124,58,237,0.2); color: #a78bfa; }
                .portal-game-card {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(0,255,135,0.15);
                    border-radius: 14px; padding: 16px; margin-bottom: 12px;
                }
                .portal-game-vs { font-size: 16px; font-weight: 800; margin-bottom: 8px; }
                .portal-game-meta { display: flex; gap: 16px; font-size: 12px; color: rgba(255,255,255,0.45); }
                .portal-slot-bar-wrap { margin-top: 12px; }
                .portal-slot-bar-label { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
                .portal-slot-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
                .portal-slot-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #00ff87, #00c9ff); transition: width 0.5s; }
                .portal-player-row {
                    display: flex; align-items: center; gap: 12px;
                    padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .portal-player-avatar {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: linear-gradient(135deg, #7c3aed, #4f46e5);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px; font-weight: 700; flex-shrink: 0;
                }
                .portal-player-name { font-size: 14px; font-weight: 600; }
                .portal-player-pos { font-size: 12px; color: rgba(255,255,255,0.4); }
                .portal-player-rating {
                    margin-left: auto; font-size: 13px; font-weight: 800;
                    background: linear-gradient(135deg, #a78bfa, #7c3aed);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }

                /* ── How It Works ── */
                .portal-steps {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
                    margin-top: 48px;
                }
                @media (max-width: 768px) { .portal-steps { grid-template-columns: 1fr; } }
                .portal-step {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 20px; padding: 28px; text-align: center;
                    transition: border-color 0.3s;
                }
                .portal-step:hover { border-color: rgba(255,255,255,0.15); }
                .portal-step-num {
                    font-family: 'Bebas Neue', cursive; font-size: 48px; line-height: 1; margin-bottom: 16px;
                }
                .portal-step-num-green { color: #00ff87; }
                .portal-step-num-purple { color: #a78bfa; }
                .portal-step-title { font-size: 17px; font-weight: 700; margin-bottom: 10px; }
                .portal-step-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.6; }

                /* ── CTA Section ── */
                .portal-cta-section {
                    padding: 100px 24px; text-align: center;
                    background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%);
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
                .portal-cta-title {
                    font-family: 'Bebas Neue', cursive;
                    font-size: clamp(36px, 6vw, 72px); letter-spacing: 3px; margin-bottom: 16px;
                }
                .portal-cta-desc {
                    color: rgba(255,255,255,0.45); font-size: 16px; margin-bottom: 40px;
                }
                .portal-cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
                .portal-btn-primary {
                    padding: 16px 36px; border-radius: 14px; font-size: 16px; font-weight: 700;
                    background: linear-gradient(135deg, #00ff87, #00c9ff);
                    color: #080810; border: none; cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 0 30px rgba(0,255,135,0.3);
                }
                .portal-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 40px rgba(0,255,135,0.4); }
                .portal-btn-secondary {
                    padding: 16px 36px; border-radius: 14px; font-size: 16px; font-weight: 700;
                    background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.4);
                    color: #a78bfa; cursor: pointer; transition: transform 0.2s, background 0.2s;
                }
                .portal-btn-secondary:hover { transform: translateY(-3px); background: rgba(124,58,237,0.25); }

                /* ── Footer ── */
                .portal-footer {
                    padding: 40px 48px; border-top: 1px solid rgba(255,255,255,0.06);
                    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
                }
                .portal-footer-brand {
                    font-family: 'Bebas Neue', cursive; font-size: 22px; letter-spacing: 2px;
                    background: linear-gradient(135deg, #fff, #a78bfa);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .portal-footer-copy { font-size: 13px; color: rgba(255,255,255,0.3); }
                .portal-footer-links { display: flex; gap: 24px; }
                .portal-footer-link {
                    font-size: 13px; color: rgba(255,255,255,0.4); cursor: pointer;
                    text-decoration: none; transition: color 0.2s; background: none; border: none;
                }
                .portal-footer-link:hover { color: rgba(255,255,255,0.8); }
            `}</style>

            {/* ── Navigation ── */}
            <nav className={`portal-nav ${scrolled ? "scrolled" : ""}`}>
                <div className="portal-nav-logo">
                    <img src="/images/logoImage/NUVRA_LOGO.png" alt="Nuvra" />
                    <span className="portal-nav-brand">NUVRA</span>
                </div>
                <div className="portal-nav-links">
                    <button className="portal-nav-link" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How It Works</button>
                    <button className="portal-nav-link" onClick={() => document.getElementById("community-section")?.scrollIntoView({ behavior: "smooth" })}>Community</button>
                    <button className="portal-nav-link" onClick={() => document.getElementById("club-section")?.scrollIntoView({ behavior: "smooth" })}>Nuvra Club</button>
                    <button className="portal-nav-cta" onClick={() => navigate("/community")}>Get Started</button>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="portal-hero">
                <div className="portal-hero-bg" />
                <div className="portal-hero-badge">
                    <span className="portal-hero-badge-dot" />
                    Now Live — Football for Every Level
                </div>
                <h1 className="portal-hero-title">
                    THE FOOTBALL<br />
                    <span className="portal-hero-title-green">ECOSYSTEM</span>
                </h1>
                <p className="portal-hero-tagline">
                    Whether you're a casual player looking for a game tonight, or a coach managing a full squad — Nuvra has a place for you.
                </p>

                <div className="portal-cards-wrapper">
                    {/* Community Card */}
                    <div className="portal-card portal-card-community" onClick={() => navigate("/community")}>
                        <div className="portal-card-glow" />
                        <span className="portal-card-icon">🏘️</span>
                        <h2 className="portal-card-title">Nuvra Community</h2>
                        <p className="portal-card-subtitle">
                            No club? No problem. Find pickup games near you, pick your team, and book your slot.
                        </p>
                        <div className="portal-card-features">
                            {["Browse open pickup games", "Join Team A or Team B", "Real-time slot availability", "Community announcements"].map(f => (
                                <div key={f} className="portal-card-feature">
                                    <span className="portal-card-feature-dot" />{f}
                                </div>
                            ))}
                        </div>
                        <button className="portal-card-btn">Join the Community →</button>
                    </div>

                    {/* Club Card */}
                    <div className="portal-card portal-card-club" onClick={() => navigate("/login")}>
                        <div className="portal-card-glow" />
                        <span className="portal-card-icon">🏆</span>
                        <h2 className="portal-card-title">Nuvra Club</h2>
                        <p className="portal-card-subtitle">
                            The complete club management platform. Stats, squad, payments, and performance — all in one place.
                        </p>
                        <div className="portal-card-features">
                            {["Player performance tracking", "Squad & jersey management", "Match stats & ratings", "Payment management"].map(f => (
                                <div key={f} className="portal-card-feature">
                                    <span className="portal-card-feature-dot" />{f}
                                </div>
                            ))}
                        </div>
                        <button className="portal-card-btn">Access Club Portal →</button>
                    </div>
                </div>

                <div className="portal-scroll-hint">
                    <span>Scroll to explore</span>
                    <span>↓</span>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="portal-stats">
                <div className="portal-stats-inner">
                    <StatCard value={500} suffix="+" label="Community Players" />
                    <StatCard value={120} suffix="+" label="Games Organised" />
                    <StatCard value={30} suffix="+" label="Clubs on Platform" />
                    <StatCard value={2500} suffix="+" label="Stats Recorded" />
                </div>
            </section>

            {/* ── Community Section ── */}
            <section id="community-section" className="portal-section">
                <div className="portal-two-col">
                    <div>
                        <span className="portal-section-tag portal-section-tag-green">Community</span>
                        <h2 className="portal-section-title">Football without the commitment</h2>
                        <p className="portal-section-desc">
                            Not everyone wants to join a club. Nuvra Community lets you show up, pick a side, and play. No contracts. No stats pressure. Just football and good vibes.
                        </p>
                        <div>
                            <FeatureItem icon="📅" text="Games announced in advance with full details" />
                            <FeatureItem icon="🪑" text="Live seat tracker — see exactly how many slots remain" />
                            <FeatureItem icon="⚡" text="One-tap booking — in and out in under a minute" />
                            <FeatureItem icon="📢" text="Community announcements from organisers" />
                            <FeatureItem icon="📧" text="Email alerts when new games are posted" />
                        </div>
                    </div>
                    {/* Community Preview Mock */}
                    <div className="portal-mock">
                        <div className="portal-mock-header">
                            <span className="portal-mock-title">Upcoming Games</span>
                            <span className="portal-mock-badge portal-mock-badge-green">3 Open</span>
                        </div>
                        {[
                            { title: "Team Alpha vs Team Beta", venue: "Cheras Futsal Arena", slots: 14, max: 20 },
                            { title: "The Reds vs The Blues", venue: "Desa Park Turf", slots: 7, max: 20 },
                        ].map((g, i) => (
                            <div key={i} className="portal-game-card">
                                <div className="portal-game-vs">{g.title}</div>
                                <div className="portal-game-meta">
                                    <span>📍 {g.venue}</span>
                                    <span>⏰ Tonight, 9PM</span>
                                </div>
                                <div className="portal-slot-bar-wrap">
                                    <div className="portal-slot-bar-label">
                                        <span>Slots</span>
                                        <span style={{ color: g.slots < 5 ? "#ff6b35" : "#00ff87" }}>{g.slots}/{g.max} left</span>
                                    </div>
                                    <div className="portal-slot-bar">
                                        <div className="portal-slot-bar-fill" style={{ width: `${(g.slots / g.max) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Club Section ── */}
            <section id="club-section" className="portal-section" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="portal-two-col">
                    {/* Club Preview Mock */}
                    <div className="portal-mock">
                        <div className="portal-mock-header">
                            <span className="portal-mock-title">Squad Roster</span>
                            <span className="portal-mock-badge portal-mock-badge-purple">Active</span>
                        </div>
                        {[
                            { name: "Haziq Amirul", pos: "Forward", rating: "87", initial: "H" },
                            { name: "Danial Razif", pos: "Midfielder", rating: "82", initial: "D" },
                            { name: "Syafiq Nizam", pos: "Defender", rating: "79", initial: "S" },
                        ].map((p, i) => (
                            <div key={i} className="portal-player-row">
                                <div className="portal-player-avatar">{p.initial}</div>
                                <div>
                                    <div className="portal-player-name">{p.name}</div>
                                    <div className="portal-player-pos">{p.pos}</div>
                                </div>
                                <span className="portal-player-rating">{p.rating}</span>
                            </div>
                        ))}
                    </div>
                    <div>
                        <span className="portal-section-tag portal-section-tag-purple">Nuvra Club</span>
                        <h2 className="portal-section-title">The complete club management system</h2>
                        <p className="portal-section-desc">
                            Built for coaches and club owners who need a single platform to track every player, manage every match, and run every payment.
                        </p>
                        <div>
                            <FeatureItem icon="📊" text="FIFA-style player cards with real attributes" />
                            <FeatureItem icon="⚽" text="Match stats — goals, assists, ratings, cleansheets" />
                            <FeatureItem icon="💳" text="Integrated payments via Billplz" />
                            <FeatureItem icon="📣" text="Team announcements & scheduling" />
                            <FeatureItem icon="🧑‍🤝‍🧑" text="Squad management & recruitment pipeline" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" style={{ padding: "100px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 64 }}>
                        <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800 }}>How It Works</h2>
                        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 12, fontSize: 16 }}>Simple paths, powerful outcomes</p>
                    </div>

                    <div style={{ marginBottom: 60 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                            <span style={{ fontSize: 20 }}>🏘️</span>
                            <span style={{ fontWeight: 700, fontSize: 18, color: "#00ff87" }}>Community Path</span>
                        </div>
                        <div className="portal-steps">
                            {[
                                { num: "01", title: "Sign Up Free", desc: "Create your community account in under a minute. No club needed." },
                                { num: "02", title: "Browse Games", desc: "See all upcoming pickup games — venue, time, teams, and slots remaining." },
                                { num: "03", title: "Book Your Slot", desc: "Pick a side and confirm your spot. You'll get an email confirmation." },
                            ].map(s => (
                                <div key={s.num} className="portal-step">
                                    <div className={`portal-step-num portal-step-num-green`}>{s.num}</div>
                                    <div className="portal-step-title">{s.title}</div>
                                    <div className="portal-step-desc">{s.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                            <span style={{ fontSize: 20 }}>🏆</span>
                            <span style={{ fontWeight: 700, fontSize: 18, color: "#a78bfa" }}>Club Path</span>
                        </div>
                        <div className="portal-steps">
                            {[
                                { num: "01", title: "Coach Registers", desc: "Coach creates the team and sets up the club on Nuvra Club." },
                                { num: "02", title: "Players Join", desc: "Players apply to the club and get approved by the coach." },
                                { num: "03", title: "Manage Everything", desc: "Track stats, schedule matches, post announcements, manage payments." },
                            ].map(s => (
                                <div key={s.num} className="portal-step">
                                    <div className={`portal-step-num portal-step-num-purple`}>{s.num}</div>
                                    <div className="portal-step-title">{s.title}</div>
                                    <div className="portal-step-desc">{s.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="portal-cta-section">
                <h2 className="portal-cta-title">READY TO PLAY?</h2>
                <p className="portal-cta-desc">Join Nuvra today — the football platform built for Malaysians.</p>
                <div className="portal-cta-buttons">
                    <button className="portal-btn-primary" onClick={() => navigate("/community")}>
                        🏘️ Join Community — It's Free
                    </button>
                    <button className="portal-btn-secondary" onClick={() => navigate("/login")}>
                        🏆 Club Portal →
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="portal-footer">
                <span className="portal-footer-brand">NUVRA SPORTS</span>
                <div className="portal-footer-links">
                    <button className="portal-footer-link" onClick={() => navigate("/community")}>Community</button>
                    <button className="portal-footer-link" onClick={() => navigate("/login")}>Club Portal</button>
                </div>
                <span className="portal-footer-copy">© {new Date().getFullYear()} Nuvra Sports. All rights reserved.</span>
            </footer>
        </div>
    );
}
