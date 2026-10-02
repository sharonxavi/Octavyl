"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ, stagger } from "@/lib/motion";
import { clamp } from "@/lib/time";
import { cursorBus } from "@/lib/cursor";
import { INDUSTRIES } from "@/content/home";
import { TRADES, type TradeId } from "@/content/trades";
import { solutionsHref } from "@/lib/trade-param";
import { TransitionLink } from "@/components/shell/PageTransition";

/**
 * The first message a trade's sample evening gets, and the reply the agent sent to it.
 * The reply is looked up by the customer's words, so the pair on the card always matches
 * what /solutions shows for that message.
 */
function firstExchange(id: TradeId) {
  const t = TRADES[id];
  const msg = t.incoming[0];
  const reply = (t.night.find((e) => e.said === msg.said) ?? t.night[0]).reply;
  return { channel: msg.channel, at: msg.at, said: msg.said, reply };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A row of trade cards that runs off the right edge. Native horizontal scroll with
 * snap for touch, trackpads and keyboards; click-drag with a throw for mice; a light
 * tilt toward the pointer. Every trade card opens that trade's sample on /solutions.
 */
export function Industries() {
  const root = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const row = rowRef.current!;
      const thumb = thumbRef.current!;
      const items = Array.from(row.querySelectorAll<HTMLLIElement>(".in-item"));
      const cards = items.map((li) => li.querySelector<HTMLElement>(".in-card")!);

      /* Where the row is: the thumb shows the visible share and slides with the scroll. */
      let progressRaf = 0;
      const drawProgress = () => {
        progressRaf = 0;
        const max = row.scrollWidth - row.clientWidth;
        const share = clamp(row.clientWidth / Math.max(1, row.scrollWidth), 0.08, 1);
        const p = max > 0 ? clamp(row.scrollLeft / max) : 0;
        thumb.style.width = `${share * 100}%`;
        thumb.style.transform = `translateX(${(p * (1 - share) * 100) / share}%)`;
      };
      const onRowScroll = () => {
        if (!progressRaf) progressRaf = requestAnimationFrame(drawProgress);
      };
      row.addEventListener("scroll", onRowScroll, { passive: true });
      window.addEventListener("resize", onRowScroll);
      drawProgress();

      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduce: MQ.reduce,
          fine: MQ.finePointer,
        },
        (ctx) => {
          const { motion, fine } = ctx.conditions as { motion: boolean; reduce: boolean; fine: boolean };
          const cleanups: Array<() => void> = [];

          /* Entrance. Opacity (not autoAlpha), so a keyboard user can still tab into a card before it has faded in. */
          if (motion) {
            const heads = Array.from(root.current!.querySelectorAll<HTMLElement>("[data-split]"));
            const splits = heads.map((el) =>
              SplitText.create(el, {
                type: "lines",
                mask: "lines",
                autoSplit: true,
                aria: el.tagName === "P" ? "none" : "auto",
                onSplit: (self) =>
                  gsap.from(self.lines, {
                    yPercent: 105,
                    duration: dur.slow,
                    ease: ease.arrive,
                    stagger: stagger.line,
                    scrollTrigger: { trigger: el, start: "top 82%", once: true },
                  }),
              })
            );
            cleanups.push(() => splits.forEach((s) => s.revert()));
            gsap.fromTo(
              items,
              { y: 40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: dur.slow,
                ease: ease.arrive,
                stagger: 0.07,
                clearProps: "transform,opacity",
                scrollTrigger: { trigger: row, start: "top 85%", once: true },
              }
            );
          } else {
            gsap.fromTo(
              items,
              { opacity: 0 },
              {
                opacity: 1,
                duration: dur.base,
                ease: "none",
                clearProps: "opacity",
                scrollTrigger: { trigger: row, start: "top 90%", once: true },
              }
            );
          }

          if (!fine) return () => cleanups.forEach((f) => f());

          /* Mouse: click-drag the row. A drag never opens a card. */
          let down = false;
          let dragging = false;
          let moved = false;
          let pointerId = -1;
          let startX = 0;
          let startLeft = 0;
          let lastX = 0;
          let lastT = 0;
          let velocity = 0; // px per ms, positive when the pointer moves right
          let throwTween: gsap.core.Tween | null = null;

          const stopThrow = () => {
            if (!throwTween) return;
            throwTween.kill();
            throwTween = null;
            row.classList.remove("is-throwing");
          };
          // Snap stops are the card edges, measured the same way CSS scroll-snap measures them.
          const stops = () => {
            const padStart = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
            const max = row.scrollWidth - row.clientWidth;
            return items.map((li) => clamp(li.offsetLeft - padStart, 0, max));
          };
          const nearest = (x: number) => stops().reduce((best, s) => (Math.abs(s - x) < Math.abs(best - x) ? s : best), 0);
          const cursorUnder = (x: number, y: number) => {
            const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cursor]");
            cursorBus.set(el ? { state: el.dataset.cursor, label: el.dataset.cursorLabel ?? "" } : { state: "default", label: "" });
          };

          const onDown = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" || e.button !== 0) return;
            stopThrow();
            down = true;
            dragging = false;
            moved = false;
            pointerId = e.pointerId;
            startX = lastX = e.clientX;
            startLeft = row.scrollLeft;
            lastT = performance.now();
            velocity = 0;
          };
          const onMove = (e: PointerEvent) => {
            if (!down || e.pointerId !== pointerId) return;
            const dx = e.clientX - startX;
            if (!dragging) {
              if (Math.abs(dx) <= 6) return;
              dragging = true;
              moved = true;
              row.setPointerCapture(pointerId);
              row.classList.add("is-dragging");
              cursorBus.set({ state: "drag", label: "Drag" });
            }
            row.scrollLeft = startLeft - dx;
            const now = performance.now();
            const dt = now - lastT;
            if (dt > 0) velocity = 0.75 * ((e.clientX - lastX) / dt) + 0.25 * velocity;
            lastX = e.clientX;
            lastT = now;
          };
          const onUp = (e: PointerEvent) => {
            if (!down || e.pointerId !== pointerId) return;
            down = false;
            if (!dragging) return;
            dragging = false;
            if (row.hasPointerCapture(pointerId)) row.releasePointerCapture(pointerId);
            row.classList.remove("is-dragging");
            cursorUnder(e.clientX, e.clientY);
            // A pointer that stopped before letting go has no throw.
            if (performance.now() - lastT > 90) velocity = 0;
            if (!motion) return; // reduced motion: the row stays where it was put
            const target = nearest(row.scrollLeft - clamp(velocity, -4, 4) * 320);
            const distance = Math.abs(target - row.scrollLeft);
            if (distance < 1) return;
            row.classList.add("is-throwing");
            throwTween = gsap.to(row, {
              scrollLeft: target,
              duration: clamp(0.45 + distance / 1800, 0.5, 1.1),
              ease: ease.arrive,
              onComplete: () => {
                throwTween = null;
                row.classList.remove("is-throwing");
              },
            });
          };
          const onClickCapture = (e: MouseEvent) => {
            if (!moved) return;
            moved = false;
            e.preventDefault();
            e.stopPropagation();
          };
          const onDragStart = (e: DragEvent) => e.preventDefault();

          row.addEventListener("pointerdown", onDown);
          row.addEventListener("pointermove", onMove);
          row.addEventListener("pointerup", onUp);
          row.addEventListener("pointercancel", onUp);
          row.addEventListener("click", onClickCapture, true);
          row.addEventListener("dragstart", onDragStart);
          row.addEventListener("wheel", stopThrow, { passive: true });
          cleanups.push(() => {
            stopThrow();
            row.classList.remove("is-dragging");
            row.removeEventListener("pointerdown", onDown);
            row.removeEventListener("pointermove", onMove);
            row.removeEventListener("pointerup", onUp);
            row.removeEventListener("pointercancel", onUp);
            row.removeEventListener("click", onClickCapture, true);
            row.removeEventListener("dragstart", onDragStart);
            row.removeEventListener("wheel", stopThrow);
          });

          /* Tilt toward the pointer, with a soft light under it. Mouse and motion only. */
          if (motion) {
            const MAX = 7;
            cards.forEach((card, i) => {
              const li = items[i];
              const light = card.querySelector<HTMLElement>(".in-light")!;
              gsap.set(card, { transformPerspective: 900 });
              const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: ease.arrive });
              const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: ease.arrive });
              const lx = gsap.quickTo(light, "x", { duration: 0.45, ease: ease.arrive });
              const ly = gsap.quickTo(light, "y", { duration: 0.45, ease: ease.arrive });
              let settle: gsap.core.Tween | null = null;
              let inside = false;

              const onEnter = (e: PointerEvent) => {
                if (e.pointerType !== "mouse") return;
                inside = true;
                settle?.kill();
                settle = null;
                const r = li.getBoundingClientRect();
                gsap.set(light, { x: e.clientX - r.left - 130, y: e.clientY - r.top - 130 });
                gsap.to(light, { opacity: 1, duration: dur.quick, ease: ease.arrive, overwrite: "auto" });
              };
              const onCardMove = (e: PointerEvent) => {
                if (!inside || e.pointerType !== "mouse") return;
                // Measured on the untilted <li>, so the tilt never feeds back into itself.
                const r = li.getBoundingClientRect();
                const px = clamp((e.clientX - r.left) / r.width) - 0.5;
                const py = clamp((e.clientY - r.top) / r.height) - 0.5;
                const tilt = dragging ? 0 : 1;
                rx(-py * 2 * MAX * tilt, gsap.getProperty(card, "rotationX") as number);
                ry(px * 2 * MAX * tilt, gsap.getProperty(card, "rotationY") as number);
                lx(e.clientX - r.left - 130);
                ly(e.clientY - r.top - 130);
              };
              const onLeave = () => {
                if (!inside) return;
                inside = false;
                rx.tween.pause();
                ry.tween.pause();
                settle = gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.9, ease: ease.settle });
                gsap.to(light, { opacity: 0, duration: dur.quick, ease: ease.leave, overwrite: "auto" });
              };
              li.addEventListener("pointerenter", onEnter);
              li.addEventListener("pointermove", onCardMove);
              li.addEventListener("pointerleave", onLeave);
              cleanups.push(() => {
                li.removeEventListener("pointerenter", onEnter);
                li.removeEventListener("pointermove", onCardMove);
                li.removeEventListener("pointerleave", onLeave);
                settle?.kill();
                rx.tween.kill();
                ry.tween.kill();
                lx.tween.kill();
                ly.tween.kill();
                gsap.set(card, { clearProps: "transform" });
                gsap.set(light, { clearProps: "transform,opacity" });
              });
            });
          }

          return () => cleanups.forEach((f) => f());
        }
      );

      return () => {
        mm.revert();
        row.removeEventListener("scroll", onRowScroll);
        window.removeEventListener("resize", onRowScroll);
        cancelAnimationFrame(progressRaf);
      };
    },
    { scope: root }
  );

  const { other } = INDUSTRIES;

  return (
    <section id="industries" ref={root} className="in relative py-28 lg:py-40" aria-labelledby="industries-title">
      <header className="wrap grid12 gap-y-5">
        <h2 id="industries-title" className="t-h2 col-span-4 lg:col-span-7" data-split>
          {INDUSTRIES.title}
        </h2>
        <p className="t-lead col-span-4 lg:col-span-6" data-split>
          {INDUSTRIES.lead}
        </p>
        <p className="in-hint t-small text-dim col-span-4 hidden lg:col-start-1 lg:flex">
          <span className="in-hint-glyph" aria-hidden="true" />
          {INDUSTRIES.hint}
        </p>
      </header>

      <div className="in-rail">
        <ul ref={rowRef} className="in-row" role="list" data-lenis-prevent-horizontal data-cursor="drag" data-cursor-label="Drag">
          {INDUSTRIES.cards.map((c, i) => {
            const ex = firstExchange(c.id);
            return (
              <li key={c.id} className="in-item">
                <TransitionLink
                  href={solutionsHref(c.id)}
                  className="in-card"
                  draggable={false}
                  data-cursor="explore"
                  data-cursor-label="Explore"
                  aria-labelledby={`in-name-${c.id} in-open-${c.id}`}
                  aria-describedby={`in-msg-${c.id} in-line-${c.id}`}
                >
                  <span className="in-light" aria-hidden="true" />
                  <span className="in-index t-data" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <h3 id={`in-name-${c.id}`} className="in-name">
                    {c.name}
                  </h3>

                  <span id={`in-msg-${c.id}`} className="in-msg">
                    <span className="in-in">
                      <span className="in-meta t-data">
                        <span>{ex.channel}</span>
                        <time>{ex.at}</time>
                      </span>
                      <q className="in-said">{ex.said}</q>
                    </span>
                    <span className="in-reply">
                      <span className="in-sq" aria-hidden="true" />
                      {ex.reply}
                    </span>
                  </span>

                  <span className="in-foot">
                    <span id={`in-line-${c.id}`} className="in-line t-small">
                      {c.line}
                    </span>
                    <span id={`in-open-${c.id}`} className="in-open">
                      {INDUSTRIES.open}
                      <span className="in-arrow" aria-hidden="true" />
                    </span>
                  </span>
                </TransitionLink>
              </li>
            );
          })}

          <li className="in-item">
            <TransitionLink
              href="/#contact"
              className="in-card in-card-other"
              draggable={false}
              data-cursor="explore"
              data-cursor-label={other.cta}
              aria-labelledby="in-name-other in-open-other"
              aria-describedby="in-line-other"
            >
              <span className="in-light" aria-hidden="true" />
              <h3 id="in-name-other" className="in-name">
                {other.name}
              </h3>
              <span className="in-foot">
                <span id="in-line-other" className="in-line in-line-other">
                  {other.line}
                </span>
                <span id="in-open-other" className="in-open">
                  {other.cta}
                  <span className="in-arrow" aria-hidden="true" />
                </span>
              </span>
            </TransitionLink>
          </li>
        </ul>

        <div className="wrap" aria-hidden="true">
          <span className="in-progress">
            <span ref={thumbRef} className="in-thumb" />
          </span>
        </div>
      </div>
    </section>
  );
}
