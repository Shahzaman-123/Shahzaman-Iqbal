import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* The signature "Cinematic Deconstruction" moment, ported from the
   reference video's 01 / DECONSTRUCTION -> 02 / REBORN sequence:
   a working automation workflow EXPLODES into floating parts as you
   scroll, then REASSEMBLES — reborn as a system.
   Desktop (>=768px): pinned + scrubbed. Mobile: static assembled
   chain with a simple staggered reveal (no pinning — no jank). */

const NODES = [
  { number: "01", name: "New Lead", sub: "Trigger", latency: "12ms", ex: { x: -130, y: -36, rotation: -8 } },
  { number: "02", name: "Check & Clean", sub: "Validate", latency: "24ms", ex: { x: -70, y: 94, rotation: 6 } },
  { number: "03", name: "Smart Reply", sub: "AI Agent", latency: "185ms", ex: { x: 0, y: -72, rotation: -4 } },
  { number: "04", name: "AI Phone Call", sub: "Voice", latency: "340ms", ex: { x: 80, y: 86, rotation: 7 } },
  { number: "05", name: "List Updated", sub: "CRM + WhatsApp", latency: "85ms", ex: { x: 160, y: -52, rotation: -6 } },
];

export default function DeconstructionSequence() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* Desktop: pinned, scrubbed explode -> reassemble. */
      mm.add("(min-width: 768px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".decon-pin",
            start: "top top+=96",
            end: "+=160%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        });

        /* Phase 1 — explode apart, connectors fade, DECONSTRUCTION label in. */
        tl.to(
          ".decon-chip",
          {
            x: (i) => NODES[i].ex.x,
            y: (i) => NODES[i].ex.y,
            rotation: (i) => NODES[i].ex.rotation,
            duration: 1,
            stagger: 0.06,
            ease: "power2.inOut",
          },
          0
        );
        tl.to(".decon-connector", { opacity: 0, scaleX: 0.3, duration: 0.5, ease: "power1.in" }, 0);
        tl.fromTo(
          ".decon-phase-decon",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          0.2
        );
        tl.fromTo(
          ".decon-spec",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 },
          0.55
        );

        /* Hold, then swap the label. */
        tl.to(".decon-phase-decon", { opacity: 0, y: -18, duration: 0.3 }, 1.2);
        tl.to(".decon-spec", { opacity: 0, duration: 0.25 }, 1.2);

        /* Phase 2 — reassemble, connectors redraw, REBORN. */
        tl.to(
          ".decon-chip",
          { x: 0, y: 0, rotation: 0, duration: 1, stagger: 0.05, ease: "power2.inOut" },
          1.45
        );
        tl.to(".decon-connector", { opacity: 1, scaleX: 1, duration: 0.6, ease: "power2.out" }, 1.95);
        tl.fromTo(
          ".decon-phase-reborn",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          2.15
        );
        tl.fromTo(
          ".decon-reborn-word",
          { opacity: 0, scale: 1.18 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
          2.15
        );
        tl.fromTo(".decon-glow", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 2.15);

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      /* Mobile: no pin — staggered reveal of the assembled chain. */
      mm.add("(max-width: 767px)", () => {
        const tween = gsap.from(".decon-chip", {
          opacity: 0,
          y: 26,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".decon-stage",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      /* Fonts/images can shift layout after mount — re-measure pins. */
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      const t = setTimeout(() => ScrollTrigger.refresh(), 1200);
      return () => {
        window.removeEventListener("load", onLoad);
        clearTimeout(t);
        mm.revert();
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="deconstruction"
      ref={sectionRef}
      className="blueprint-grid relative overflow-hidden border-b border-slate-800/60 bg-[#050505]"
    >
      <div className="relative max-w-6xl w-full mx-auto px-6 pt-16 pb-8">
        <div className="space-y-2">
          <div className="section-label">
            <b>INTERLUDE</b> The Machine, Taken Apart
          </div>
          <h2 className="section-title text-3xl md:text-5xl text-white">
            Deconstructed. Then Reborn.
          </h2>
          <p className="text-slate-400 text-sm max-w-lg">
            Every system I build comes apart into five parts — then back
            together as one machine that never sleeps. Scroll to pull it apart.
          </p>
        </div>
      </div>

      {/* Pinned stage (desktop) / static stage (mobile). On desktop the
          stage fills the viewport below the nav pill and the content is
          vertically centred, so the exploded chips never slide under it. */}
      <div className="decon-pin relative md:min-h-[calc(100vh-96px)] md:flex md:flex-col md:justify-center">
        <div className="decon-stage relative max-w-6xl w-full mx-auto px-6 pb-16 pt-2 md:pt-6">
          {/* Teal grid floor, like the video's exploded-view floor. */}
          <div className="decon-floor absolute inset-x-6 top-0 bottom-0 pointer-events-none" aria-hidden="true" />
          {/* Cyan glow behind the reassembled chain. */}
          <div
            className="decon-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[55%] rounded-full pointer-events-none opacity-0 hidden md:block"
            style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.16), transparent 65%)" }}
            aria-hidden="true"
          />

          {/* Phase labels — crossfaded by the scroll timeline (desktop only). */}
          <div className="relative h-12 md:h-16 mb-2 md:mb-10 hidden md:block" aria-hidden="true">
            <div className="decon-phase-decon absolute left-0 top-0 opacity-0">
              <div className="font-mono text-[11px] tracking-[0.3em] text-neon-400 uppercase">
                01 / Deconstruction
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Five parts, floating free. Every part, a purpose.
              </div>
            </div>
            <div className="decon-phase-reborn absolute left-0 top-0 opacity-0">
              <div className="font-mono text-[11px] tracking-[0.3em] text-neon-400 uppercase">
                02 / Reborn
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Reassembled — one system, running on its own.
              </div>
            </div>
          </div>

          {/* Mobile caption (the phase labels are desktop-only). */}
          <p className="md:hidden font-mono text-[11px] tracking-[0.25em] text-neon-400 uppercase mb-4">
            01 / Deconstruction &rarr; 02 / Reborn
          </p>

          {/* The workflow chain — explodes apart on scroll (desktop). */}
          <div className="relative flex flex-col md:flex-row items-stretch md:items-center gap-0">
            {NODES.map((node, i) => (
              <div key={node.number} className="contents">
                <div className="decon-chip relative shrink-0 w-full md:w-[168px] rounded-xl border border-slate-700/80 bg-[#0a0a0a]/90 backdrop-blur px-4 py-3.5 shadow-[0_0_24px_rgba(0,0,0,0.6)] will-change-transform">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-neon-400">{node.number}</span>
                    <span className="font-mono text-[10px] text-slate-500">{node.latency}</span>
                  </div>
                  <div className="text-white font-semibold text-sm mt-1.5 leading-tight">{node.name}</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">{node.sub}</div>
                  <div className="mt-2.5 h-px bg-gradient-to-r from-neon-400/70 to-transparent" />
                </div>
                {i < NODES.length - 1 && (
                  <div
                    className="decon-connector mx-auto md:mx-0 w-px h-7 md:h-px md:w-auto md:flex-1 bg-gradient-to-b md:bg-gradient-to-r from-neon-400/70 via-neon-400/40 to-neon-400/70 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Floating spec callouts — visible while exploded (desktop only). */}
          <div className="relative h-10 mt-6 hidden md:block" aria-hidden="true">
            <span className="decon-spec absolute left-[4%] top-0 font-mono text-[11px] text-neon-300 opacity-0">
              12ms — entry
            </span>
            <span className="decon-spec absolute left-[26%] top-6 font-mono text-[11px] text-neon-300 opacity-0">
              185ms — the AI thinks
            </span>
            <span className="decon-spec absolute left-[48%] top-0 font-mono text-[11px] text-neon-300 opacity-0">
              340ms — the call
            </span>
            <span className="decon-spec absolute left-[88%] top-6 font-mono text-[11px] text-neon-300 opacity-0">
              85ms — synced
            </span>
          </div>

          {/* Giant REBORN word — appears at the end of the sequence. */}
          <div
            className="decon-reborn-word relative mt-2 md:mt-4 text-center opacity-0 hidden md:block select-none"
            aria-hidden="true"
          >
            <span className="font-heading uppercase leading-none text-[clamp(64px,10vw,150px)] text-transparent [-webkit-text-stroke:1.5px_rgba(34,211,238,0.55)]">
              Reborn.
            </span>
          </div>

          <p className="relative text-center font-mono text-[10px] tracking-[0.3em] text-slate-500 uppercase mt-6 hidden md:block">
            Scroll — the workflow comes apart, then back together
          </p>
        </div>
      </div>
    </section>
  );
}
