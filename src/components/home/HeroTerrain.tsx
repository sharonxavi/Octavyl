"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { MQ } from "@/lib/motion";

/**
 * The signal terrain: the hero's background. Dozens of fine lines laid out in
 * perspective like a landscape, flowing slowly toward the viewer. Under the
 * headline the ground is calm; to the right it rises into peaks. Messages run
 * along the lines as bright pulses, and each one that crosses the ridge is
 * logged as handled.
 *
 * Fine pointer: the field lifts toward the cursor and ripples out behind it;
 * a click sends a burst of messages from that spot. Touch: a tap does the same.
 * Reduced motion: one still frame, no loop.
 *
 * Raw WebGL, no library. Every line is a ribbon plus an opaque fill beneath
 * it, drawn with the depth buffer, so nearer ridges hide the lines behind them.
 * All displacement happens in the vertex shader; the CPU only moves a cursor,
 * eight ripples and sixteen pulses each frame.
 */
export function HeroTerrain({
  host,
  onMessage,
  onFail,
  onStill,
}: {
  host: React.RefObject<HTMLElement | null>;
  onMessage?: () => void;
  onFail?: () => void;
  /** Called when the field is drawn once and won't move (reduced motion, or no GPU). */
  onStill?: (still: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const handlers = useRef({ onMessage, onFail, onStill });
  useEffect(() => {
    handlers.current = { onMessage, onFail, onStill };
  });

  useEffect(() => {
    const el = canvas.current;
    const hostEl = host.current ?? el?.parentElement;
    if (!el || !hostEl) return;
    const reduce = window.matchMedia(MQ.reduce);
    const fine = window.matchMedia(MQ.finePointer);
    const make = () =>
      createTerrain(el, hostEl, {
        reduced: reduce.matches,
        fine: fine.matches,
        onMessage: () => handlers.current.onMessage?.(),
        onStill: (still: boolean) => handlers.current.onStill?.(still),
        onFail: () => handlers.current.onFail?.(),
      });
    let terrain = make();
    if (!terrain) {
      handlers.current.onFail?.();
      return;
    }
    const restart = () => {
      terrain?.destroy();
      terrain = make();
    };
    reduce.addEventListener("change", restart);
    fine.addEventListener("change", restart);
    return () => {
      reduce.removeEventListener("change", restart);
      fine.removeEventListener("change", restart);
      terrain?.destroy();
    };
  }, [host]);

  return <canvas ref={canvas} className="hh-canvas" />;
}

/* ------------------------------------------------------------------ shaders */

const VERT = /* glsl */ `
precision highp float;
attribute float a_u;
attribute float a_side;
attribute float a_line;

uniform vec2 u_res;
uniform float u_dpr;
uniform float u_time;
uniform float u_lines;
uniform float u_horizon;
uniform float u_focal;
uniform float u_zNear;
uniform float u_zFar;
uniform float u_amp;
uniform float u_intro;
uniform float u_stroke;
uniform vec4 u_fadeX; // min visibility, start, end (0..1 of width): calm under the words
uniform vec4 u_fadeY; // top fade start/end, band fade start/end (buffer px)
uniform vec3 u_mouse;
uniform vec4 u_rip[8];
uniform vec4 u_pulse[16];

varying vec3 v_col;

const float CAM_H = 1.0;
// Exactly #0A1128, the page colour: any rounding difference shows as seams where the fade mask blends.
const vec3 C_BG = vec3(10.0 / 255.0, 17.0 / 255.0, 40.0 / 255.0);
const vec3 C_FAR = vec3(0.098, 0.165, 0.349);
const vec3 C_NEAR = vec3(0.176, 0.286, 0.600);
const vec3 C_DAWN = vec3(0.561, 0.690, 1.000);
const vec3 C_SIGNAL = vec3(0.247, 0.435, 1.000);
const vec3 C_HOT = vec3(0.910, 0.933, 0.988);

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float depthOf(float s) {
  // Lines are spaced so the far ones crowd toward the horizon, like a real field.
  return 1.0 / mix(1.0 / u_zNear, 1.0 / u_zFar, pow(s, 0.82));
}

// Screen x (0..1) a ground point would land on, before any height.
float screenX(float x, float z) { return 0.5 + x * u_focal / z / u_res.x; }

float height(float x, float z) {
  float zz = z + u_time * 0.32;
  // Ridges: positive-only noise, sharpened, so peaks stand up out of calm ground.
  float n = snoise(vec2(x * 0.42, zz * 0.42)) * 0.65 + snoise(vec2(x * 1.1 + 7.3, zz * 1.1)) * 0.25 + snoise(vec2(x * 2.6 - 3.1, zz * 2.4)) * 0.1;
  float ridge = pow(max(n + 0.12, 0.0), 1.6);
  // Calm under the words, rising to the right; flatter close to the camera and at the horizon.
  float sx = screenX(x, z);
  float env = smoothstep(0.2, 0.82, sx) * smoothstep(u_zNear, u_zNear + 2.4, z) * (1.0 - 0.55 * smoothstep(9.0, u_zFar, z));
  float h = ridge * 1.25 * env + snoise(vec2(x * 3.0, zz * 3.0)) * 0.012;
  // The cursor lifts the ground toward it.
  vec2 d = vec2(x - u_mouse.x, (z - u_mouse.y) * 0.8);
  h += u_mouse.z * 0.62 * exp(-dot(d, d) / 0.55);
  // Ripples: rings that travel out from where the cursor moved or clicked.
  for (int k = 0; k < 8; k++) {
    vec4 r = u_rip[k];
    if (r.w <= 0.0) continue;
    float dist = length(vec2(x - r.x, (z - r.y) * 0.9));
    float front = r.z * 1.7;
    float band = (dist - front) / 0.42;
    h += r.w * sin((dist - front) * 7.0) * exp(-band * band) * exp(-r.z * 1.15) * 0.34;
  }
  return h * u_amp;
}

vec2 project(float x, float z, float h) {
  return vec2(u_res.x * 0.5 + x * u_focal / z, u_horizon + (CAM_H - h) * u_focal / z);
}

void main() {
  float s = a_line / (u_lines - 1.0);
  float z = depthOf(s);
  float halfSpan = u_res.x * 0.5 * z / u_focal * 1.06;
  float x = (a_u * 2.0 - 1.0) * halfSpan;
  float h = height(x, z);
  vec2 p = project(x, z, h);
  float depth = s * 2.0 - 1.0;

  // Which lines are lit by a message right now.
  float tail = 0.0;
  float head = 0.0;
  for (int k = 0; k < 16; k++) {
    vec4 q = u_pulse[k];
    if (q.w <= 0.0 || abs(q.x - a_line) > 0.5) continue;
    float ahead = q.y - a_u;
    if (ahead >= 0.0 && ahead < q.z) {
      float t = 1.0 - ahead / q.z;
      tail = max(tail, t * t * q.w);
      head = max(head, smoothstep(0.016, 0.0, ahead) * q.w);
    }
  }

  float intro = smoothstep(s * 0.85, s * 0.85 + 0.22, u_intro);

  if (u_stroke > 0.5) {
    // A ribbon a pixel or two wide, offset along the screen-space normal.
    float du = 1.0 / 400.0;
    vec2 pa = project(x - du * halfSpan * 2.0, z, height(x - du * halfSpan * 2.0, z));
    vec2 pb = project(x + du * halfSpan * 2.0, z, height(x + du * halfSpan * 2.0, z));
    vec2 t = normalize(pb - pa);
    vec2 nrm = vec2(-t.y, t.x);
    float near = 1.0 - s;
    float w = (0.5 + near * near * 0.95 + tail * 0.9 + head * 1.1) * u_dpr;
    p += nrm * a_side * w;
    depth -= 0.0008;

    float hn = clamp(h / 1.05, 0.0, 1.0);
    vec2 md = vec2(x - u_mouse.x, (z - u_mouse.y) * 0.8);
    float prox = u_mouse.z * exp(-dot(md, md) / 0.9);
    vec3 col = mix(C_FAR, C_NEAR, clamp(near * 0.9 + hn * 0.4, 0.0, 1.0));
    col = mix(col, C_DAWN, clamp(hn * hn * 0.85 + prox * 0.55, 0.0, 1.0));
    col = mix(col, C_SIGNAL, tail * 0.85);
    col = mix(col, C_HOT, head);
    // Far lines sink into the night; everything arrives with the intro.
    float fog = 1.0 - smoothstep(0.4, 1.0, s) * 0.72;
    // Quiet under the headline and under the nav. Done here, not with a CSS mask:
    // a mask over a WebGL canvas leaves faint seams where the browser blends it.
    float fx = mix(u_fadeX.x, 1.0, smoothstep(u_fadeX.y, u_fadeX.z, p.x / u_res.x));
    float fy = smoothstep(u_fadeY.x, u_fadeY.y, p.y);
    if (u_fadeY.w > u_fadeY.z) fy *= smoothstep(u_fadeY.z, u_fadeY.w, p.y);
    v_col = mix(C_BG, col, fog * intro * fx * fy);
  } else {
    // The fill: from the line down past the bottom edge, in the page colour.
    if (a_side > 0.5) p.y = u_res.y + 4.0;
    v_col = C_BG;
  }

  gl_Position = vec4(p.x / u_res.x * 2.0 - 1.0, 1.0 - p.y / u_res.y * 2.0, depth, 1.0);
}
`;

const FRAG = /* glsl */ `
precision mediump float;
varying vec3 v_col;
void main() { gl_FragColor = vec4(v_col, 1.0); }
`;

/* ------------------------------------------------------------------- engine */

type Mode = { reduced: boolean; fine: boolean; onMessage: () => void; onStill: (still: boolean) => void; onFail: () => void };
type Pulse = { line: number; u: number; len: number; speed: number; life: number; logged: boolean };
type Ripple = { x: number; z: number; age: number; strength: number };
export type TerrainStats = { frames: number; running: boolean; ms: number; lines: number; pulses: number };

const Z_FAR = 16;
const MAX_PULSES = 16;
const MAX_RIPPLES = 8;
const LOG_AT = 0.8; // a message is "handled" once it crosses the ridge on the right

/** Starts a compile. Its status is only read once the driver says it's done, so nothing blocks. */
function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

/** One indexed ribbon per line: (segments + 1) pairs of vertices, side -1/+1 (stroke) or 0/1 (fill). */
function buildMesh(lines: number, segments: number, stroke: boolean) {
  const perLine = (segments + 1) * 2;
  const verts = new Float32Array(lines * perLine * 3);
  const idx = new Uint16Array(lines * segments * 6);
  let v = 0;
  let i = 0;
  for (let l = 0; l < lines; l++) {
    const base = l * perLine;
    for (let k = 0; k <= segments; k++) {
      const u = k / segments;
      verts[v++] = u;
      verts[v++] = stroke ? -1 : 0;
      verts[v++] = l;
      verts[v++] = u;
      verts[v++] = 1;
      verts[v++] = l;
      if (k < segments) {
        const a = base + k * 2;
        idx[i++] = a;
        idx[i++] = a + 1;
        idx[i++] = a + 2;
        idx[i++] = a + 2;
        idx[i++] = a + 1;
        idx[i++] = a + 3;
      }
    }
  }
  return { verts, idx };
}

type Gl = WebGLRenderingContext;

/**
 * Gets a context and starts compiling the shaders. On Windows the driver can take
 * a few hundred milliseconds to compile them, so with KHR_parallel_shader_compile
 * that happens off the main thread and the field starts once it's ready.
 */
function createTerrain(canvas: HTMLCanvasElement, host: HTMLElement, mode: Mode) {
  const attrs: WebGLContextAttributes = {
    antialias: true,
    alpha: false,
    depth: true,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  };
  // Ask for a GPU first. Without one (software rendering), animating would load the
  // CPU every frame, so the field is drawn once instead, like reduced motion.
  let gl = canvas.getContext("webgl", { ...attrs, failIfMajorPerformanceCaveat: true });
  const software = !gl;
  if (!gl) gl = canvas.getContext("webgl", attrs);
  if (!gl) return null;
  const ctx = gl;

  const vs = compile(ctx, ctx.VERTEX_SHADER, VERT);
  const fs = compile(ctx, ctx.FRAGMENT_SHADER, FRAG);
  const prog = ctx.createProgram();
  if (!vs || !fs || !prog) return null;
  ctx.attachShader(prog, vs);
  ctx.attachShader(prog, fs);
  ctx.linkProgram(prog);

  const parallel = ctx.getExtension("KHR_parallel_shader_compile") as { COMPLETION_STATUS_KHR: number } | null;
  let disposed = false;
  let poll = 0;
  let inner: { destroy(): void } | null = null;
  const finish = () => {
    if (disposed) return;
    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[terrain]", ctx.getShaderInfoLog(vs), ctx.getShaderInfoLog(fs), ctx.getProgramInfoLog(prog));
      }
      mode.onFail();
      return;
    }
    inner = run(ctx, prog, canvas, host, mode, software);
  };
  if (parallel) {
    const check = () => {
      if (disposed) return;
      if (ctx.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) finish();
      else poll = requestAnimationFrame(check);
    };
    poll = requestAnimationFrame(check);
  } else {
    finish();
  }

  return {
    destroy() {
      disposed = true;
      cancelAnimationFrame(poll);
      inner?.destroy();
      ctx.deleteProgram(prog);
      ctx.deleteShader(vs);
      ctx.deleteShader(fs);
    },
  };
}

/** Everything after the shaders are ready: buffers, layout, input, the frame loop. */
function run(gl: Gl, prog: WebGLProgram, canvas: HTMLCanvasElement, host: HTMLElement, mode: Mode, software: boolean) {
  const still = mode.reduced || software;
  mode.onStill(still);
  gl.useProgram(prog);

  const small = window.matchMedia("(max-width: 767.98px)").matches;
  const light = small || software;
  const LINES = light ? 46 : 74;
  // 16-bit indices cap a mesh at 65,535 vertices; this stays well under.
  const SEGMENTS = light ? 150 : 260;

  const mkBuffers = (stroke: boolean) => {
    const { verts, idx } = buildMesh(LINES, SEGMENTS, stroke);
    const vb = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const ib = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    return { vb, ib, count: idx.length };
  };
  const fills = mkBuffers(false);
  const strokes = mkBuffers(true);

  const aU = gl.getAttribLocation(prog, "a_u");
  const aSide = gl.getAttribLocation(prog, "a_side");
  const aLine = gl.getAttribLocation(prog, "a_line");
  const loc = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    res: loc("u_res"),
    dpr: loc("u_dpr"),
    time: loc("u_time"),
    lines: loc("u_lines"),
    horizon: loc("u_horizon"),
    focal: loc("u_focal"),
    zNear: loc("u_zNear"),
    zFar: loc("u_zFar"),
    amp: loc("u_amp"),
    intro: loc("u_intro"),
    stroke: loc("u_stroke"),
    mouse: loc("u_mouse"),
    fadeX: loc("u_fadeX"),
    fadeY: loc("u_fadeY"),
    rip: loc("u_rip[0]"),
    pulse: loc("u_pulse[0]"),
  };

  const bind = (b: { vb: WebGLBuffer; ib: WebGLBuffer }) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, b.vb);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.ib);
    gl.enableVertexAttribArray(aU);
    gl.enableVertexAttribArray(aSide);
    gl.enableVertexAttribArray(aLine);
    gl.vertexAttribPointer(aU, 1, gl.FLOAT, false, 12, 0);
    gl.vertexAttribPointer(aSide, 1, gl.FLOAT, false, 12, 4);
    gl.vertexAttribPointer(aLine, 1, gl.FLOAT, false, 12, 8);
  };

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(10 / 255, 17 / 255, 40 / 255, 1);

  /* ---------------------------------------------------------------- layout */
  let W = 1;
  let H = 1;
  let dpr = 1;
  let focal = 1;
  let horizonBase = 0;
  let horizon = 0;
  let zNear = 1.3;
  const resize = () => {
    const r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, mode.fine ? 2 : 1.6);
    W = Math.max(1, Math.round(r.width * dpr));
    H = Math.max(1, Math.round(r.height * dpr));
    canvas.width = W;
    canvas.height = H;
    gl.viewport(0, 0, W, H);
    // Wide screens look across the field. Phones keep it to a band under the buttons.
    const band = Math.min(H * 0.45, 360 * dpr);
    if (small) {
      horizonBase = H - band;
      focal = band * 1.15;
    } else {
      horizonBase = H * 0.3;
      focal = H * 0.92;
    }
    horizon = horizonBase;
    zNear = focal / (H - horizonBase);
    gl.uniform2f(U.res, W, H);
    gl.uniform1f(U.dpr, dpr);
    gl.uniform1f(U.focal, focal);
    gl.uniform1f(U.zNear, zNear);
    gl.uniform1f(U.zFar, Z_FAR);
    gl.uniform1f(U.lines, LINES);
    const navH = (small ? 60 : 72) * dpr;
    if (small) {
      // Phones: the words fill the top, so the field lives in a band along the bottom.
      gl.uniform4f(U.fadeX, 1, 0, 1, 0);
      gl.uniform4f(U.fadeY, navH - 16 * dpr, navH + 60 * dpr, horizonBase - 150 * dpr, horizonBase + 10 * dpr);
    } else {
      gl.uniform4f(U.fadeX, 0.3, 0.22, 0.72, 0);
      gl.uniform4f(U.fadeY, navH - 16 * dpr, navH + 60 * dpr, 0, -1);
    }
  };
  resize();

  /* ----------------------------------------------------------------- state */
  const mouse = { x: 0, z: 4, amt: 0, tx: 0, tz: 4, tamt: 0 };
  const ripples: Ripple[] = Array.from({ length: MAX_RIPPLES }, () => ({ x: 0, z: 0, age: 0, strength: 0 }));
  const pulses: Pulse[] = Array.from({ length: MAX_PULSES }, () => ({ line: 0, u: 0, len: 0, speed: 0, life: 0, logged: true }));
  const ripBuf = new Float32Array(MAX_RIPPLES * 4);
  const pulseBuf = new Float32Array(MAX_PULSES * 4);
  let rip = 0;
  let lastRipple = 0;
  let lastLog = 0;
  let nextSpawn = 0.6;
  let clock = 0;
  let intro = still ? 1 : 0;
  let scrollP = 0;
  let px = 0;
  let py = 0;
  let pointerIn = false;

  /** Screen point (buffer px) to the ground plane: world x and depth. */
  const toGround = (sx: number, sy: number) => {
    const below = Math.max(sy - horizon, H * 0.02);
    const z = Math.min(Z_FAR, Math.max(zNear, focal / below));
    return { x: ((sx - W / 2) * z) / focal, z };
  };
  const lineAtDepth = (z: number) => {
    const inv = (1 / z - 1 / zNear) / (1 / Z_FAR - 1 / zNear);
    const s = Math.pow(Math.min(1, Math.max(0, inv)), 1 / 0.82);
    return Math.round(s * (LINES - 1));
  };
  const addRipple = (x: number, z: number, strength: number) => {
    const r = ripples[rip];
    rip = (rip + 1) % MAX_RIPPLES;
    r.x = x;
    r.z = z;
    r.age = 0;
    r.strength = strength;
  };
  const spawn = (line: number, u: number, fast = false) => {
    const p = pulses.find((q) => q.life <= 0);
    if (!p) return;
    p.line = Math.min(LINES - 1, Math.max(0, line));
    p.u = u;
    p.len = 0.05 + Math.random() * 0.05;
    p.speed = (fast ? 0.2 : 0.085) + Math.random() * 0.07;
    p.life = 1;
    p.logged = u > LOG_AT;
  };
  // A few messages already in flight, so the first frame isn't empty.
  for (let k = 0; k < 5; k++) spawn(Math.floor(LINES * (0.06 + Math.random() * 0.55)), 0.15 + Math.random() * 0.6);

  /* ----------------------------------------------------------------- input */
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = canvas.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    pointerIn = inside;
    if (!inside) return;
    const sx = (e.clientX - r.left) * dpr;
    const sy = (e.clientY - r.top) * dpr;
    const speed = Math.hypot(sx - px, sy - py);
    px = sx;
    py = sy;
    const g = toGround(sx, sy);
    mouse.tx = g.x;
    mouse.tz = g.z;
    // Above the horizon there's no ground to lift.
    mouse.tamt = sy > horizon ? 1 : 0.25;
    if (clock - lastRipple > 0.11 && speed > 6 * dpr) {
      lastRipple = clock;
      addRipple(g.x, g.z, Math.min(1, speed / (60 * dpr)) * 0.55);
    }
  };
  const onLeave = () => {
    pointerIn = false;
  };
  const onDown = (e: PointerEvent) => {
    if (still) return;
    const t = e.target as Element | null;
    if (t?.closest("a, button, input, select, textarea, label, [data-cursor]")) return;
    const r = canvas.getBoundingClientRect();
    const sx = (e.clientX - r.left) * dpr;
    const sy = (e.clientY - r.top) * dpr;
    if (sx < 0 || sy < 0 || sx > W || sy > H) return;
    const g = toGround(sx, sy);
    addRipple(g.x, g.z, 1.4);
    // A burst of messages leaves from the spot, along the nearest lines.
    const line = lineAtDepth(g.z);
    const halfSpan = ((W * 0.5 * g.z) / focal) * 1.06;
    const u = Math.min(0.9, Math.max(0.02, (g.x / halfSpan + 1) / 2));
    for (let k = -1; k <= 1; k++) spawn(line + k * 2, u, true);
  };
  host.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("pointerdown", onDown, { passive: true });

  const onScroll = () => {
    scrollP = Math.min(1, Math.max(0, window.scrollY / Math.max(1, host.offsetHeight)));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------------- frame */
  const dev = process.env.NODE_ENV !== "production";
  const stats: TerrainStats = { frames: 0, running: false, ms: 0, lines: LINES, pulses: 0 };
  if (dev) (window as unknown as { __hhTerrain?: TerrainStats }).__hhTerrain = stats;

  const draw = () => {
    // Scrolling away tilts the camera down: the horizon climbs and the field fills the view.
    // The nearest line stays on the bottom edge, so no empty strip opens under it.
    horizon = horizonBase - scrollP * H * 0.22;
    zNear = focal / (H - horizon);
    gl.uniform1f(U.horizon, horizon);
    gl.uniform1f(U.zNear, zNear);
    gl.uniform1f(U.time, clock);
    gl.uniform1f(U.intro, intro);
    gl.uniform1f(U.amp, 0.15 + 0.85 * (1 - Math.pow(1 - Math.min(1, intro * 1.1), 3)));
    gl.uniform3f(U.mouse, mouse.x, mouse.z, mouse.amt);
    ripples.forEach((r, k) => {
      ripBuf[k * 4] = r.x;
      ripBuf[k * 4 + 1] = r.z;
      ripBuf[k * 4 + 2] = r.age;
      ripBuf[k * 4 + 3] = r.age < 3.2 ? r.strength : 0;
    });
    gl.uniform4fv(U.rip, ripBuf);
    let live = 0;
    pulses.forEach((p, k) => {
      pulseBuf[k * 4] = p.line;
      pulseBuf[k * 4 + 1] = p.u;
      pulseBuf[k * 4 + 2] = p.len;
      pulseBuf[k * 4 + 3] = p.life > 0 ? Math.min(1, p.life * 3) * Math.min(1, (1.04 - p.u) * 6) : 0;
      if (p.life > 0) live++;
    });
    stats.pulses = live;
    gl.uniform4fv(U.pulse, pulseBuf);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(U.stroke, 0);
    bind(fills);
    gl.drawElements(gl.TRIANGLES, fills.count, gl.UNSIGNED_SHORT, 0);
    gl.uniform1f(U.stroke, 1);
    bind(strokes);
    gl.drawElements(gl.TRIANGLES, strokes.count, gl.UNSIGNED_SHORT, 0);
  };

  // An empty-handed visitor still sees the field breathe: a slow wanderer lifts it when no cursor is near.
  const wander = (t: number) => {
    const g = toGround(W * (0.68 + 0.16 * Math.sin(t * 0.21)), horizon + (H - horizon) * (0.42 + 0.18 * Math.sin(t * 0.17 + 1.3)));
    return g;
  };

  const frame = (dtMs: number) => {
    const t0 = performance.now();
    const dt = Math.min(0.05, dtMs / 1000);
    clock += dt;
    if (intro < 1) intro = Math.min(1, intro + dt / 2.1);

    if (!pointerIn || !mode.fine) {
      const g = wander(clock);
      mouse.tx = g.x;
      mouse.tz = g.z;
      mouse.tamt = 0.7;
    }
    const k = 1 - Math.pow(0.0015, dt);
    mouse.x += (mouse.tx - mouse.x) * k;
    mouse.z += (mouse.tz - mouse.z) * k;
    mouse.amt += (mouse.tamt - mouse.amt) * (1 - Math.pow(0.02, dt));
    ripples.forEach((r) => (r.age += dt));

    nextSpawn -= dt;
    if (nextSpawn <= 0) {
      nextSpawn = 0.45 + Math.random() * 0.7;
      spawn(Math.floor(LINES * (0.04 + Math.random() * 0.6)), Math.random() * 0.35);
    }
    for (const p of pulses) {
      if (p.life <= 0) continue;
      p.u += p.speed * dt;
      if (!p.logged && p.u > LOG_AT) {
        p.logged = true;
        if (clock - lastLog > 1.5) {
          lastLog = clock;
          mode.onMessage();
        }
      }
      if (p.u > 1.06) p.life = 0;
    }

    draw();
    stats.frames++;
    stats.ms = stats.ms * 0.9 + (performance.now() - t0) * 0.1;
    if (stats.frames === 2) canvas.classList.add("is-ready");
  };

  /* --------------------------------------------------------------- running */
  let running = false;
  let visible = true;
  const tick = (_t: number, deltaTime: number) => frame(deltaTime);
  const sync = () => {
    const run = !still && visible && !document.hidden;
    if (run === running) return;
    running = run;
    stats.running = run;
    if (run) gsap.ticker.add(tick);
    else gsap.ticker.remove(tick);
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", sync);

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      if (!running) frame(0);
    }, 120);
  });
  ro.observe(host);

  if (still) {
    // One still frame, mid-flow, with a few messages caught on the lines.
    clock = 14;
    mouse.amt = mouse.tamt = 0.7;
    const g = wander(clock);
    mouse.x = mouse.tx = g.x;
    mouse.z = mouse.tz = g.z;
    draw();
    canvas.classList.add("is-ready");
  } else {
    frame(16);
    sync();
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    gsap.ticker.remove(tick);
    running = false;
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return {
    destroy() {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.classList.remove("is-ready");
      gl.deleteBuffer(fills.vb);
      gl.deleteBuffer(fills.ib);
      gl.deleteBuffer(strokes.vb);
      gl.deleteBuffer(strokes.ib);
      const w = window as unknown as { __hhTerrain?: TerrainStats };
      if (dev && w.__hhTerrain === stats) delete w.__hhTerrain;
    },
  };
}
