"use client";

import { useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/scroll";

/**
 * Lenis is the single source of scroll. GSAP's ticker drives it, and every
 * Lenis scroll updates ScrollTrigger, so pins and scrubs share one clock.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenis = useLenis(ScrollTrigger.update);

  useEffect(() => {
    if (!lenis) return;
    setLenis(lenis);
    if (process.env.NODE_ENV !== "production") {
      // Handles for the screenshot script in scripts/shoot.mjs.
      Object.assign(window, { __lenis: lenis, __ST: ScrollTrigger });
    }
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      setLenis(null);
    };
  }, [lenis]);

  useEffect(() => {
    // Custom fonts change line lengths, so every trigger is re-measured once they land.
    // ScrollTrigger already refreshes on window load; only fonts that arrive after that need a second pass.
    document.fonts?.ready.then(() => {
      if (document.readyState === "complete") ScrollTrigger.refresh();
    });
  }, []);

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1, anchors: false }}>
      {children}
    </ReactLenis>
  );
}
