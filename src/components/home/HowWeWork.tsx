"use client";

import { useCallback, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ } from "@/lib/motion";
import { getLenis } from "@/lib/scroll";
import { HOW } from "@/content/home";
import { AGENT, COL, HowArt, PIECES, PW, ROWS } from "./HowArt";

const STEPS = HOW.steps;
const pad = (n: number) => String(n).padStart(2, "0");

/** Where each stage sits on the drawing's timeline (4 units long). */
const STAGE_AT = [0.2, 1.25, 2.25, 3.9];
const stageFromTime = (t: number) => (t < 0.78 ? 0 : t < 1.78 ? 1 : t < 2.78 ? 2 : 3);

/**
 * Builds the drawing's timeline: scattered notes (Discover) line up into a plan
 * (Design), the plan becomes solid (Build), then it runs (Launch & support).
 * Only transforms and opacity. Start states are set here, so the markup can stay
 * the finished diagram for reduced motion.
 */
function buildArt(svg: SVGSVGElement, tl: gsap.core.Timeline) {
  const q = (k: string) => Array.from(svg.querySelectorAll<SVGElement>(`[data-h="${k}"]`));
  const pieces = q("piece");

  gsap.set(pieces, {
    x: (i: number) => PIECES[i].scatter[0],
    y: (i: number) => PIECES[i].scatter[1],
    rotation: (i: number) => PIECES[i].scatter[2],
    transformOrigin: "50% 50%",
  });
  gsap.set(q("scribble"), { opacity: 1 });
  gsap.set(q("label"), { opacity: 0 });
  gsap.set(q("plan"), { opacity: 1, scaleX: 0, transformOrigin: "0% 50%" });
  gsap.set(q("wire"), { scaleX: 0, transformOrigin: "0% 50%" });
  gsap.set([q("agent-plan"), q("agent"), q("bar"), q("lit"), q("week")].flat(), { opacity: 0 });
  gsap.set(q("agent-title"), { opacity: 0, y: 6 });
  gsap.set(q("weeks"), { opacity: 0, y: 10 });

  // Discover -> Design: the notes line up, the jobs get names, the wires are pencilled in.
  tl.to(pieces, { x: (i: number) => COL[PIECES[i].group], y: (i: number) => ROWS[PIECES[i].row], rotation: 0, duration: 0.45, stagger: 0.012 }, 0.5)
    .to(q("scribble"), { opacity: 0, duration: 0.2, ease: "none" }, 0.7)
    .to(q("label"), { opacity: 1, duration: 0.25, ease: "none" }, 0.78)
    .to(q("agent-plan"), { opacity: 1, duration: 0.25, ease: "none" }, 0.72)
    .to(q("agent-title"), { opacity: 1, y: 0, duration: 0.3, ease: ease.arrive }, 0.78)
    .to(q("plan"), { scaleX: 1, duration: 0.3, stagger: 0.015 }, 0.8)
    // Design -> Build: pencil becomes wire, the agent becomes a real block.
    .to(q("plan"), { opacity: 0, duration: 0.2, ease: "none" }, 1.55)
    .to(q("wire"), { scaleX: 1, duration: 0.35, stagger: 0.015 }, 1.58)
    .to(q("agent"), { opacity: 1, duration: 0.3, ease: "none" }, 1.6)
    .to(q("agent-plan"), { opacity: 0, duration: 0.3, ease: "none" }, 1.6)
    .to(q("bar"), { opacity: 1, duration: 0.25, stagger: 0.04, ease: "none" }, 1.75)
    // Build -> Launch: results light up and the first four weeks tick by.
    .to(q("weeks"), { opacity: 1, y: 0, duration: 0.3, ease: ease.arrive }, 2.55)
    .to(q("lit"), { opacity: 1, duration: 0.3, stagger: 0.05, ease: "none" }, 2.6);
  q("week").forEach((w, i) => tl.to(w, { opacity: 1, duration: 0.12, ease: "none" }, 3 + i * 0.25));
  tl.to({}, { duration: 0.01 }, 3.99);

  // While launched, messages run every wire: in, through the agent, out.
  const msgs = q("msg");
  const run = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.4 });
  const toAgent = AGENT.x - (COL.in + PW);
  const through = toAgent + AGENT.w;
  const toOut = COL.out - (COL.in + PW);
  msgs.forEach((m, r) => {
    const at = r * 0.38;
    run.set(m, { x: 0, opacity: 0 }, at)
      .to(m, { opacity: 1, duration: 0.1 }, at)
      .to(m, { x: toAgent, duration: 0.55, ease: "power1.in" }, at)
      .set(m, { x: through }, ">")
      .to(m, { x: toOut, duration: 0.55, ease: "power1.out" }, ">0.12")
      .to(m, { opacity: 0, duration: 0.12 }, ">");
  });
  return { run, msgs };
}

/**
 * How we work. Desktop with motion: pinned; scrolling scrubs the drawing through
 * the four stages while the list and the detail box follow. Phones and tablets:
 * the drawing sticks above the steps and moves to each stage as its step arrives,
 * or when it's tapped. Reduced motion: every step open, the finished diagram.
 */
export function HowWeWork() {
  const root = useRef<HTMLElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false);
  const shown = useRef(0);
  const goStage = useRef<(i: number) => void>(() => {});

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const svg = art.current!.querySelector("svg")!;

      // The drawing's timeline exists from the start (the pin drives it), but its tweens are
      // only built as the section comes within a screen of view: building them measures a
      // hundred SVG shapes, which shouldn't cost anything while the page is first loading.
      const withArt = (onStage: (i: number) => void) => {
        const tl = gsap.timeline({ paused: true, defaults: { ease: ease.shutter } });
        tl.to({}, { duration: 4 }, 0);
        let art: ReturnType<typeof buildArt> | null = null;
        let current = -1;
        let visible = false;
        const sync = () => {
          if (!art) return;
          const live = current === 3 && visible && !document.hidden;
          if (live && art.run.paused()) art.run.restart();
          if (!live && !art.run.paused()) {
            art.run.pause();
            gsap.set(art.msgs, { opacity: 0 });
          }
        };
        const ensure = () => {
          if (art) return;
          art = buildArt(svg, tl);
          // Replay up to where the scroll already is, so tweens record their start values in order.
          const p = tl.progress();
          tl.progress(0, true).progress(p);
          sync();
        };
        tl.eventCallback("onUpdate", () => {
          gsap.set(fill.current, { scaleY: tl.progress() });
          const s = stageFromTime(tl.time());
          if (s !== current) {
            current = s;
            onStage(s);
            sync();
          }
        });
        const warm = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom+=100%",
          end: "bottom top-=100%",
          onToggle: (self) => self.isActive && ensure(),
        });
        if (warm.isActive) ensure();
        const io = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          sync();
        });
        io.observe(svg);
        document.addEventListener("visibilitychange", sync);
        const stop = () => {
          warm.kill();
          io.disconnect();
          document.removeEventListener("visibilitychange", sync);
          art?.run.kill();
          tl.kill();
        };
        return { tl, stop, ensure };
      };

      mm.add(MQ.full, () => {
        const details = gsap.utils.toArray<HTMLElement>(".hw-detail", root.current);
        gsap.set(details, { autoAlpha: (i: number) => (i === 0 ? 1 : 0) });
        setPinned(true);
        const { tl, stop } = withArt(setStep);
        const st = ScrollTrigger.create({
          id: "pin-how",
          trigger: root.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 3.2,
          pin: true,
          anticipatePin: 1,
          scrub: 1,
          animation: tl,
          invalidateOnRefresh: true,
        });
        goStage.current = (i) => {
          const s = ScrollTrigger.getById("pin-how");
          if (s) getLenis()?.scrollTo(s.start + (STAGE_AT[i] / 4) * (s.end - s.start), { duration: 1.1 });
        };
        return () => {
          st.kill();
          stop();
          setPinned(false);
          goStage.current = () => {};
        };
      });

      mm.add(MQ.compact, () => {
        const { tl, stop, ensure } = withArt(setStep);
        const to = (i: number) => {
          ensure();
          return tl.tweenTo(STAGE_AT[i], { duration: 0.9, ease: "power2.inOut" });
        };
        const triggers = gsap.utils.toArray<HTMLElement>(".hw-step", root.current).map((li, i) =>
          ScrollTrigger.create({
            trigger: li,
            start: "top 62%",
            end: "bottom 62%",
            onToggle: (self) => self.isActive && to(i),
          })
        );
        goStage.current = to;
        return () => {
          triggers.forEach((t) => t.kill());
          stop();
          goStage.current = () => {};
        };
      });

      // Header and steps rise in once, in every mode that allows motion.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current!.querySelectorAll(".hw-rise"), {
          y: 28,
          autoAlpha: 0,
          duration: dur.slow,
          ease: ease.arrive,
          stagger: 0.06,
          scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // Pinned mode: swap the detail box. Old text lifts away, new text rises in.
  useGSAP(
    () => {
      if (!pinned) return;
      const prev = shown.current;
      shown.current = step;
      if (prev === step) return;
      const details = gsap.utils.toArray<HTMLElement>(".hw-detail", root.current);
      const out = details[prev];
      const next = details[step];
      if (out) {
        gsap.to(out.querySelectorAll(".hw-in"), { y: -10, autoAlpha: 0, duration: 0.22, ease: ease.leave, overwrite: true });
        gsap.to(out, { autoAlpha: 0, duration: 0.01, delay: 0.23, overwrite: true });
      }
      gsap.set(next, { autoAlpha: 1, overwrite: true });
      gsap.fromTo(
        next.querySelectorAll(".hw-in"),
        { y: 18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: dur.base, ease: ease.arrive, stagger: 0.06, delay: 0.1, overwrite: true }
      );
    },
    { dependencies: [step, pinned], scope: root }
  );

  const pick = useCallback((i: number) => {
    setStep(i);
    goStage.current(i);
  }, []);

  return (
    <section id="how" ref={root} className={`hw ${pinned ? "is-pinned" : ""}`} aria-labelledby="how-title">
      <div className="wrap hw-inner">
        <header className="hw-head">
          <h2 id="how-title" className="t-h2 hw-rise">
            {HOW.title}
          </h2>
          <p className="t-lead hw-rise">{HOW.lead}</p>
        </header>

        <div className="hw-body">
          <div ref={art} className="hw-art hw-rise">
            <HowArt />
          </div>

          <div className="hw-steps">
            <div className="hw-rail" aria-hidden="true">
              <i ref={fill} />
            </div>
            <ol className="hw-list">
              {STEPS.map((s, i) => (
                <li key={s.name} className={`hw-step ${step === i ? "is-active" : ""}`}>
                  <h3 className="hw-h hw-rise">
                    <button type="button" className="hw-btn" aria-current={step === i ? "step" : undefined} onClick={() => pick(i)}>
                      <span className="hw-n t-data" aria-hidden="true">
                        {pad(i + 1)}
                      </span>
                      <span className="hw-name">{s.name}</span>
                      <span className="hw-when t-data">{s.when}</span>
                    </button>
                  </h3>
                  <div className="hw-detail">
                    <p className="hw-does hw-in">{s.does}</p>
                    <p className="hw-gets hw-in">
                      <span className="hw-gets-label">{HOW.getsLabel}</span>
                      {s.gets}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
