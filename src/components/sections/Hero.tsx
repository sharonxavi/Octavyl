"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ, stagger } from "@/lib/motion";
import { clock, toMin } from "@/lib/time";
import { onAnchorClick } from "@/lib/scroll";
import { HERO } from "@/content/site";
import type { Incoming, Trade } from "@/content/trades";
import { useTrade } from "../TradeProvider";
import { TradeSelect } from "../TradeSelect";
import { BookCall } from "../BookCall";
import { RegisterView, type RowView } from "../Register";

type Filled = { entry: string; status: string; history: string };

const STATUS: Record<string, string> = {
  WhatsApp: "WhatsApp",
  "Missed call": "Missed-call reply",
  Instagram: "Instagram",
  "Ad click": "Offer page",
};

const hoursText = (t: Trade) => {
  const f = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h % 12 === 0 ? 12 : h % 12}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
  };
  return `Open ${f(t.open)} to ${f(t.close)}`;
};

const entryFor = (msg: Incoming): Filled => {
  const confirmed = clock(toMin(msg.at) + 2);
  return {
    entry: `${msg.who}, ${msg.what}`,
    status: `${STATUS[msg.channel] ?? msg.channel}, ${confirmed}`,
    history: `${msg.channel} ${msg.at}. Replied in 20 seconds. Confirmed ${confirmed}.`,
  };
};

/** What the register looks like once every request has landed: used for reduced motion. */
const fullFor = (t: Trade) => {
  const filled: Record<number, Filled> = {};
  const free = t.register.map((r, i) => (r.who ? -1 : i)).filter((i) => i >= 0);
  t.incoming.filter((m) => m.to === "slot").forEach((m, k) => {
    if (free[k] !== undefined) filled[free[k]] = entryFor(m);
  });
  return { filled, needs: t.incoming.filter((m) => m.to === "needs").length };
};

export function Hero() {
  const { trade, tradeId } = useTrade();
  const root = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const panelOuter = useRef<HTMLDivElement>(null);
  const panelInner = useRef<HTMLDivElement>(null);
  const noteWrap = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const noteChannel = useRef<HTMLParagraphElement>(null);
  const noteSaid = useRef<HTMLParagraphElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const needsRef = useRef<HTMLSpanElement>(null);
  const shutterRef = useRef<HTMLDivElement>(null);
  const rowEls = useRef<(HTMLLIElement | null)[]>([]);

  const [filled, setFilled] = useState<Record<number, Filled>>({});
  const [needs, setNeeds] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [openHistory, setOpenHistory] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Mutable mirrors for the stream, which runs outside React's render cycle.
  const s = useRef({
    trade,
    filled: {} as Record<number, Filled>,
    needs: 0,
    msg: 0,
    pinned: null as number | null,
    target: null as number | "needs" | null,
    flight: { p: 0 },
    bend: { x: 0, y: 0 },
    pointer: { x: 0, y: 0, inside: false, near: false, fine: false },
    tl: null as gsap.core.Timeline | null,
    next: null as gsap.core.Tween | null,
    drawing: false,
    running: false,
    started: false,
    justFilled: null as number | null,
  });
  // Mirror the chosen trade for the stream (an effect, not render, so React can re-render freely).
  useLayoutEffect(() => {
    s.current.trade = trade;
  }, [trade]);
  // The stream schedules its own next step; the ref always points at the latest version.
  const stepRef = useRef<() => void>(() => {});

  // Start the live stream once the CSS entrance has settled.
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MQ.reduce);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    const vis = () => setTabVisible(document.visibilityState === "visible");
    vis();
    document.addEventListener("visibilitychange", vis);
    s.current.pointer.fine = window.matchMedia(MQ.finePointer).matches;
    return () => {
      mq.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  /* ---------------------------------------------------------------- stream */

  const freeRows = useCallback(() => {
    const st = s.current;
    return st.trade.register.map((r, i) => (!r.who && !st.filled[i] ? i : -1)).filter((i) => i >= 0);
  }, []);

  const chooseRow = useCallback((): number | null => {
    const st = s.current;
    const free = freeRows();
    if (!free.length) return null;
    if (st.pinned !== null && free.includes(st.pinned)) return st.pinned;
    if (st.pointer.inside) {
      let best = free[0];
      let bestD = Infinity;
      for (const i of free) {
        const r = rowEls.current[i]?.getBoundingClientRect();
        if (!r) continue;
        const d = Math.abs(r.top + r.height / 2 - st.pointer.y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    }
    return free[0];
  }, [freeRows]);

  const markTarget = useCallback(() => {
    const t = s.current.target;
    rowEls.current.forEach((el, i) => el?.classList.toggle("is-target", t === i));
  }, []);

  /** Draws the one route in flight, from the message to its slot, bent toward the pointer. */
  const draw = useCallback(() => {
    const st = s.current;
    const path = pathRef.current;
    const hero = root.current;
    const note = noteRef.current;
    if (!path || !hero || !note || st.target === null) return;
    const endEl = st.target === "needs" ? needsRef.current : rowEls.current[st.target];
    if (!endEl) return;
    const h = hero.getBoundingClientRect();
    const n = note.getBoundingClientRect();
    const e = endEl.getBoundingClientRect();
    const wide = window.innerWidth >= 1024;
    let sx: number, sy: number, c1x: number, c1y: number, c2x: number, c2y: number;
    const ex = e.left - h.left + (st.target === "needs" ? -6 : 10);
    const ey = e.top - h.top + e.height / 2;
    if (wide) {
      sx = n.right - h.left + 10;
      sy = n.top - h.top + n.height / 2;
      const dx = ex - sx;
      c1x = sx + dx * 0.55;
      c1y = sy;
      c2x = ex - dx * 0.5;
      c2y = ey;
    } else {
      sx = n.left - h.left + 4;
      sy = n.bottom - h.top + 6;
      const dy = ey - sy;
      c1x = sx - 28;
      c1y = sy + dy * 0.45;
      c2x = ex - 28;
      c2y = ey - dy * 0.35;
    }
    // Pull toward the pointer when it is close: the route bends to where you point.
    if (st.pointer.fine && wide) {
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      const px = st.pointer.x - h.left;
      const py = st.pointer.y - h.top;
      const dist = Math.hypot(px - mx, py - my);
      const k = st.pointer.near && dist < 260 ? 0.45 * (1 - dist / 520) : 0;
      st.bend.x += ((px - mx) * k - st.bend.x) * 0.14;
      st.bend.y += ((py - my) * k - st.bend.y) * 0.14;
    } else {
      st.bend.x *= 0.86;
      st.bend.y *= 0.86;
    }
    c1x += st.bend.x;
    c1y += st.bend.y;
    c2x += st.bend.x * 0.6;
    c2y += st.bend.y * 0.6;
    path.setAttribute("d", `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`);
    path.style.strokeDashoffset = String(1 - st.flight.p);
  }, []);

  const startDrawing = useCallback(() => {
    if (s.current.drawing) return;
    s.current.drawing = true;
    gsap.ticker.add(draw);
  }, [draw]);
  const stopDrawing = useCallback(() => {
    s.current.drawing = false;
    gsap.ticker.remove(draw);
  }, [draw]);

  const land = useCallback((msg: Incoming) => {
    const st = s.current;
    if (st.target === "needs") {
      st.needs += 1;
      setNeeds(st.needs);
      if (needsRef.current) gsap.fromTo(needsRef.current, { scale: 1.08 }, { scale: 1, duration: dur.base, ease: ease.settle });
    } else if (typeof st.target === "number") {
      st.filled = { ...st.filled, [st.target]: entryFor(msg) };
      st.justFilled = st.target;
      if (st.pinned === st.target) st.pinned = null;
      setFilled(st.filled);
    }
    pathRef.current?.classList.add("is-landed");
  }, []);

  const step = useCallback(() => {
    const st = s.current;
    if (!st.running) return;
    const t = st.trade;
    const msg = t.incoming[st.msg];
    const full = !msg || (msg.to === "slot" && freeRows().length === 0);
    if (full) {
      // Tomorrow is full: hold, then turn the page so the hero never goes still.
      st.next = gsap.delayedCall(2.6, () => {
        const entries = rowEls.current
          .map((el, i) => (st.filled[i] ? el?.querySelector(".entry-inner") : null))
          .filter(Boolean) as Element[];
        gsap.to(entries, {
          autoAlpha: 0,
          x: -8,
          duration: dur.quick,
          ease: ease.leave,
          stagger: stagger.row,
          onComplete: () => {
            st.filled = {};
            st.needs = 0;
            st.msg = 0;
            setFilled({});
            setNeeds(0);
            gsap.set(entries, { clearProps: "opacity,visibility,transform" });
            st.next = gsap.delayedCall(0.9, () => stepRef.current());
          },
        });
      });
      return;
    }
    st.msg += 1;
    if (noteChannel.current) noteChannel.current.textContent = `${msg.channel}, ${msg.at}`;
    if (noteSaid.current) noteSaid.current.textContent = msg.said;
    if (clockRef.current) clockRef.current.textContent = msg.at;

    const path = pathRef.current;
    st.flight.p = 0;
    const tl = gsap.timeline();
    st.tl = tl;
    tl.fromTo(noteRef.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: dur.quick, ease: ease.arrive })
      .add(() => {
        st.target = msg.to === "needs" ? "needs" : chooseRow();
        if (st.target === null) return;
        path?.classList.remove("is-landed");
        gsap.set(path, { opacity: 1 });
        markTarget();
        startDrawing();
      }, "+=0.5")
      .to(st.flight, {
        p: 1,
        duration: 0.8,
        ease: ease.shutter,
        onUpdate() {
          // While the route is still early, it follows the pointer to a different free slot.
          if (msg.to === "slot" && st.flight.p < 0.6 && st.pinned === null && st.pointer.inside) {
            const next = chooseRow();
            if (next !== null && next !== st.target) {
              st.target = next;
              markTarget();
            }
          }
        },
      })
      .add(() => land(msg))
      .to(path, { opacity: 0, duration: dur.base, ease: ease.leave }, "+=0.45")
      .to(noteRef.current, { autoAlpha: 0, y: -8, duration: dur.quick, ease: ease.leave }, "<")
      .add(() => {
        stopDrawing();
        st.target = null;
        markTarget();
        st.next = gsap.delayedCall(0.9, () => stepRef.current());
      });
  }, [chooseRow, freeRows, land, markTarget, startDrawing, stopDrawing]);
  useLayoutEffect(() => {
    stepRef.current = step;
  }, [step]);

  const setRunning = useCallback(
    (run: boolean) => {
      const st = s.current;
      if (run === st.running) return;
      st.running = run;
      if (run) {
        if (!st.started) {
          st.started = true;
          st.next = gsap.delayedCall(0.6, step);
        } else {
          st.tl?.resume();
          st.next?.resume();
          if (st.target !== null) startDrawing();
        }
      } else {
        st.tl?.pause();
        st.next?.pause();
        stopDrawing();
      }
    },
    [startDrawing, step, stopDrawing]
  );

  const resetStream = useCallback(() => {
    const st = s.current;
    st.tl?.kill();
    st.next?.kill();
    st.tl = null;
    st.next = null;
    stopDrawing();
    st.filled = {};
    st.needs = 0;
    st.msg = 0;
    st.pinned = null;
    st.target = null;
    st.started = false;
    st.running = false;
    markTarget();
    if (pathRef.current) gsap.set(pathRef.current, { opacity: 0 });
    if (noteRef.current) gsap.set(noteRef.current, { autoAlpha: 0 });
    if (clockRef.current) clockRef.current.textContent = "21:40";
    setFilled({});
    setNeeds(0);
    setOpenHistory(null);
  }, [markTarget, stopDrawing]);

  // Trade change: start tomorrow's register over for the new trade.
  const firstTrade = useRef(true);
  useEffect(() => {
    if (firstTrade.current) {
      firstTrade.current = false;
      return;
    }
    resetStream();
  }, [tradeId, resetStream]);

  // Run only while the hero is on screen, the tab is visible and nobody paused it.
  useEffect(() => {
    setRunning(loaded && !reduced && !userPaused && onScreen && tabVisible);
  }, [loaded, reduced, userPaused, onScreen, tabVisible, tradeId, setRunning]);

  useEffect(
    () => () => {
      const st = s.current;
      st.tl?.kill();
      st.next?.kill();
      gsap.ticker.remove(draw);
    },
    [draw]
  );

  // A newly booked slot sets its text like a stamp.
  useLayoutEffect(() => {
    const i = s.current.justFilled;
    if (i === null) return;
    s.current.justFilled = null;
    const row = rowEls.current[i];
    const inner = row?.querySelector(".entry-inner");
    if (!row || !inner) return;
    gsap.fromTo(inner, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: dur.quick, ease: ease.shutter });
    gsap.fromTo(row, { backgroundColor: "rgba(143,176,255,0.16)" }, { backgroundColor: "rgba(143,176,255,0)", duration: 1.1, ease: ease.arrive, clearProps: "backgroundColor" });
  }, [filled]);

  /* ------------------------------------------------------ load and scroll */

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // The entrance itself is CSS (globals.css, "hero entrance"), so it plays on first
      // paint without waiting for JavaScript. Only the scroll exit lives here.
      mm.add(MQ.full, () => {
        {
          gsap.to(copyRef.current, {
            y: () => -window.innerHeight * 0.06,
            autoAlpha: 0.35,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.5 },
          });
          gsap.to(panelOuter.current, {
            y: -64,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.5 },
          });
        }
      });

      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => setOnScreen(self.isActive),
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  // Pointer: where you point decides where the next request is booked.
  useEffect(() => {
    const hero = root.current;
    const panel = panelInner.current;
    if (!hero || !panel) return;
    const st = s.current;
    const fine = window.matchMedia(`${MQ.finePointer} and (prefers-reduced-motion: no-preference)`).matches;
    if (!fine) return;
    const noteX = gsap.quickTo(noteWrap.current, "x", { duration: 0.6, ease: "power3.out" });
    const noteY = gsap.quickTo(noteWrap.current, "y", { duration: 0.6, ease: "power3.out" });
    const panX = gsap.quickTo(panel, "x", { duration: 0.6, ease: "power3.out" });
    const panY = gsap.quickTo(panel, "y", { duration: 0.6, ease: "power3.out" });
    let raf = 0;
    const apply = () => {
      raf = 0;
      const h = hero.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      st.pointer.inside = st.pointer.x > p.left - 80 && st.pointer.x < p.right && st.pointer.y > p.top && st.pointer.y < p.bottom;
      st.pointer.near = st.pointer.y > h.top && st.pointer.y < h.bottom;
      if (window.innerWidth >= 1024) {
        const nx = (st.pointer.x - (h.left + h.width / 2)) / h.width;
        const ny = (st.pointer.y - (h.top + h.height / 2)) / h.height;
        // Messages travel above the book: they move with you, the book moves against you.
        noteX(nx * 20);
        noteY(ny * 20);
        panX(-nx * 8);
        panY(-ny * 8);
      }
    };
    const onMove = (e: PointerEvent) => {
      st.pointer.x = e.clientX;
      st.pointer.y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      st.pointer.inside = false;
      st.pointer.near = false;
      noteX(0);
      noteY(0);
      panX(0);
      panY(0);
    };
    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  /* ----------------------------------------------------------------- view */

  const view = useMemo(() => (reduced ? fullFor(trade) : { filled, needs }), [reduced, trade, filled, needs]);
  const rows: RowView[] = trade.register.map((r, i) => {
    if (r.who) return { time: r.time, state: "preset", entry: `${r.who}, ${r.what}`, status: "Booked earlier", history: "Booked earlier by phone." };
    const f = view.filled[i];
    if (f) return { time: r.time, state: "booked", entry: f.entry, status: f.status, history: f.history };
    return { time: r.time, state: "free" };
  });

  return (
    <section id="top" ref={root} className="hero relative" aria-labelledby="hero-title">
      <svg className="route-layer" aria-hidden="true">
        <path ref={pathRef} pathLength={1} d="M0 0" style={{ opacity: 0 }} />
      </svg>
      <div className="wrap grid12 min-h-[100dvh] items-center gap-y-10 pt-[calc(var(--nav-h)+28px)] pb-12 lg:pb-14">
        <div ref={copyRef} className="relative z-[2] col-span-4 lg:col-span-7">
          <h1 id="hero-title" className="t-h1">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="h1-line-a block lg:whitespace-nowrap">{HERO.lines[0]}</span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="h1-line-b block lg:whitespace-nowrap">{HERO.lines[1]}</span>
            </span>
          </h1>
          <p className="hero-sub t-lead mt-6 max-w-[40ch] text-chalk lg:mt-8">{HERO.sub}</p>
          <div className="hero-actions mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 lg:mt-10">
            <BookCall wide />
            <a href="#night" onClick={onAnchorClick} className="link text-[1.0625rem]">
              {HERO.secondary}
            </a>
          </div>
        </div>

        <div className="relative col-span-4 lg:col-span-5 lg:col-start-8">
          <div ref={noteWrap} className="hero-note-wrap">
            <div ref={noteRef} className="note" aria-hidden="true">
              <p ref={noteChannel} className="note-channel" />
              <p ref={noteSaid} className="note-said" />
            </div>
          </div>
          <div ref={panelOuter} className="hero-panel">
            <div ref={panelInner} role="region" aria-label="Sample appointment register">
              <p className="sr-only">
                A sample register. Messages that arrive after closing are booked into tomorrow&apos;s free slots automatically.
              </p>
              <RegisterView
                id="hero-reg"
                rows={rows}
                clock="21:40"
                hours={hoursText(trade)}
                needs={view.needs}
                interactive={!reduced}
                openHistory={openHistory}
                shutterRef={shutterRef}
                clockRef={clockRef}
                needsRef={needsRef}
                rowRef={(i, el) => {
                  rowEls.current[i] = el;
                }}
                onFreeClick={(i) => {
                  s.current.pinned = i;
                  rowEls.current.forEach((el, k) => el?.classList.toggle("is-target", k === i));
                }}
                onBookedClick={(i) => setOpenHistory((v) => (v === i ? null : i))}
                header={
                  <>
                    Tomorrow at {trade.article} <TradeSelect label="Choose a trade" />
                  </>
                }
                footerEnd={
                  !reduced && (
                    <button
                      type="button"
                      className="quiet-toggle"
                      aria-pressed={userPaused}
                      onClick={() => setUserPaused((v) => !v)}
                    >
                      {userPaused ? "Play" : "Pause"}
                    </button>
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
