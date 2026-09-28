"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ease, magnet, MQ } from "@/lib/motion";
import { clamp } from "@/lib/time";

/**
 * Pulls its child toward a nearby pointer and settles back with a slight
 * overshoot when the pointer leaves. An inner [data-magnet-label] leads its frame.
 * Fine pointers with motion allowed only; everyone else gets the CSS press scale.
 */
export function Magnetic({
  children,
  kind = "button",
  className = "",
}: {
  children: React.ReactNode;
  kind?: keyof typeof magnet;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const cfg = magnet[kind];
      const mm = gsap.matchMedia();
      mm.add(`${MQ.finePointer} and (prefers-reduced-motion: no-preference)`, () => {
        const label = el.querySelector<HTMLElement>("[data-magnet-label]");
        let raf = 0;
        let mx = 0;
        let my = 0;
        let active = false;

        const tick = () => {
          raf = 0;
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2 - (gsap.getProperty(el, "x") as number);
          const cy = r.top + r.height / 2 - (gsap.getProperty(el, "y") as number);
          const dx = mx - cx;
          const dy = my - cy;
          const inside = Math.abs(dx) < r.width / 2 + cfg.field && Math.abs(dy) < r.height / 2 + cfg.field;
          if (inside) {
            active = true;
            gsap.to(el, {
              x: clamp(dx * cfg.pull, -cfg.max, cfg.max),
              y: clamp(dy * cfg.pull, -cfg.max, cfg.max),
              duration: 0.45,
              ease: "power3.out",
              overwrite: "auto",
            });
            if (label && cfg.label) {
              gsap.to(label, {
                x: clamp(dx * cfg.label * 0.35, -cfg.max * 0.6, cfg.max * 0.6),
                y: clamp(dy * cfg.label * 0.35, -cfg.max * 0.6, cfg.max * 0.6),
                duration: 0.45,
                ease: "power3.out",
                overwrite: "auto",
              });
            }
          } else if (active) {
            active = false;
            gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: ease.settle, overwrite: "auto" });
            if (label) gsap.to(label, { x: 0, y: 0, duration: 0.8, ease: ease.settle, overwrite: "auto" });
          }
        };
        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          mx = e.clientX;
          my = e.clientY;
          if (!raf) raf = requestAnimationFrame(tick);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => {
          window.removeEventListener("pointermove", onMove);
          cancelAnimationFrame(raf);
          gsap.set([el, label].filter(Boolean), { x: 0, y: 0 });
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </span>
  );
}
