import { gsap, CustomEase } from "./gsap";

/**
 * The one motion config. Every tween on the site takes its easing and timing
 * from here, so the whole page moves with one hand.
 */
// Eases are built in the browser only; the server never animates.
const curve = (id: string, path: string, fallback: string): gsap.EaseString | gsap.EaseFunction =>
  typeof window === "undefined" ? fallback : CustomEase.create(id, path);

export const ease = {
  /** Entrances and reveals. cubic-bezier(0.16, 1, 0.3, 1) */
  arrive: curve("arrive", "M0,0 C0.16,1 0.3,1 1,1", "expo.out"),
  /** Exits. Run at 0.65x the matching entrance duration. cubic-bezier(0.7, 0, 0.84, 0) */
  leave: curve("leave", "M0,0 C0.7,0 0.84,0 1,1", "expo.in"),
  /** Anything heavy: the shutter, H1 line one, a slot being set. cubic-bezier(0.76, 0, 0.24, 1) */
  shutter: curve("shutter", "M0,0 C0.76,0 0.24,1 1,1", "power4.inOut"),
  /** Slight overshoot: magnetic release, slot snap, the shutter landing. */
  settle: curve("settle", "M0,0 C0.18,0.84 0.3,1.04 0.56,1.012 0.72,0.995 0.86,1 1,1", "back.out(1.2)"),
  /** Scrubbed tweens follow the scroll exactly. */
  scrub: "none",
} as const;

export const dur = { instant: 0.18, quick: 0.35, base: 0.6, slow: 0.9, load: 1.2 } as const;
export const stagger = { row: 0.03, line: 0.06, word: 0.04, slat: 0.04 } as const;
export const scrub = { pin: 1, drift: 0.5 } as const;

export const magnet = {
  button: { pull: 0.3, label: 0.45, max: 10, field: 32 },
  link: { pull: 0.2, label: 0, max: 6, field: 12 },
} as const;

/** Media queries shared by every gsap.matchMedia() call. */
export const MQ = {
  full: "(prefers-reduced-motion: no-preference) and (min-width: 1024px)",
  compact: "(prefers-reduced-motion: no-preference) and (max-width: 1023.98px)",
  reduce: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
} as const;

export { gsap };
