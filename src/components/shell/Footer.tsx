"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ } from "@/lib/motion";
import { clamp } from "@/lib/time";
import { scrollToTop } from "@/lib/scroll";
import { AREA, BRAND, CONTACT, EMAIL, HOURS, LEGAL_NAME, NAV, PHONE_DISPLAY, SOCIAL, whatsappHref } from "@/content/site";
import { TransitionLink } from "./PageTransition";

/**
 * Shared by every page. The wordmark letters rise out of the baseline when the
 * footer arrives, then lean toward the pointer: the nearest letters lift and
 * stretch a little, like signage catching light. Transforms only.
 */
export function Footer() {
  const root = useRef<HTMLElement>(null);
  const mark = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const box = mark.current;
      if (!box) return;
      const outer = gsap.utils.toArray<HTMLElement>(".fm-l", box);
      const inner = gsap.utils.toArray<HTMLElement>(".fm-i", box);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(inner, {
          yPercent: 104,
          duration: dur.slow + 0.1,
          ease: ease.arrive,
          stagger: 0.05,
          scrollTrigger: { trigger: box, start: "top 95%", once: true },
        });
      });

      mm.add(`${MQ.finePointer} and (prefers-reduced-motion: no-preference)`, () => {
        const lift = outer.map((l) => gsap.quickTo(l, "yPercent", { duration: 0.7, ease: "power3.out" }));
        const stretch = outer.map((l) => gsap.quickTo(l, "scaleY", { duration: 0.7, ease: "power3.out" }));
        let centers: number[] = [];
        let raf = 0;
        let px = 0;
        let py = 0;
        const measure = () => {
          centers = outer.map((l) => {
            const r = l.getBoundingClientRect();
            return r.left + r.width / 2;
          });
        };
        const tick = () => {
          raf = 0;
          const r = box.getBoundingClientRect();
          // Strongest when the pointer is over the wordmark, fading out 280px above it.
          const near = clamp(1 - Math.max(0, r.top - py) / 280, 0, 1) * (py <= r.bottom + 40 ? 1 : 0);
          const spread = r.width * 0.13;
          outer.forEach((_, i) => {
            const d = (px - centers[i]) / spread;
            const f = Math.exp(-d * d) * near;
            lift[i](-f * 8);
            stretch[i](1 + f * 0.09);
          });
        };
        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          if (!centers.length) measure();
          px = e.clientX;
          py = e.clientY;
          if (!raf) raf = requestAnimationFrame(tick);
        };
        const onLeave = () => {
          cancelAnimationFrame(raf);
          raf = 0;
          outer.forEach((l) => gsap.to(l, { yPercent: 0, scaleY: 1, duration: 0.9, ease: ease.settle, overwrite: true }));
        };
        const onEnter = () => measure();
        const el = root.current!;
        el.addEventListener("pointerenter", onEnter);
        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave);
        window.addEventListener("resize", measure);
        return () => {
          cancelAnimationFrame(raf);
          el.removeEventListener("pointerenter", onEnter);
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("resize", measure);
        };
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <footer ref={root} className="site-footer">
      <div className="wrap grid12 gap-y-12 pt-20 pb-14 lg:pt-28">
        <div className="col-span-4 lg:col-span-4">
          <p className="footer-lead">{CONTACT.footer.serving}</p>
        </div>

        <nav aria-label="Footer" className="col-span-2 lg:col-span-2 lg:col-start-6">
          <p className="footer-h">Pages</p>
          <ul className="footer-list">
            {NAV.map((item) => (
              <li key={item.id}>
                <TransitionLink href={item.href} className="footer-link">
                  {item.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 lg:col-span-3">
          <p className="footer-h">Talk to us</p>
          <ul className="footer-list">
            <li>
              <a className="footer-link break-all" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </li>
            <li>
              <a className="footer-link" href={whatsappHref("Hi, I'd like to book a call about my business.")} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li className="text-dim">{PHONE_DISPLAY}</li>
          </ul>
        </div>

        <div className="col-span-4 grid grid-cols-2 gap-x-[var(--gutter)] gap-y-10 lg:col-span-2 lg:grid-cols-1">
          <div>
            <p className="footer-h">Find us</p>
            <p className="mt-3">{AREA}</p>
            <p className="text-dim">{HOURS}</p>
          </div>
          <div>
            <p className="footer-h">Elsewhere</p>
            <ul className="footer-list">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  {s.href ? (
                    <a className="footer-link" href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  ) : (
                    <span className="text-dim">
                      {s.label} <span className="todo">TODO: link</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div ref={mark} className="fm wrap" aria-hidden="true">
        {BRAND.split("").map((ch, i) => (
          <span key={i} className="fm-l">
            <span className="fm-i">{ch}</span>
          </span>
        ))}
      </div>

      <div className="border-t border-rule">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="t-small text-dim">© 2026 {LEGAL_NAME}</p>
          <button
            type="button"
            className="t-small link"
            onClick={() => {
              scrollToTop();
              const h1 = document.querySelector<HTMLElement>("main h1");
              h1?.setAttribute("tabindex", "-1");
              h1?.focus({ preventScroll: true });
            }}
          >
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
