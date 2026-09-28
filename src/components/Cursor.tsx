"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { MQ } from "@/lib/motion";
import { cursorBus } from "@/lib/cursor";

/**
 * A two-part cursor for fine pointers: a dot that tracks exactly and a ring
 * that follows and changes by context (link, slot, drag, time, media, text).
 * Touch devices and reduced motion keep the native cursor.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia(MQ.finePointer);
    const reduce = window.matchMedia(MQ.reduce);
    const update = () => setEnabled(fine.matches && !reduce.matches);
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!enabled || !el) return;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    const dot = el.querySelector<HTMLElement>(".cursor-dot")!;
    const ring = el.querySelector<HTMLElement>(".cursor-ring")!;
    const label = el.querySelector<HTMLElement>(".cursor-label")!;
    const dotX = gsap.quickSetter(dot, "x", "px");
    const dotY = gsap.quickSetter(dot, "y", "px");
    const ringX = gsap.quickTo(ring, "x", { duration: 0.18, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.18, ease: "power3.out" });

    let state = "default";
    let magnetTarget: Element | null = null;
    let px = -100;
    let py = -100;
    let raf = 0;

    const apply = () => {
      raf = 0;
      dotX(px);
      dotY(py);
      if (state === "link" && magnetTarget) {
        const r = magnetTarget.getBoundingClientRect();
        ringX(px + (r.left + r.width / 2 - px) * 0.3);
        ringY(py + (r.top + r.height / 2 - py) * 0.3);
      } else {
        ringX(px);
        ringY(py);
      }
    };
    const setState = (next: string, text?: string) => {
      if (next !== state) {
        state = next;
        el.dataset.state = next;
      }
      if (text !== undefined) label.textContent = text;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      el.classList.add("is-visible");
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onOver = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.(
        "[data-cursor], a, button, select, input, textarea, label, summary"
      );
      magnetTarget = null;
      if (!t) return setState("default");
      const explicit = t.getAttribute("data-cursor");
      if (explicit) {
        if (explicit === "link") magnetTarget = t;
        return setState(explicit, t.getAttribute("data-cursor-label") ?? "");
      }
      if (t.matches("input[type=range]")) return setState("drag", "Drag");
      if (t.matches("input, textarea")) return setState("text");
      magnetTarget = t;
      setState("link");
    };
    const onDown = () => el.classList.add("is-down");
    const onUp = () => el.classList.remove("is-down");
    const onLeave = () => el.classList.remove("is-visible");
    const unsubscribe = cursorBus.subscribe(({ state: s, label: text }) => {
      if (s) setState(s, text);
      else if (text !== undefined) label.textContent = text;
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    html.addEventListener("mouseleave", onLeave);
    return () => {
      html.classList.remove("has-cursor");
      unsubscribe();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      html.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={root} className="cursor" data-state="default" aria-hidden="true">
      <div className="cursor-ring">
        <span>
          <span className="cursor-label" />
        </span>
      </div>
      <div className="cursor-dot" />
    </div>
  );
}
