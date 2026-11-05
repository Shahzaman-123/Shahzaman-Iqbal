import { useEffect, useRef, useState } from "react";
import "./KineticHero.css";

const TYPEWRITER_WORDS = [
  "n8n workflows.",
  "AI voice agents.",
  "WhatsApp bots.",
  "SaaS apps.",
];

const MARQUEE_ITEMS = [
  "N8N",
  "AI AGENTS",
  "WHATSAPP AUTOMATION",
  "GOHIGHLEVEL",
  "REACT",
  "FIXKHATA",
  "LEAD SCRAPING",
];

const STATS = [
  { value: "35+", label: "SaaS apps live" },
  { value: "10+ hrs", label: "Saved / week / client" },
  { value: "3", label: "Paying clients" },
  { value: "100", label: "App challenge" },
];

const WHATSAPP_AUDIT_URL =
  "https://wa.me/923241736180?text=Hi%20Shahzaman%2C%20I%27d%20like%20to%20book%20a%20free%20automation%20audit";

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
  const [typed, setTyped] = useState("");
  const glowRef = useRef(null);
  const cardRef = useRef(null);

  // Preloader: count 0% -> 100%, then reveal the hero.
  useEffect(() => {
    let n = 0;
    const iv = setInterval(() => {
      n += Math.floor(Math.random() * 12) + 4;
      if (n >= 100) {
        n = 100;
        clearInterval(iv);
        setTimeout(() => setLoading(false), 250);
      }
      setProgress(n);
    }, 90);
    return () => clearInterval(iv);
  }, []);

  // Typewriter cycling through the service lines.
  useEffect(() => {
    let word = 0;
    let char = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const current = TYPEWRITER_WORDS[word];
      setTyped(current.slice(0, char));
      if (!deleting) {
        char += 1;
        if (char > current.length) {
          deleting = true;
          timer = setTimeout(tick, 1400);
          return;
        }
      } else {
        char -= 1;
        if (char === 0) {
          deleting = false;
          word = (word + 1) % TYPEWRITER_WORDS.length;
        }
      }
      timer = setTimeout(tick, deleting ? 35 : 70);
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
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
    el.style.transform = `rotate(3deg) rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`;
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
      {/* Preloader */}
      <div className={`kinetic-loader${loading ? "" : " kinetic-loader-done"}`} aria-hidden={!loading}>
        <div className="kinetic-loader-num">{progress}%</div>
        <div className="kinetic-loader-lbl">LOADING PORTFOLIO</div>
      </div>

      {/* Film grain + cursor glow (fixed overlays) */}
      <div className="kinetic-grain" aria-hidden="true" />
      <div className="kinetic-glow" ref={glowRef} aria-hidden="true" />

      <section className="kinetic-hero">
        <div className="kinetic-kicker">
          AUTOMATION DEVELOPER <em>//</em> AI WORKFLOWS <em>//</em> SAAS BUILDER
        </div>

        <div className="kinetic-main">
          <div className="kinetic-copy">
            <h1 className="kinetic-title">
              <KineticLine text="SHAHZAMAN" delay={0} />
              <KineticLine text="AUTOMATES" accent delay={0.12} />
              <KineticLine text="THE BORING." delay={0.24} />
            </h1>

            <p className="kinetic-sub">
              I build <b>AI agents, n8n workflows &amp; SaaS apps</b> that save repair shops
              &amp; realtors <b>10+ hours every week</b>. <span className="kinetic-type">{typed}</span>
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

          <div className="kinetic-photo-wrap">
            <div
              className="kinetic-photo-card"
              id="kinetic-photo-card"
              ref={cardRef}
              onPointerMove={handleCardMove}
              onPointerLeave={handleCardLeave}
            >
              <img src="/profile-suit.png" alt="Shahzaman Iqbal" />
            </div>
            <div className="kinetic-tag">&#9733; AVAILABLE FOR WORK</div>
          </div>
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
