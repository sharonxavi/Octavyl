"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { MQ } from "@/lib/motion";

/**
 * The route field: a street map of one business's messages.
 * Customers sit on the corners of a loose street grid. Every second or so one
 * of them sends a message, which runs along the streets to the nearest agent,
 * the agent answers (a single pulse), and the message carries on to a booked
 * slot near the right edge. Message, agent, booking: the whole company in one loop.
 *
 * Fine pointer: the streets bend away from the cursor. Touch: a slow drift and
 * fewer messages. Reduced motion: one still frame with three routes lit.
 * The loop shares GSAP's ticker, and stops when the hero is off screen or the tab is hidden.
 */
export function HeroField({ host }: { host: React.RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const hostEl = host.current ?? el?.parentElement;
    if (!el || !hostEl) return;
    const reduce = window.matchMedia(MQ.reduce);
    const fine = window.matchMedia(MQ.finePointer);
    let field = createField(el, hostEl, { reduced: reduce.matches, fine: fine.matches });
    const restart = () => {
      field.destroy();
      field = createField(el, hostEl, { reduced: reduce.matches, fine: fine.matches });
    };
    reduce.addEventListener("change", restart);
    fine.addEventListener("change", restart);
    return () => {
      reduce.removeEventListener("change", restart);
      fine.removeEventListener("change", restart);
      field.destroy();
    };
  }, [host]);

  return <canvas ref={canvas} className="hh-canvas" />;
}

/* ------------------------------------------------------------------ engine */

type Rgb = readonly [number, number, number];
type Mode = { reduced: boolean; fine: boolean };
type Msg = {
  on: boolean;
  path: Int32Array; // node indices, customer → agent → slot
  edge: Int32Array; // edge between path[k] and path[k + 1]
  cum: Float32Array; // distance along the route at path[k]
  len: number;
  agentAt: number; // index in path of the agent
  slot: number;
  head: number;
  tail: number;
  hold: number;
  passed: boolean;
  k: number; // last edge looked up, so lookups walk instead of search
};
export type FieldStats = {
  frames: number;
  running: boolean;
  ms: number;
  nodes: number;
  edges: number;
  inFlight: number;
  mode: string;
};

const SEED = 0x0c7a51;
const MAX_PATH = 72;
const TAU = Math.PI * 2;

/** mulberry32: small, fast, seeded, so the streets are the same on every visit. */
function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const token = (css: CSSStyleDeclaration, name: string, fallback: string): Rgb => {
  let v = css.getPropertyValue(name).trim();
  if (!/^#[0-9a-f]{6}$/i.test(v)) v = fallback;
  const n = parseInt(v.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb = (c: Rgb, a = 1) => `rgb(${c[0]} ${c[1]} ${c[2]} / ${a})`;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

function createField(canvas: HTMLCanvasElement, host: HTMLElement, mode: Mode) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const css = getComputedStyle(document.documentElement);
  const rule = token(css, "--color-rule", "#1c2f63");
  const dim = token(css, "--color-dim", "#8d9cc4");
  const signal = token(css, "--color-signal", "#3f6fff");
  const dawn = token(css, "--color-dawn", "#8fb0ff");
  // Streets brighten a little where the cursor bends them: rule → dim, in four steps.
  const streetInk = [0, 0.16, 0.32, 0.5].map((t) => rgb(mix(rule, dim, t)));
  const customerInk = rgb(dim, 0.72);
  const signalInk = rgb(signal);
  const signalSoft = rgb(signal, 0.45);
  const dawnInk = rgb(dawn);
  const dawnSoft = rgb(dawn, 0.6);

  const stats: FieldStats = { frames: 0, running: false, ms: 0, nodes: 0, edges: 0, inFlight: 0, mode: "" };
  stats.mode = mode.reduced ? "still" : mode.fine ? "pointer" : "drift";
  const dev = process.env.NODE_ENV !== "production";
  if (dev) (window as unknown as { __hhField?: FieldStats }).__hhField = stats;

  // Geometry, rebuilt on resize.
  let W = 0;
  let H = 0;
  let dpr = 1;
  let phone = false;
  let n = 0;
  let bx = new Float32Array(0); // base position
  let by = new Float32Array(0);
  let ox = new Float32Array(0); // current offset (pointer push or drift)
  let oy = new Float32Array(0);
  let ph = new Float32Array(0); // drift phases
  let kind = new Uint8Array(0); // 0 customer, 1 agent, 2 booked slot
  let pulse = new Float32Array(0);
  let m = 0;
  let ea = new Int32Array(0);
  let eb = new Int32Array(0);
  let emx = new Float32Array(0); // base midpoint
  let emy = new Float32Array(0);
  let eox = new Float32Array(0); // midpoint offset
  let eoy = new Float32Array(0);
  let ecx = new Float32Array(0); // this frame's control point
  let ecy = new Float32Array(0);
  let ink = new Uint8Array(0);
  let agents = new Int32Array(0);
  let slots = new Int32Array(0);
  let sources = new Int32Array(0);
  // Shortest routes: next hop (and the edge taken) toward the nearest agent, and toward each slot.
  let hopA = new Int32Array(0);
  let hopAE = new Int32Array(0);
  let distA = new Float32Array(0);
  let hopS: Int32Array[] = [];
  let hopSE: Int32Array[] = [];
  let distS: Float32Array[] = [];

  const maxInFlight = mode.fine ? 5 : 3;
  const msgs: Msg[] = Array.from({ length: 5 }, () => ({
    on: false,
    path: new Int32Array(MAX_PATH),
    edge: new Int32Array(MAX_PATH),
    cum: new Float32Array(MAX_PATH),
    len: 0,
    agentAt: 0,
    slot: -1,
    head: 0,
    tail: 0,
    hold: 0,
    passed: false,
    k: 0,
  }));

  let time = 0;
  let spawnIn = 0.5;
  let speed = 230;
  let trail = 34;
  let push = 28;
  const reach = 180;
  let px = 0;
  let py = 0;
  let pOn = false;
  let built = false;

  /* ---------------------------------------------------------------- build */

  const dijkstra = (from: ArrayLike<number>, hop: Int32Array, hopE: Int32Array, dist: Float32Array, adjStart: Int32Array, adjNode: Int32Array, adjEdge: Int32Array, len: Float32Array) => {
    dist.fill(Infinity);
    hop.fill(-1);
    hopE.fill(-1);
    const done = new Uint8Array(n);
    for (let i = 0; i < from.length; i++) {
      dist[from[i]] = 0;
      hop[from[i]] = from[i];
    }
    for (;;) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) {
        if (!done[i] && dist[i] < best) {
          best = dist[i];
          u = i;
        }
      }
      if (u < 0) break;
      done[u] = 1;
      for (let a = adjStart[u]; a < adjStart[u + 1]; a++) {
        const v = adjNode[a];
        const d = best + len[adjEdge[a]];
        if (d < dist[v]) {
          dist[v] = d;
          hop[v] = u;
          hopE[v] = adjEdge[a];
        }
      }
    }
  };

  const build = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return false;
    W = w;
    H = h;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    phone = W < 768;
    speed = phone ? 150 : 230;
    trail = phone ? 30 : 40;
    push = phone ? 22 : 28;

    const r = rng(SEED);
    const sp = phone ? 90 : 110;
    // Columns start wide on the left and tighten toward the right, where the map is busiest.
    const xs: number[] = [];
    const lo = phone ? 1.12 : 1.38;
    const hi = phone ? 0.86 : 0.68;
    for (let x = -sp * 0.55; x < W + sp * 0.7; ) {
      xs.push(x);
      const u = Math.min(1, Math.max(0, x / W));
      x += sp * (lo + (hi - lo) * u);
    }
    const cols = xs.length;
    const rows = Math.ceil(H / sp) + 2;
    const y0 = (H - (rows - 1) * sp) / 2;
    n = cols * rows;
    bx = new Float32Array(n);
    by = new Float32Array(n);
    ox = new Float32Array(n);
    oy = new Float32Array(n);
    ph = new Float32Array(n * 2);
    kind = new Uint8Array(n);
    pulse = new Float32Array(n);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const gx = i > 0 && i < cols - 1 ? (xs[i + 1] - xs[i - 1]) / 2 : sp;
        bx[k] = xs[i] + (r() * 2 - 1) * 0.17 * gx;
        by[k] = y0 + j * sp + (r() * 2 - 1) * 0.17 * sp;
        ph[k * 2] = r() * TAU;
        ph[k * 2 + 1] = r() * TAU;
      }
    }

    // Streets: each corner to its right and lower neighbour, with about one in seven closed.
    const ea0: number[] = [];
    const eb0: number[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const right = r() >= 0.15;
        const down = r() >= 0.15;
        if (i + 1 < cols && right) {
          ea0.push(k);
          eb0.push(k + 1);
        }
        if (j + 1 < rows && down) {
          ea0.push(k);
          eb0.push(k + cols);
        }
      }
    }
    m = ea0.length;
    ea = Int32Array.from(ea0);
    eb = Int32Array.from(eb0);
    emx = new Float32Array(m);
    emy = new Float32Array(m);
    eox = new Float32Array(m);
    eoy = new Float32Array(m);
    ecx = new Float32Array(m);
    ecy = new Float32Array(m);
    ink = new Uint8Array(m);
    const elen = new Float32Array(m);
    const deg = new Int32Array(n + 1);
    for (let e = 0; e < m; e++) {
      const a = ea[e];
      const b = eb[e];
      emx[e] = ecx[e] = (bx[a] + bx[b]) / 2;
      emy[e] = ecy[e] = (by[a] + by[b]) / 2;
      elen[e] = Math.hypot(bx[b] - bx[a], by[b] - by[a]);
      deg[a + 1]++;
      deg[b + 1]++;
    }
    for (let i = 0; i < n; i++) deg[i + 1] += deg[i];
    const adjStart = deg;
    const fill = adjStart.slice(0, n);
    const adjNode = new Int32Array(m * 2);
    const adjEdge = new Int32Array(m * 2);
    for (let e = 0; e < m; e++) {
      adjNode[fill[ea[e]]] = eb[e];
      adjEdge[fill[ea[e]]++] = e;
      adjNode[fill[eb[e]]] = ea[e];
      adjEdge[fill[eb[e]]++] = e;
    }

    const inView = (k: number, pad: number) => bx[k] > pad && bx[k] < W - pad && by[k] > pad && by[k] < H - pad;

    // Agents: one per three-by-three block of corners, about one node in nine.
    const agentList: number[] = [];
    for (let bj = 0; bj < rows; bj += 3) {
      for (let bi = 0; bi < cols; bi += 3) {
        const cand: number[] = [];
        for (let dj = 0; dj < 3; dj++) {
          for (let di = 0; di < 3; di++) {
            const i = bi + di;
            const j = bj + dj;
            if (i < cols && j < rows && inView(j * cols + i, 14)) cand.push(j * cols + i);
          }
        }
        const pick = r();
        if (cand.length) {
          const k = cand[Math.floor(pick * cand.length)];
          kind[k] = 1;
          agentList.push(k);
        }
      }
    }

    // On phones the words fill the width, so the map only shows in a band along the bottom.
    const top = phone ? H * 0.64 : H * 0.1;
    const bottom = phone ? H * 0.95 : H * 0.92;

    // Booked slots: the corner closest to the right edge on every other row, like a column in a diary.
    const slotList: number[] = [];
    for (let j = 1; j < rows - 1; j++) {
      let best = -1;
      for (let i = cols - 1; i >= 0; i--) {
        const k = j * cols + i;
        if (kind[k] === 0 && inView(k, 18) && by[k] > top && by[k] < bottom) {
          best = k;
          break;
        }
      }
      if (best >= 0 && bx[best] > W - sp * 1.9) slotList.push(best);
    }
    slots = Int32Array.from(phone ? slotList.slice(0, 3) : slotList.filter((_, i) => i % 2 === (slotList.length > 5 ? 1 : 0)).slice(0, 5));
    slots.forEach((k) => (kind[k] = 2));
    agents = Int32Array.from(agentList);

    hopA = new Int32Array(n);
    hopAE = new Int32Array(n);
    distA = new Float32Array(n);
    dijkstra(agents, hopA, hopAE, distA, adjStart, adjNode, adjEdge, elen);
    hopS = [];
    hopSE = [];
    distS = [];
    for (let s = 0; s < slots.length; s++) {
      const hop = new Int32Array(n);
      const hopE = new Int32Array(n);
      const dist = new Float32Array(n);
      dijkstra([slots[s]], hop, hopE, dist, adjStart, adjNode, adjEdge, elen);
      hopS.push(hop);
      hopSE.push(hopE);
      distS.push(dist);
    }

    // Messages leave from customers the viewer can see, clear of the headline's left edge.
    const left = phone ? W * 0.04 : W * 0.3;
    const srcTop = phone ? H * 0.66 : H * 0.06;
    const src: number[] = [];
    for (let k = 0; k < n; k++) {
      if (kind[k] === 0 && bx[k] > left && bx[k] < W - 12 && by[k] > srcTop && by[k] < H * 0.95 && distA[k] < Infinity) src.push(k);
    }
    sources = Int32Array.from(src);

    for (const g of msgs) g.on = false;
    stats.nodes = n;
    stats.edges = m;
    built = true;
    return true;
  };

  /* ------------------------------------------------------------- messages */

  /** Plans a route: a customer, the shortest way to its nearest agent, then on to a booked slot. */
  const plan = (g: Msg, rand: () => number) => {
    if (!sources.length || !slots.length) return false;
    for (let tries = 0; tries < 18; tries++) {
      const c = sources[Math.floor(rand() * sources.length)];
      let len = 0;
      let v = c;
      g.path[len] = v;
      g.cum[len] = 0;
      len++;
      while (kind[v] !== 1 && len < MAX_PATH / 2) {
        g.edge[len - 1] = hopAE[v];
        v = hopA[v];
        if (v < 0) break;
        g.path[len++] = v;
      }
      if (v < 0 || kind[v] !== 1) continue;
      const hops = len - 1;
      if (hops < 2 || hops > 10) continue;
      g.agentAt = len - 1;
      // Mostly the nearest slot, sometimes the next one, so the diary fills along its length.
      let s1 = -1;
      let s2 = -1;
      for (let s = 0; s < slots.length; s++) {
        if (distS[s][v] === Infinity) continue;
        if (s1 < 0 || distS[s][v] < distS[s1][v]) {
          s2 = s1;
          s1 = s;
        } else if (s2 < 0 || distS[s][v] < distS[s2][v]) s2 = s;
      }
      if (s1 < 0) continue;
      const s = s2 >= 0 && rand() < 0.35 ? s2 : s1;
      const hop = hopS[s];
      const hopE = hopSE[s];
      let ok = true;
      while (v !== slots[s]) {
        if (len >= MAX_PATH) {
          ok = false;
          break;
        }
        g.edge[len - 1] = hopE[v];
        v = hop[v];
        g.path[len++] = v;
      }
      if (!ok || len - 1 - g.agentAt < 1) continue;
      for (let k = 1; k < len; k++) {
        const a = g.path[k - 1];
        const b = g.path[k];
        g.cum[k] = g.cum[k - 1] + Math.hypot(bx[b] - bx[a], by[b] - by[a]);
      }
      g.len = len;
      g.slot = slots[s];
      g.head = 0;
      g.tail = 0;
      g.hold = 0;
      g.passed = false;
      g.k = 0;
      g.on = true;
      return true;
    }
    return false;
  };

  let QX = 0;
  let QY = 0;
  /** Where a route is at distance d, following the streets as they bend this frame. */
  const pointAt = (g: Msg, d: number) => {
    let k = g.k;
    const last = g.len - 2;
    while (k < last && g.cum[k + 1] < d) k++;
    while (k > 0 && g.cum[k] > d) k--;
    g.k = k;
    const seg = g.cum[k + 1] - g.cum[k];
    let t = seg > 0 ? (d - g.cum[k]) / seg : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const e = g.edge[k];
    if (ea[e] !== g.path[k]) t = 1 - t;
    const a = ea[e];
    const b = eb[e];
    const u = 1 - t;
    QX = u * u * (bx[a] + ox[a]) + 2 * u * t * ecx[e] + t * t * (bx[b] + ox[b]);
    QY = u * u * (by[a] + oy[a]) + 2 * u * t * ecy[e] + t * t * (by[b] + oy[b]);
  };

  /* ---------------------------------------------------------------- frame */

  const update = (dt: number) => {
    time += dt;
    const k = 1 - Math.pow(0.86, dt * 60);
    const R2 = reach * reach;

    if (mode.fine) {
      for (let i = 0; i < n; i++) {
        let tx = 0;
        let ty = 0;
        if (pOn) {
          const dx = bx[i] - px;
          const dy = by[i] - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = 1 - d / reach;
            const s = (push * f * f * (3 - 2 * f)) / d;
            tx = dx * s;
            ty = dy * s;
          }
        }
        ox[i] += (tx - ox[i]) * k;
        oy[i] += (ty - oy[i]) * k;
      }
    } else {
      const amp = 3;
      for (let i = 0; i < n; i++) {
        ox[i] = amp * Math.sin(time * 0.5 + ph[i * 2]);
        oy[i] = amp * Math.cos(time * 0.42 + ph[i * 2 + 1]);
      }
    }

    for (let e = 0; e < m; e++) {
      const a = ea[e];
      const b = eb[e];
      if (mode.fine) {
        let tx = 0;
        let ty = 0;
        if (pOn) {
          const dx = emx[e] - px;
          const dy = emy[e] - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = 1 - d / reach;
            const s = (push * f * f * (3 - 2 * f)) / d;
            tx = dx * s;
            ty = dy * s;
          }
        }
        eox[e] += (tx - eox[e]) * k;
        eoy[e] += (ty - eoy[e]) * k;
      } else {
        eox[e] = (ox[a] + ox[b]) / 2;
        eoy[e] = (oy[a] + oy[b]) / 2;
      }
      // Control point chosen so the curve passes through the displaced midpoint.
      const ax = bx[a] + ox[a];
      const ay = by[a] + oy[a];
      const cx = bx[b] + ox[b];
      const cy = by[b] + oy[b];
      ecx[e] = 2 * (emx[e] + eox[e]) - (ax + cx) / 2;
      ecy[e] = 2 * (emy[e] + eoy[e]) - (ay + cy) / 2;
      if (mode.fine) {
        const mag = Math.abs(eox[e]) + Math.abs(eoy[e]);
        ink[e] = mag > push * 0.8 ? 3 : mag > push * 0.45 ? 2 : mag > push * 0.15 ? 1 : 0;
      }
    }

    // A new message every 0.8 to 1.4s (slower on touch), never more than a handful at once.
    spawnIn -= dt;
    if (spawnIn <= 0) {
      let active = 0;
      for (const g of msgs) if (g.on) active++;
      if (active < maxInFlight) {
        const g = msgs.find((x) => !x.on);
        if (g) plan(g, Math.random);
      }
      spawnIn = mode.fine ? 0.8 + Math.random() * 0.6 : 1.6 + Math.random() * 0.8;
    }

    let inFlight = 0;
    for (const g of msgs) {
      if (!g.on) continue;
      inFlight++;
      const step = speed * dt;
      const atAgent = g.cum[g.agentAt];
      const end = g.cum[g.len - 1];
      const before = g.head;
      if (!g.passed) {
        g.head = Math.min(atAgent, g.head + step);
        if (g.head >= atAgent) {
          if (g.hold === 0) pulse[g.path[g.agentAt]] = 1;
          g.hold += dt;
          // The agent holds the message just long enough to answer it.
          if (g.hold > 0.32 && g.tail >= atAgent - 0.5) g.passed = true;
        }
      } else {
        g.head = Math.min(end, g.head + step);
        if (g.head >= end && before < end) pulse[g.slot] = 1;
      }
      if (g.head > before) g.tail = Math.max(g.tail, g.head - trail);
      else g.tail = Math.min(g.head, g.tail + step * 1.3);
      if (g.passed && g.tail >= end - 0.5) g.on = false;
    }
    stats.inFlight = inFlight;

    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      if (pulse[a] > 0) pulse[a] = Math.max(0, pulse[a] - dt / 0.7);
    }
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (pulse[s] > 0) pulse[s] = Math.max(0, pulse[s] - dt / 1.8);
    }
  };

  const snap = (v: number) => Math.round(v * dpr) / dpr;

  const drawStreets = () => {
    ctx.lineWidth = 1;
    for (let level = 0; level < 4; level++) {
      let any = false;
      ctx.beginPath();
      for (let e = 0; e < m; e++) {
        if (ink[e] !== level) continue;
        any = true;
        const a = ea[e];
        const b = eb[e];
        ctx.moveTo(bx[a] + ox[a], by[a] + oy[a]);
        ctx.quadraticCurveTo(ecx[e], ecy[e], bx[b] + ox[b], by[b] + oy[b]);
      }
      if (any) {
        ctx.strokeStyle = streetInk[level];
        ctx.stroke();
      }
    }
  };

  const drawNodes = () => {
    // Customers: tiny dim squares.
    const cs = dpr >= 2 ? 2.5 : 3;
    ctx.fillStyle = customerInk;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (kind[i] !== 0) continue;
      ctx.rect(snap(bx[i] + ox[i] - cs / 2), snap(by[i] + oy[i] - cs / 2), cs, cs);
    }
    ctx.fill();

    // Booked slots: dawn squares that light when a message lands.
    ctx.fillStyle = dawnInk;
    ctx.strokeStyle = dawnInk;
    ctx.lineWidth = 1;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const p = pulse[s];
      const x = snap(bx[s] + ox[s]);
      const y = snap(by[s] + oy[s]);
      ctx.globalAlpha = 0.5 + 0.5 * p;
      ctx.fillRect(x - 2, y - 2, 4, 4);
      if (p > 0) {
        const size = 4 + 14 * (1 - p);
        ctx.globalAlpha = p * 0.8;
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;

    // Agents: signal outline squares; a single pulse when one answers.
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = signalInk;
    ctx.fillStyle = signalInk;
    ctx.beginPath();
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      ctx.rect(snap(bx[a] + ox[a]) - 3.5, snap(by[a] + oy[a]) - 3.5, 7, 7);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      const p = pulse[a];
      if (p <= 0) continue;
      const x = snap(bx[a] + ox[a]);
      const y = snap(by[a] + oy[a]);
      ctx.globalAlpha = p;
      ctx.fillRect(x - 3.5, y - 3.5, 7, 7);
      const size = 7 + 16 * (1 - p);
      ctx.globalAlpha = p * 0.7;
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  };

  const drawMessages = () => {
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    ctx.lineWidth = 1.5;
    for (const g of msgs) {
      if (!g.on) continue;
      const span = g.head - g.tail;
      if (span < 0.5) continue;
      // The tail is fainter than the front, so each light reads as moving one way.
      const mid = g.tail + span * 0.45;
      const steps = Math.max(2, Math.ceil(span / 6));
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        pointAt(g, g.tail + ((mid - g.tail) * s) / steps);
        if (s === 0) ctx.moveTo(QX, QY);
        else ctx.lineTo(QX, QY);
      }
      ctx.strokeStyle = signalSoft;
      ctx.stroke();
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        pointAt(g, mid + ((g.head - mid) * s) / steps);
        if (s === 0) ctx.moveTo(QX, QY);
        else ctx.lineTo(QX, QY);
      }
      ctx.strokeStyle = signalInk;
      ctx.stroke();
      pointAt(g, g.head);
      ctx.fillStyle = dawnInk;
      ctx.fillRect(QX - 1.5, QY - 1.5, 3, 3);
    }
  };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawStreets();
    drawNodes();
    drawMessages();
  };

  /** Reduced motion: the same map, still, with three finished routes drawn lit. */
  const drawStill = () => {
    draw();
    const r = rng(SEED + 7);
    const g = msgs[0];
    const used = new Set<number>();
    let lit = 0;
    for (let tries = 0; tries < 24 && lit < 3; tries++) {
      if (!plan(g, r) || used.has(g.slot) || used.has(g.path[g.agentAt])) continue;
      used.add(g.slot);
      used.add(g.path[g.agentAt]);
      lit++;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = signalInk;
      ctx.beginPath();
      ctx.moveTo(bx[g.path[0]], by[g.path[0]]);
      for (let k = 0; k < g.len - 1; k++) {
        const e = g.edge[k];
        const to = g.path[k + 1];
        ctx.quadraticCurveTo(ecx[e], ecy[e], bx[to], by[to]);
      }
      ctx.stroke();
      const a = g.path[g.agentAt];
      ctx.fillStyle = signalInk;
      ctx.fillRect(snap(bx[a]) - 3.5, snap(by[a]) - 3.5, 7, 7);
      const s = g.slot;
      ctx.fillStyle = dawnInk;
      ctx.fillRect(snap(bx[s]) - 2, snap(by[s]) - 2, 4, 4);
      ctx.lineWidth = 1;
      ctx.strokeStyle = dawnSoft;
      ctx.strokeRect(snap(bx[s]) - 6, snap(by[s]) - 6, 12, 12);
      const c = g.path[0];
      ctx.fillStyle = dawnInk;
      ctx.fillRect(snap(bx[c]) - 1.5, snap(by[c]) - 1.5, 3, 3);
    }
    g.on = false;
  };

  /* ------------------------------------------------------------ lifecycle */

  const tick = (_t: number, deltaMs: number) => {
    const t0 = performance.now();
    update(Math.min(deltaMs, 50) / 1000);
    draw();
    stats.frames++;
    stats.ms = stats.ms * 0.95 + (performance.now() - t0) * 0.05;
  };

  let onScreen = true;
  let tabVisible = document.visibilityState === "visible";
  let ticking = false;
  const sync = () => {
    const want = built && !mode.reduced && onScreen && tabVisible;
    if (want && !ticking) gsap.ticker.add(tick);
    else if (!want && ticking) gsap.ticker.remove(tick);
    ticking = want;
    stats.running = want;
  };

  let revealFrame = 0;
  const first = () => {
    if (!build()) return;
    if (mode.reduced) drawStill();
    else draw();
    revealFrame = requestAnimationFrame(() => canvas.classList.add("is-ready"));
    sync();
  };
  first();

  let lastW = W;
  let lastH = H;
  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === lastW && h === lastH && built) return;
      lastW = w;
      lastH = h;
      if (!built) return first();
      if (!build()) return;
      if (mode.reduced) drawStill();
      else draw();
    }, 160);
  });
  ro.observe(canvas);

  const io = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    sync();
  });
  io.observe(host);

  const onVisibility = () => {
    tabVisible = document.visibilityState === "visible";
    sync();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left;
    py = e.clientY - r.top;
    pOn = true;
  };
  const onLeave = () => {
    pOn = false;
  };
  if (mode.fine && !mode.reduced) {
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
  }

  return {
    destroy() {
      gsap.ticker.remove(tick);
      ticking = false;
      cancelAnimationFrame(revealFrame);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      stats.running = false;
      const w = window as unknown as { __hhField?: FieldStats };
      if (dev && w.__hhField === stats) delete w.__hhField;
    },
  };
}
