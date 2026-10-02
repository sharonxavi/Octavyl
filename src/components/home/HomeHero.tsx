"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { MQ, scrub } from "@/lib/motion";
import { HOME_HERO } from "@/content/home";
import { TRADE_IDS, TRADES } from "@/content/trades";
import { BookCall } from "@/components/BookCall";
import { Magnetic } from "@/components/Magnetic";
import { TransitionLink } from "@/components/shell/PageTransition";

// The terrain is the one heavy piece on the page. It never renders on the
// server and is only fetched once the browser is idle after first paint.
// Browsers without WebGL get the older 2D route field instead.
const HeroTerrain = dynamic(() => import("./HeroTerrain").then((m) => m.HeroTerrain), { ssr: false });
const HeroField = dynamic(() => import("./HeroField").then((m) => m.HeroField), { ssr: false });

type LogEntry = { id: number; at: string; channel: string; outcome: string };

/**
 * The log beside the terrain: the sample trades' messages, one trade after
 * another, on a clock that moves forward a few minutes per message.
 */
const LOG_SOURCE = (() => {
  const steps = [3, 7, 2, 5, 9, 4, 6, 3, 8];
  let minutes = 21 * 60 + 38;
  const out: Omit<LogEntry, "id">[] = [];
  for (let i = 0; i < 6; i++) {
    TRADE_IDS.forEach((id, j) => {
      const m = TRADES[id].incoming[i];
      minutes = (minutes + steps[(i * 5 + j) % steps.length]) % (24 * 60);
      const at = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      out.push({ at, channel: m.channel, outcome: m.to === "slot" ? `Booked: ${m.what}` : "Sent to you" });
    });
  }
  return out;
})();
const LOG_ROWS = 3;

/**
 * Home hero. The headline, sub and actions arrive with CSS keyframes (hero.css),
 * so they paint before hydration. Behind them, the signal terrain: a field of
 * lines that rises to the right, carries messages, and answers the cursor.
 */
export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const [fieldOn, setFieldOn] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [log, setLog] = useState<LogEntry[]>(() =>
    LOG_SOURCE.slice(0, 2)
      .map((e, i) => ({ ...e, id: i }))
      .reverse()
  );
  const next = useRef(2);
  const pushLog = useCallback(() => {
    const i = next.current++;
    const e = LOG_SOURCE[i % LOG_SOURCE.length];
    setLog((rows) => [{ ...e, id: i }, ...rows].slice(0, LOG_ROWS));
  }, []);
  const noWebgl = useCallback(() => setWebgl(false), []);
  // A field that's drawn once (reduced motion, no GPU) doesn't answer the cursor, so its hint goes.
  const [still, setStill] = useState(false);

  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const start = () => setFieldOn(true);
    // After the page has loaded and the browser is idle, so the field never competes
    // with hydration. Safari has no requestIdleCallback: a short timeout does the job there.
    const ric = typeof window.requestIdleCallback === "function";
    const schedule = () => {
      if (ric) idle = window.requestIdleCallback(start, { timeout: 1500 });
      else timer = window.setTimeout(start, 450);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (ric && idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Hand-off: as the story starts, the headline lags the page a little and the map recedes.
      mm.add(MQ.full, () => {
        const scrollTrigger = {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: scrub.drift,
          invalidateOnRefresh: true,
        };
        gsap.to(copy.current, { y: () => (root.current?.offsetHeight ?? 0) * 0.12, ease: "none", scrollTrigger });
        gsap.to(field.current, { opacity: 0.35, ease: "none", scrollTrigger: { ...scrollTrigger } });
      });

      // The scroll cue has done its job once the page has moved.
      ScrollTrigger.create({
        start: 40,
        end: "max",
        onToggle: (self) => cue.current?.classList.toggle("is-away", self.isActive),
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="top" ref={root} className="hh" aria-labelledby="top-title">
      <div ref={field} className={`hh-field ${webgl ? "" : "is-2d"}`} aria-hidden="true">
        {fieldOn && (webgl ? <HeroTerrain host={root} onMessage={pushLog} onFail={noWebgl} onStill={setStill} /> : <HeroField host={root} />)}
      </div>

      <div className="hh-body wrap">
        <div ref={copy} className="hh-copy">
          <h1 id="top-title" className="hh-title">
            <span className="hh-mask">
              <span className="hh-line hh-line-1">{HOME_HERO.lines[0]}</span>
            </span>{" "}
            <span className="hh-mask">
              <span className="hh-line hh-line-2">{HOME_HERO.lines[1]}</span>
            </span>
          </h1>
          <p className="hh-sub t-lead">{HOME_HERO.sub}</p>
          <div className="hh-actions">
            <BookCall wide />
            <Magnetic className="w-full sm:w-auto">
              <TransitionLink href="/solutions" className="btn btn-quiet btn-lg-mobile" data-cursor="link">
                <span data-magnet-label className="inline-block">
                  {HOME_HERO.secondary}
                </span>
              </TransitionLink>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* The log and the cue are decoration: screen readers get the page's words instead. */}
      <div className="hh-foot wrap" aria-hidden="true">
        <div ref={cue} className="hh-cue">
          <span className="hh-cue-rule">
            <i />
          </span>
          <span className="t-small text-dim">{HOME_HERO.cue}</span>
        </div>
        <div className="hh-log">
          <p className="hh-log-label t-small">
            <i className="hh-log-live" />
            {HOME_HERO.log.label}
          </p>
          <ol className="hh-log-list">
            {log.map((e) => (
              <li key={e.id} className="hh-log-row">
                <span className="hh-log-at t-data">{e.at}</span>
                <span className="hh-log-ch">{e.channel}</span>
                <span className="hh-log-out">{e.outcome}</span>
              </li>
            ))}
          </ol>
          <p className="hh-log-hint t-small" hidden={still}>
            <span className="hh-hint-fine">{HOME_HERO.log.hintFine}</span>
            <span className="hh-hint-touch">{HOME_HERO.log.hintTouch}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
