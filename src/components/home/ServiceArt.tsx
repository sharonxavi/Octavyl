"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ease } from "@/lib/motion";
import type { ServiceArt as ArtKind } from "@/content/home";

/**
 * One drawing per service, all built the same way: a source on the left, the
 * same agent square in the middle, a result on the right. While the art is the
 * active one, a small message square runs the wires on a loop. The markup is
 * the finished state, so reduced motion and no-JS see the whole story at once.
 *
 * Geometry is in 480 x 300 units; the viewBox crops to the drawn band (y 40 to 224).
 * The agent sits at 212..268 x 112..168.
 */

type Props = { kind: ArtKind; active: boolean };

const AX = 212; // agent left edge
const AR = 268; // agent right edge
const CY = 140; // centre line

export function ServiceArt({ kind, active }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const activeRef = useRef(active);
  const syncRef = useRef<() => void>(() => {});

  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = LOOPS[kind](svg);
        let visible = false;
        let running = false;
        const sync = () => {
          const run = activeRef.current && visible && !document.hidden;
          if (run === running) return;
          running = run;
          if (run) tl.restart();
          else tl.pause();
        };
        syncRef.current = sync;
        const io = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            sync();
          },
          { threshold: 0.15 }
        );
        io.observe(svg);
        document.addEventListener("visibilitychange", sync);
        return () => {
          io.disconnect();
          document.removeEventListener("visibilitychange", sync);
          syncRef.current = () => {};
          tl.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  useEffect(() => {
    activeRef.current = active;
    syncRef.current();
  }, [active]);

  return (
    <svg ref={ref} className="sv-art" viewBox="0 40 480 184" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {ART[kind]}
      <Agent />
    </svg>
  );
}

/* ------------------------------------------------------------------ parts */

function Agent() {
  return (
    <g>
      <rect className="a-agent" x={AX} y={112} width={56} height={56} />
      <rect className="a-pulse" data-a="pulse" x={235} y={135} width={10} height={10} />
      <rect className="a-core" data-a="core" x={235} y={135} width={10} height={10} />
      <text className="a-t" x={240} y={194} textAnchor="middle">
        Agent
      </text>
    </g>
  );
}

/** The travelling message. Drawn at its start point; the loop moves it with x/y. */
const Msg = ({ x, y = CY }: { x: number; y?: number }) => (
  <rect className="a-msg" data-a="msg" x={x - 3} y={y - 3} width={6} height={6} />
);

const Tick = ({ d, data }: { d: string; data?: string }) => (
  <path className="a-tick" data-a={data} d={d} pathLength={1} strokeDasharray="1" strokeDashoffset="0" />
);

/* Calendar cells for the booking art: 4 x 3, two taken earlier, one to be booked. */
const CAL_X = 304;
const CAL_Y = 95;
const CELL_W = 36;
const CELL_H = 26;
const GAP = 6;
const TAKEN = new Set(["0-1", "2-0", "1-3"]);

const ART: Record<ArtKind, React.ReactNode> = {
  booking: (
    <g>
      <text className="a-t" x={12} y={100}>
        WhatsApp, 9:40pm
      </text>
      <path className="a-card" d="M12,116 H178 V164 H44 L30,178 V164 H12 Z" />
      <text className="a-t a-hi" x={24} y={145}>
        Can I come at 5?
      </text>
      <path className="a-wire" d={`M178,${CY} H${AX}`} />
      <path className="a-wire" d={`M${AR},${CY} H${CAL_X}`} />
      {Array.from({ length: 12 }, (_, n) => {
        const col = n % 4;
        const row = Math.floor(n / 4);
        const key = `${row}-${col}`;
        return (
          <rect
            key={key}
            className={TAKEN.has(key) ? "a-taken" : "a-cell"}
            x={CAL_X + col * (CELL_W + GAP)}
            y={CAL_Y + row * (CELL_H + GAP)}
            width={CELL_W}
            height={CELL_H}
          />
        );
      })}
      <rect
        className="a-sig"
        data-a="cell"
        x={CAL_X + 2 * (CELL_W + GAP)}
        y={CAL_Y + 1 * (CELL_H + GAP)}
        width={CELL_W}
        height={CELL_H}
      />
      <Tick data="tick" d={`M${CAL_X + 2 * (CELL_W + GAP) + 11},${CY} l5,5 l10,-10`} />
      <text className="a-t" x={CAL_X} y={210}>
        Tomorrow, 5pm
      </text>
      <Msg x={178} />
    </g>
  ),

  reception: (
    <g>
      <rect className="a-card a-edge" x={24} y={98} width={48} height={84} />
      <path className="a-wire" d="M40,108 H56" />
      <path className="a-wire" d="M44,172 H52" />
      {[14, 30, 42, 26, 12].map((h, i) => (
        <rect key={i} className="a-bar" data-a="bar" x={88 + i * 10} y={CY - h / 2} width={4} height={h} />
      ))}
      <text className="a-t" x={24} y={210}>
        Incoming call
      </text>
      <path className="a-wire" d={`M144,${CY} H${AX}`} />
      <path className="a-wire" d={`M${AR},${CY} H286 V92 H304 M286,${CY} V188 H304`} />
      {/* Answered: most calls */}
      <rect className="a-card" x={304} y={64} width={164} height={56} />
      <rect className="a-ring" data-a="ans-on" x={304} y={64} width={164} height={56} />
      <text className="a-t a-hi" x={316} y={85}>
        Answered
      </text>
      <rect className="a-line" data-a="ans-line" x={316} y={97} width={124} height={3} />
      <rect className="a-line" data-a="ans-line" x={316} y={107} width={86} height={3} />
      {/* Sent to you: the unusual case */}
      <rect className="a-card" x={304} y={166} width={164} height={46} />
      <rect className="a-ring" data-a="fwd-on" x={304} y={166} width={164} height={46} />
      <text className="a-t a-hi" x={316} y={186}>
        Sent to you
      </text>
      <rect className="a-line" data-a="fwd-line" x={316} y={198} width={64} height={3} />
      <Msg x={144} />
    </g>
  ),

  whatsapp: (
    <g>
      <text className="a-t" x={12} y={66}>
        Messages
      </text>
      {[96, 140, 184].map((y, i) => (
        <g key={y} data-a="in">
          <path className="a-card" d={`M12,${y - 15} H144 V${y + 15} H26 L18,${y + 21} V${y + 15} H12 Z`} />
          <rect className="a-line" x={24} y={y - 2} width={[92, 70, 104][i]} height={3} />
        </g>
      ))}
      <path className="a-wire" d={`M144,96 H178 V184 M144,184 H178 M144,${CY} H${AX}`} />
      <path className="a-wire" d={`M${AR},${CY} H336 M302,96 V184 M302,96 H336 M302,184 H336`} />
      <text className="a-t" x={336} y={66}>
        Replies, from your number
      </text>
      {[96, 140, 184].map((y, i) => (
        <g key={y} data-a="out">
          <path className="a-card a-reply" d={`M336,${y - 15} H468 V${y + 15} H462 L454,${y + 21} V${y + 15} H336 Z`} />
          <rect className="a-line a-line-hi" x={348} y={y - 2} width={[70, 84, 58][i]} height={3} />
          <path className="a-tk" d={`M430,${y + 1} l3,3 l6,-6 M436,${y + 1} l3,3 l6,-6`} />
          <path className="a-tk a-tk-on" data-a="ticks" d={`M430,${y + 1} l3,3 l6,-6 M436,${y + 1} l3,3 l6,-6`} />
        </g>
      ))}
      <Msg x={144} y={96} />
    </g>
  ),

  leads: (
    <g>
      <text className="a-t" x={12} y={66}>
        Instagram ad
      </text>
      <rect className="a-card" x={12} y={76} width={136} height={128} />
      <rect className="a-faint" x={22} y={86} width={116} height={46} />
      <rect className="a-line a-line-hi" x={22} y={142} width={88} height={4} />
      <rect className="a-line" x={22} y={152} width={62} height={3} />
      <rect className="a-card a-edge" x={22} y={168} width={78} height={26} />
      <rect className="a-ring" data-a="press" x={22} y={168} width={78} height={26} />
      <text className="a-t a-hi" x={32} y={186}>
        Enquire
      </text>
      <path className="a-wire" d={`M148,${CY} H${AX}`} />
      <path className="a-wire" d={`M${AR},${CY} H440`} />
      {[
        [300, "Day 1"],
        [350, "Day 3"],
        [450, "Day 7"],
      ].map(([x, label], i) => (
        <g key={label as string}>
          <rect className="a-node" x={(x as number) - 5} y={CY - 5} width={10} height={10} />
          <rect className="a-dawn" data-a="day" x={(x as number) - 5} y={CY - 5} width={10} height={10} />
          <text className="a-t" x={x as number} y={170} textAnchor={i === 2 ? "middle" : "middle"}>
            {label}
          </text>
        </g>
      ))}
      <g data-a="booked">
        <rect className="a-sig" x={440} y={CY - 10} width={20} height={20} />
        <Tick data="booked-tick" d={`M444,${CY} l4,4 l8,-8`} />
      </g>
      <text className="a-t a-hi" data-a="booked-label" x={450} y={118} textAnchor="middle">
        Booked
      </text>
      <Msg x={148} />
    </g>
  ),

  workflow: (
    <g>
      <text className="a-t" x={28} y={58}>
        Today&apos;s bills
      </text>
      <path className="a-card" d="M28,70 H112 L132,90 V210 H28 Z" />
      <path className="a-wire" d="M112,70 V90 H132" />
      <rect className="a-line a-line-hi" x={40} y={84} width={44} height={4} />
      {[106, 120, 134, 148].map((y, i) => (
        <g key={y}>
          <rect className="a-line" x={40} y={y} width={[46, 38, 50, 34][i]} height={3} />
          <rect className="a-line" x={100} y={y} width={20} height={3} />
        </g>
      ))}
      <path className="a-wire" d="M40,168 H120" />
      <rect className="a-line a-line-hi" x={40} y={180} width={34} height={4} />
      <rect className="a-line a-line-hi" x={96} y={180} width={24} height={4} />
      <path className="a-wire" d={`M132,${CY} H${AX}`} />
      <path className="a-wire" d={`M${AR},${CY} H304`} />
      <text className="a-t" x={304} y={70}>
        Your sheet
      </text>
      <rect className="a-card" x={304} y={80} width={164} height={20} />
      {[316, 372, 424].map((x) => (
        <rect key={x} className="a-line" x={x} y={89} width={28} height={3} />
      ))}
      {[104, 132, 160].map((y) => (
        <g key={y}>
          <rect className="a-card" x={304} y={y} width={164} height={24} />
          <g data-a="row">
            <rect className="a-dawn" x={312} y={y + 9} width={6} height={6} />
            <rect className="a-line a-line-hi" x={326} y={y + 11} width={38} height={3} />
            <rect className="a-line" x={372} y={y + 11} width={40} height={3} />
            <rect className="a-line" x={424} y={y + 11} width={30} height={3} />
          </g>
        </g>
      ))}
      <g data-a="summary">
        <rect className="a-sig" x={304} y={205} width={6} height={6} />
        <text className="a-t a-hi" x={318} y={212}>
          Summary at 9pm
        </text>
      </g>
      <Msg x={132} />
    </g>
  ),
};

/* ------------------------------------------------------------------ loops */

type Loop = (svg: SVGSVGElement) => gsap.core.Timeline;

const all = (svg: SVGSVGElement, key: string) => Array.from(svg.querySelectorAll<SVGElement>(`[data-a="${key}"]`));
const one = (svg: SVGSVGElement, key: string) => svg.querySelector<SVGElement>(`[data-a="${key}"]`)!;

const loop = () => gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.5, defaults: { ease: "none" } });

/** A message leg: appear, travel through the given points (offsets from its start), vanish. */
function leg(msg: SVGElement, points: Array<[number, number]>, speed = 230) {
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  const [x0, y0] = points[0];
  tl.set(msg, { x: x0, y: y0 });
  tl.to(msg, { opacity: 1, duration: 0.12 });
  let [px, py] = points[0];
  for (const [x, y] of points.slice(1)) {
    const d = Math.hypot(x - px, y - py);
    tl.to(msg, { x, y, duration: Math.max(0.12, d / speed) });
    px = x;
    py = y;
  }
  tl.to(msg, { opacity: 0, duration: 0.1 });
  return tl;
}

/** The agent takes the message: its core swells once and a ring leaves it. */
function think(svg: SVGSVGElement) {
  const tl = gsap.timeline();
  tl.fromTo(one(svg, "pulse"), { scale: 1, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 3.2, opacity: 0, duration: 0.55, ease: ease.arrive }, 0);
  tl.fromTo(one(svg, "core"), { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.4, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1 }, 0);
  return tl;
}

const LOOPS: Record<ArtKind, Loop> = {
  booking(svg) {
    const msg = one(svg, "msg");
    const cell = one(svg, "cell");
    const tick = one(svg, "tick");
    const tl = loop();
    tl.set(cell, { opacity: 0, scale: 0.55, transformOrigin: "50% 50%" }, 0);
    tl.set(tick, { opacity: 1, strokeDashoffset: 1 }, 0);
    tl.add(leg(msg, [[0, 0], [AX - 178, 0]]), 0.3);
    tl.add(think(svg), ">-0.02");
    tl.add(leg(msg, [[AR - 178, 0], [CAL_X - 178, 0]]), ">-0.3");
    tl.to(cell, { opacity: 1, scale: 1, duration: 0.5, ease: ease.settle }, ">-0.04");
    tl.to(tick, { strokeDashoffset: 0, duration: 0.35, ease: ease.arrive }, "<0.22");
    tl.to([cell, tick], { opacity: 0, duration: 0.4, ease: ease.leave }, "+=2.2");
    return tl;
  },

  reception(svg) {
    const msg = one(svg, "msg");
    const bars = all(svg, "bar");
    const ansOn = one(svg, "ans-on");
    const ansLines = all(svg, "ans-line");
    const fwdOn = one(svg, "fwd-on");
    const fwdLine = all(svg, "fwd-line");
    const tl = loop();
    tl.set(bars, { scaleY: 0.3, transformOrigin: "50% 50%" }, 0);
    tl.set([ansLines, fwdLine], { scaleX: 0, transformOrigin: "0% 50%" }, 0);
    tl.set([ansOn, fwdOn], { opacity: 0 }, 0);
    const ring = (at: number | string) =>
      tl.to(bars, { scaleY: 1, duration: 0.16, ease: "sine.inOut", stagger: { each: 0.05, repeat: 5, yoyo: true } }, at);
    // A normal call: answered.
    ring(0.2);
    tl.add(leg(msg, [[0, 0], [AX - 144, 0]]), ">-0.1");
    tl.add(think(svg), ">-0.02");
    tl.add(leg(msg, [[AR - 144, 0], [286 - 144, 0], [286 - 144, -48], [304 - 144, -48]]), ">-0.3");
    tl.to(ansOn, { opacity: 1, duration: 0.3, ease: ease.arrive }, ">-0.04");
    tl.to(ansLines, { scaleX: 1, duration: 0.45, ease: ease.arrive, stagger: 0.12 }, "<0.1");
    // An unusual one: passed to the owner.
    ring("+=0.6");
    tl.add(leg(msg, [[0, 0], [AX - 144, 0]]), ">-0.1");
    tl.add(think(svg), ">-0.02");
    tl.add(leg(msg, [[AR - 144, 0], [286 - 144, 0], [286 - 144, 48], [304 - 144, 48]]), ">-0.3");
    tl.to(fwdOn, { opacity: 1, duration: 0.3, ease: ease.arrive }, ">-0.04");
    tl.to(fwdLine, { scaleX: 1, duration: 0.45, ease: ease.arrive }, "<0.1");
    tl.to(bars, { scaleY: 1, duration: 0.3, ease: ease.arrive }, "<");
    tl.to([ansOn, fwdOn, ansLines, fwdLine], { opacity: 0, duration: 0.4, ease: ease.leave }, "+=2");
    tl.set([ansLines, fwdLine], { opacity: 1, scaleX: 0 });
    return tl;
  },

  whatsapp(svg) {
    const msg = one(svg, "msg");
    const ins = all(svg, "in");
    const outs = all(svg, "out");
    const ticks = all(svg, "ticks");
    const rows = [96 - 140, 0, 184 - 140];
    const tl = loop();
    // The message is drawn at the first bubble's edge; offsets are from there.
    const base = 96 - 140;
    tl.set([ins, outs], { opacity: 0, y: 6 }, 0);
    tl.set(ticks, { opacity: 0 }, 0);
    rows.forEach((dy, i) => {
      const at = i === 0 ? 0.2 : ">-0.1";
      tl.to(ins[i], { opacity: 1, y: 0, duration: 0.35, ease: ease.arrive }, at);
      const ry = dy - base;
      const pts: Array<[number, number]> =
        dy === 0
          ? [[0, ry], [AX - 144, ry]]
          : [[0, ry], [178 - 144, ry], [178 - 144, -base], [AX - 144, -base]];
      tl.add(leg(msg, pts, 300), ">-0.05");
      tl.add(think(svg), ">-0.02");
      const out: Array<[number, number]> =
        dy === 0
          ? [[AR - 144, -base], [336 - 144, -base]]
          : [[AR - 144, -base], [302 - 144, -base], [302 - 144, ry], [336 - 144, ry]];
      tl.add(leg(msg, out, 300), ">-0.3");
      tl.to(outs[i], { opacity: 1, y: 0, duration: 0.35, ease: ease.arrive }, ">-0.04");
    });
    tl.to(ticks, { opacity: 1, duration: 0.25, ease: ease.arrive, stagger: 0.3 }, "+=0.3");
    tl.to([ins, outs], { opacity: 0, duration: 0.4, ease: ease.leave }, "+=1.8");
    return tl;
  },

  leads(svg) {
    const msg = one(svg, "msg");
    const press = one(svg, "press");
    const days = all(svg, "day");
    const booked = one(svg, "booked");
    const bookedTick = one(svg, "booked-tick");
    const bookedLabel = one(svg, "booked-label");
    const tl = loop();
    tl.set(press, { opacity: 0 }, 0);
    tl.set(days, { opacity: 0 }, 0);
    tl.set(booked, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, 0);
    tl.set(bookedTick, { strokeDashoffset: 1 }, 0);
    tl.set(bookedLabel, { opacity: 0, y: 4 }, 0);
    tl.to(press, { opacity: 1, duration: 0.14, yoyo: true, repeat: 1 }, 0.2);
    tl.add(leg(msg, [[0, 0], [AX - 148, 0]]), ">");
    tl.add(think(svg), ">-0.02");
    // Day 1, then a wait, day 3, a longer wait, day 7.
    const stops = [300, 350, 440];
    let from = AR;
    stops.forEach((x, i) => {
      tl.add(leg(msg, [[from - 148, 0], [x - 148 - (i === 2 ? 0 : 5), 0]], 200), i === 0 ? ">-0.3" : "+=0.35");
      if (i < 2) tl.to(days[i], { opacity: 1, duration: 0.3, ease: ease.arrive }, ">-0.05");
      from = x;
    });
    tl.to(days[2], { opacity: 1, duration: 0.2 }, ">-0.05");
    tl.to(booked, { opacity: 1, scale: 1, duration: 0.55, ease: ease.settle }, "<");
    tl.to(bookedTick, { strokeDashoffset: 0, duration: 0.35, ease: ease.arrive }, "<0.2");
    tl.to(bookedLabel, { opacity: 1, y: 0, duration: 0.4, ease: ease.arrive }, "<");
    tl.to([days, booked, bookedLabel], { opacity: 0, duration: 0.4, ease: ease.leave }, "+=2");
    return tl;
  },

  workflow(svg) {
    const msg = one(svg, "msg");
    const rows = all(svg, "row");
    const summary = one(svg, "summary");
    const tl = loop();
    tl.set(rows, { opacity: 0, x: -8 }, 0);
    tl.set(summary, { opacity: 0, x: -6 }, 0);
    rows.forEach((row, i) => {
      tl.add(leg(msg, [[0, 0], [AX - 132, 0]], 300), i === 0 ? 0.25 : "+=0.15");
      tl.add(think(svg), ">-0.02");
      tl.add(leg(msg, [[AR - 132, 0], [304 - 132, 0]], 300), ">-0.3");
      tl.to(row, { opacity: 1, x: 0, duration: 0.4, ease: ease.arrive }, ">-0.04");
    });
    tl.to(summary, { opacity: 1, x: 0, duration: 0.45, ease: ease.arrive }, "+=0.4");
    tl.to([rows, summary], { opacity: 0, duration: 0.4, ease: ease.leave }, "+=2");
    return tl;
  },
};
