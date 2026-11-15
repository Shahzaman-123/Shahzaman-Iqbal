import { useEffect, useRef, useState } from "react";
import "./KineticHero.css";
import ParticleIntro from "./ParticleIntro";

const MARQUEE_ITEMS = [
  "SMART REPLIES",
  "WHATSAPP FOLLOW-UPS",
  "NEW CUSTOMERS",
  "BOOKINGS",
  "FIXKHATA",
  "TIME SAVED",
  "WEBSITES THAT SELL",
];

const STATS = [
  { value: "35+", label: "Apps live" },
  { value: "10+ hrs", label: "Saved every week" },
  { value: "3", label: "Paying clients" },
  { value: "100", label: "100-app challenge" },
];

const WHATSAPP_AUDIT_URL =
  "https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%27d%20like%20to%20book%20a%20free%20audit";

function KineticLine({ text, accent = false, delay = 0 }) {
  return (
    <span className="kinetic-row">
      <span className="kinetic-row-inner" style={{ animationDelay: `${delay}s` }}>
        {[...text].map((ch, i) =>
          ch === " " ? (
            <span key={i} className="kinetic-ch kinetic-ch-space">
              {"\u00A0"}
            </span>
          ) : (
            <span key={i} className={`kinetic-ch${accent ? " kinetic-ch-accent" : ""}`}>
              {ch}
            </span>
          )
        )}
      </span>
    </span>
  );
}

export default function KineticHero() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const glowRef = useRef(null);
  const cardRef = useRef(null);

  // Preloader: particles converge into the glowing "S" mark while the
  // counter runs 0% -> 100%; the hero entrances only start once the
  // loader lifts, so nothing finishes behind the loader.
  useEffect(() => {
    let n = 0;
    const iv = setInterval(() => {
      n += Math.floor(Math.random() * 12) + 4;
      if (n >= 100) {
        n = 100;
        clearInterval(iv);
        setTimeout(() => setLoading(false), 700);
      }
      setProgress(n);
    }, 90);
    return () => clearInterval(iv);
  }, []);

  // Cursor glow follower (pointer only; harmless on touch).
  useEffect(() => {
    const onMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  const handleCardMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotate(2deg) rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`;
  };

  const handleCardLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "";
  };

  const handleMagneticMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${
      (e.clientY - r.top - r.height / 2) * 0.35
    }px)`;
  };

  const handleMagneticLeave = (e) => {
    e.currentTarget.style.transform = "";
  };

  return (
    <>
      {/* Preloader — particles converge into the glowing "S" mark
          (Cinematic opening), thin red progress bar + % counter */}
      <div className={`kinetic-loader${loading ? "" : " kinetic-loader-done"}`} aria-hidden={!loading}>
        <ParticleIntro />
        <div className="kinetic-loader-lbl">LOADING PORTFOLIO</div>
        <div className="kinetic-loader-num">{progress}%</div>
        <div
          className="kinetic-loader-bar"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Film grain + cursor glow (fixed overlays) */}
      <div className="kinetic-grain" aria-hidden="true" />
      <div className="kinetic-glow" ref={glowRef} aria-hidden="true" />

      <section className={`kinetic-hero${loading ? "" : " kinetic-hero-ready"}`}>
        {/* 5-second rule: who it's for, in the first line a visitor reads. */}
        <div className="kinetic-kicker">
          SMART SYSTEMS FOR REPAIR SHOPS &amp; PROPERTY SELLERS
        </div>

        <div className="kinetic-main">
          <div className="kinetic-copy">
            <div className="kinetic-script">Hello, I&rsquo;m</div>
            <h1 className="kinetic-title">
              <KineticLine text="SHAHZAMAN" delay={0} />
              <KineticLine text="BUILDS" accent delay={0.12} />
              <KineticLine text="SYSTEMS." delay={0.24} />
            </h1>

            {/* One short line: what it does + the result. Plain words only. */}
            <p className="kinetic-sub">
              They <b>reply to customers, book, and follow up</b> — saving you <b>10+ hours a week</b>.
            </p>

            <div className="kinetic-cta">
              <a
                href="#portfolio"
                className="kinetic-btn kinetic-btn-acc"
                onPointerMove={handleMagneticMove}
                onPointerLeave={handleMagneticLeave}
              >
                See my work &rarr;
              </a>
              <a
                href={WHATSAPP_AUDIT_URL}
                target="_blank"
                rel="noreferrer"
                className="kinetic-btn kinetic-btn-ghost"
                onPointerMove={handleMagneticMove}
                onPointerLeave={handleMagneticLeave}
              >
                Book a free audit
              </a>
            </div>
          </div>

          {/* ID badge on a lanyard — flies/tumbles in, then swings (reference video) */}
          <div className="kinetic-photo-wrap">
            {/* Giant outlined PORTFOLIO behind the portrait */}
            <div className="kinetic-giant-word" aria-hidden="true">PORTFOLIO</div>
            <div className="kinetic-badge-swing">
              <div className="kinetic-badge-enter">
              <div className="kinetic-lanyard" aria-hidden="true" />
              <div
                className="kinetic-badge"
                id="kinetic-photo-card"
                ref={cardRef}
                onPointerMove={handleCardMove}
                onPointerLeave={handleCardLeave}
              >
                <div className="kinetic-badge-role">DEVELOPER</div>
                <picture>
                  <source
                    srcSet="/profile-suit-640.webp 640w, /profile-suit-960.webp 960w"
                    sizes="(max-width: 480px) 72vw, 320px"
                    type="image/webp"
                  />
                  <img
                    src="/profile-suit.png"
                    srcSet="/profile-suit.png 640w"
                    sizes="(max-width: 480px) 72vw, 320px"
                    alt="Shahzaman Iqbal"
                    width="640"
                    height="798"
                    loading="eager"
                    fetchPriority="high"
                  />
                </picture>
                <div className="kinetic-badge-name">SHAH ZAMAN IQBAL</div>
                <div className="kinetic-badge-sub">AUTOMATION DEVELOPER</div>
                <div className="kinetic-badge-foot">
                  <span>PORTFOLIO</span>
                  <span>EST. 2026</span>
                </div>
              </div>
              </div>
            </div>
            <div className="kinetic-tag">&#9733; AVAILABLE FOR WORK</div>
          </div>
        </div>

        {/* Line-draw workflow diagram — the video's stroke draw-on moment:
            the automation pipeline draws itself (Trigger -> AI Agent ->
            CRM -> WhatsApp) once the loader lifts. */}
        <div className={`kinetic-linedraw${loading ? "" : " line-draw-on"}`} aria-hidden="true">
          <svg viewBox="0 0 1000 120" fill="none" role="img">
            {/* Node outlines (drawn left to right) */}
            <rect className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "0.15s" }} x="30" y="30" width="140" height="56" rx="10" stroke="#ff2a2a" strokeWidth="1.5" />
            <rect className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "0.45s" }} x="230" y="30" width="140" height="56" rx="10" stroke="#ff2a2a" strokeWidth="1.5" />
            <rect className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "0.75s" }} x="430" y="30" width="140" height="56" rx="10" stroke="#ff2a2a" strokeWidth="1.5" />
            <rect className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "1.05s" }} x="630" y="30" width="140" height="56" rx="10" stroke="#ff2a2a" strokeWidth="1.5" />
            <rect className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "1.35s" }} x="830" y="30" width="140" height="56" rx="10" stroke="#ff2a2a" strokeWidth="1.5" />
            {/* Connectors */}
            <line className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "0.3s" }} x1="170" y1="58" x2="230" y2="58" stroke="#ff2a2a" strokeWidth="1.5" />
            <line className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "0.6s" }} x1="370" y1="58" x2="430" y2="58" stroke="#ff2a2a" strokeWidth="1.5" />
            <line className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "0.9s" }} x1="570" y1="58" x2="630" y2="58" stroke="#ff2a2a" strokeWidth="1.5" />
            <line className="line-draw-shape" pathLength="1" style={{ "--draw-delay": "1.2s" }} x1="770" y1="58" x2="830" y2="58" stroke="#ff2a2a" strokeWidth="1.5" />
            {/* Node names */}
            <text className="line-draw-label" style={{ "--draw-delay": "0.7s" }} x="100" y="63" textAnchor="middle" fontSize="14" fill="#e2e8f0" fontFamily="inherit" fontWeight="700">New Lead</text>
            <text className="line-draw-label" style={{ "--draw-delay": "1s" }} x="300" y="63" textAnchor="middle" fontSize="14" fill="#e2e8f0" fontFamily="inherit" fontWeight="700">Check</text>
            <text className="line-draw-label" style={{ "--draw-delay": "1.3s" }} x="500" y="63" textAnchor="middle" fontSize="14" fill="#e2e8f0" fontFamily="inherit" fontWeight="700">AI Reply</text>
            <text className="line-draw-label" style={{ "--draw-delay": "1.6s" }} x="700" y="63" textAnchor="middle" fontSize="14" fill="#e2e8f0" fontFamily="inherit" fontWeight="700">Voice Call</text>
            <text className="line-draw-label" style={{ "--draw-delay": "1.9s" }} x="900" y="63" textAnchor="middle" fontSize="14" fill="#e2e8f0" fontFamily="inherit" fontWeight="700">List Updated</text>
            {/* Micro-labels under the nodes */}
            <text className="line-draw-label" style={{ "--draw-delay": "0.9s" }} x="100" y="108" textAnchor="middle" fontSize="10" letterSpacing="2" fill="#94a3b8" fontFamily="ui-monospace, monospace">TRIGGER</text>
            <text className="line-draw-label" style={{ "--draw-delay": "1.2s" }} x="300" y="108" textAnchor="middle" fontSize="10" letterSpacing="2" fill="#94a3b8" fontFamily="ui-monospace, monospace">CHECK</text>
            <text className="line-draw-label" style={{ "--draw-delay": "1.5s" }} x="500" y="108" textAnchor="middle" fontSize="10" letterSpacing="2" fill="#94a3b8" fontFamily="ui-monospace, monospace">AI REPLY</text>
            <text className="line-draw-label" style={{ "--draw-delay": "1.8s" }} x="700" y="108" textAnchor="middle" fontSize="10" letterSpacing="2" fill="#94a3b8" fontFamily="ui-monospace, monospace">VOICE CALL</text>
            <text className="line-draw-label" style={{ "--draw-delay": "2.1s" }} x="900" y="108" textAnchor="middle" fontSize="10" letterSpacing="2" fill="#94a3b8" fontFamily="ui-monospace, monospace">WHATSAPP</text>
          </svg>
          {/* Mobile: the diagram is too small to read at 360px — one line instead. */}
          <p className="kinetic-linedraw-mobile">NEW LEAD &rarr; AI REPLY &rarr; CALL &rarr; WHATSAPP</p>
        </div>

        <div className="kinetic-stats">
          {STATS.map((s) => (
            <div key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="kinetic-marquee" aria-hidden="true">
        <div className="kinetic-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i}>
              {item} <i>&#10022;</i>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
