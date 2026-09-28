"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ } from "@/lib/motion";
import { clamp, clock, piecewise } from "@/lib/time";
import { cursorBus } from "@/lib/cursor";
import { getLenis } from "@/lib/scroll";
import { NIGHT } from "@/content/site";
import { NIGHT_TIMES } from "@/content/trades";
import { useTrade } from "../TradeProvider";
import { TradeSelect } from "../TradeSelect";
import { BookCall } from "../BookCall";

const START = 19 * 60 + 30;
const SHUTTER_DOWN = 21 * 60;
const BREAK_FROM = 25 * 60; // 01:00
const BREAK_TO = 30 * 60; // 06:00
const SHUTTER_UP = 33 * 60; // 09:00

/** How dark the night is at a given minute: the page sinks after closing and lifts at 9. */
const DARKNESS: ReadonlyArray<readonly [number, number]> = [
  [START, 0],
  [SHUTTER_DOWN, 0.3],
  [BREAK_FROM, 0.66],
  [BREAK_TO, 0.66],
  [32 * 60, 0.22],
  [SHUTTER_UP, 0],
];

export function Night() {
  const { trade } = useTrade();
  const [mode, setMode] = useState<"with" | "without">("with");
  const root = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const clockBarRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const handledTotal = trade.night.filter((e) => !e.needsYou).length;

  useGSAP(
    () => {
      const track = trackRef.current!;
      const wrap = wrapRef.current!;
      const events = Array.from(track.querySelectorAll<HTMLLIElement>(".ev"));
      const setCount = (n: number) => {
        if (countRef.current && countRef.current.textContent !== String(n)) countRef.current.textContent = String(n);
      };
      const mm = gsap.matchMedia();

      /* Desktop: the night runs sideways past a fixed playhead. */
      mm.add(MQ.full, () => {
        type Anchor = readonly [number, number];
        let anchors: Anchor[] = [];
        let head = 0;
        let lastMin = -1;
        const setDark = gsap.quickSetter(darkRef.current, "opacity");
        const state = events.map((li) => ({
          li,
          x: 0,
          p: -1,
          handled: !li.hasAttribute("data-needs"),
          path: li.querySelector<SVGPathElement>(".ev-route path")!,
          route: li.querySelector<SVGSVGElement>(".ev-route")!,
          box: li.querySelector<HTMLElement>(".ev-reply-box")!,
        }));
        const morning = track.querySelector<HTMLElement>(".morning");
        let morningX = 0;

        const measure = () => {
          head = wrap.clientWidth * 0.38;
          anchors = Array.from(track.querySelectorAll<HTMLElement>("[data-min]"))
            .flatMap((el): Anchor[] => {
              const x = el.offsetLeft;
              const a: Anchor[] = [[x, Number(el.dataset.min)]];
              if (el.dataset.minEnd) a.push([x + el.offsetWidth, Number(el.dataset.minEnd)]);
              return a;
            })
            .sort((a, b) => a[0] - b[0]);
          state.forEach((s) => (s.x = s.li.offsetLeft));
          morningX = morning ? (morning.closest("li") as HTMLElement).offsetLeft : 0;
        };

        const render = () => {
          if (!anchors.length) return;
          const at = -(gsap.getProperty(track, "x") as number) + head;
          const minutes = Math.round(piecewise(anchors, at));
          if (minutes !== lastMin) {
            lastMin = minutes;
            if (clockRef.current) clockRef.current.textContent = clock(minutes);
            setDark(piecewise(DARKNESS, minutes));
          }
          let handled = 0;
          for (const s of state) {
            const p = clamp((at - s.x + 30) / 150);
            if (p !== s.p) {
              s.p = p;
              s.path.style.strokeDashoffset = String(1 - p);
              s.box.style.setProperty("--filled", String(clamp((p - 0.55) / 0.45)));
              s.route.classList.toggle("is-live", p > 0 && p < 1);
            }
            if (s.handled && p >= 1) handled++;
          }
          setCount(handled);
          if (morning) {
            const mp = clamp((at - morningX + 40) / 260);
            morning.style.clipPath = `inset(0 0 ${(1 - mp) * 100}% 0)`;
          }
        };

        gsap.set(track, { x: 0 });
        measure();
        const tween = gsap.to(track, {
          x: () => -(track.scrollWidth - wrap.clientWidth),
          ease: "none",
          onUpdate: render,
          scrollTrigger: {
            id: "pin-night",
            trigger: root.current,
            start: "top top",
            end: () => "+=" + window.innerHeight * 3.2,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onRefresh: () => {
              measure();
              render();
            },
          },
        });
        measure();
        render();

        // Drag the night, and read the time under the pointer.
        const fine = window.matchMedia(MQ.finePointer).matches;
        let dragging = false;
        let lastX = 0;
        const timeAt = (clientX: number) => {
          const r = wrap.getBoundingClientRect();
          const x = -(gsap.getProperty(track, "x") as number) + (clientX - r.left);
          return clock(Math.round(piecewise(anchors, x)));
        };
        const onMove = (e: PointerEvent) => {
          if (!fine || e.pointerType !== "mouse") return;
          cursorBus.set({ label: timeAt(e.clientX) });
          if (!dragging) return;
          const st = tween.scrollTrigger!;
          const lenis = getLenis();
          const distance = track.scrollWidth - wrap.clientWidth;
          const ratio = (st.end - st.start) / Math.max(1, distance);
          const next = clamp((lenis?.scroll ?? window.scrollY) - (e.clientX - lastX) * ratio, st.start, st.end);
          lastX = e.clientX;
          if (lenis) lenis.scrollTo(next, { immediate: true, force: true });
          else window.scrollTo(0, next);
        };
        const onDown = (e: PointerEvent) => {
          if (!fine || e.pointerType !== "mouse" || (e.target as Element).closest("a, button, select")) return;
          dragging = true;
          lastX = e.clientX;
          track.setPointerCapture(e.pointerId);
          track.classList.add("is-dragging");
        };
        const onUp = (e: PointerEvent) => {
          if (!dragging) return;
          dragging = false;
          track.releasePointerCapture?.(e.pointerId);
          track.classList.remove("is-dragging");
        };
        track.addEventListener("pointermove", onMove);
        track.addEventListener("pointerdown", onDown);
        track.addEventListener("pointerup", onUp);
        track.addEventListener("pointercancel", onUp);
        return () => {
          track.removeEventListener("pointermove", onMove);
          track.removeEventListener("pointerdown", onDown);
          track.removeEventListener("pointerup", onUp);
          track.removeEventListener("pointercancel", onUp);
          state.forEach((s) => {
            s.path.style.strokeDashoffset = "";
            s.box.style.removeProperty("--filled");
            s.route.classList.remove("is-live");
          });
          if (morning) morning.style.clipPath = "";
          setCount(handledTotal);
        };
      });

      /* Phones and tablets: a vertical night under a sticky clock. */
      mm.add(MQ.compact, () => {
        setCount(0);
        const passed = new Set<HTMLElement>();
        const triggers = events.map((li) => {
          const path = li.querySelector<SVGPathElement>(".ev-route path")!;
          const box = li.querySelector<HTMLElement>(".ev-reply-box")!;
          gsap.set(path, { strokeDashoffset: 1 });
          box.style.setProperty("--filled", "0");
          return ScrollTrigger.create({
            trigger: li,
            start: "top 62%",
            onEnter: () => {
              gsap.to(path, { strokeDashoffset: 0, duration: dur.base, ease: ease.arrive });
              gsap.to(box, { "--filled": 1, duration: dur.base, ease: ease.arrive, delay: 0.25 });
              if (!li.hasAttribute("data-needs")) passed.add(li);
              setCount(passed.size);
            },
            onLeaveBack: () => {
              gsap.to(path, { strokeDashoffset: 1, duration: dur.quick, ease: ease.leave });
              gsap.to(box, { "--filled": 0, duration: dur.quick, ease: ease.leave });
              passed.delete(li);
              setCount(passed.size);
            },
          });
        });
        const clocks = Array.from(track.querySelectorAll<HTMLElement>("[data-time]")).map((el) =>
          ScrollTrigger.create({
            trigger: el,
            start: "top 50%",
            end: "bottom 50%",
            onToggle: (self) => {
              if (self.isActive && clockBarRef.current) clockBarRef.current.textContent = el.dataset.time!;
            },
          })
        );
        return () => {
          [...triggers, ...clocks].forEach((t) => t.kill());
          events.forEach((li) => {
            li.querySelector<SVGPathElement>(".ev-route path")!.style.strokeDashoffset = "";
            li.querySelector<HTMLElement>(".ev-reply-box")!.style.removeProperty("--filled");
          });
          setCount(handledTotal);
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  const late = (min: number) => min >= SHUTTER_DOWN && min < SHUTTER_UP;

  return (
    <section id="night" ref={root} className="night" data-mode={mode} aria-labelledby="night-title">
      <div ref={darkRef} className="night-dark" aria-hidden="true" />
      <a href="#build" className="skip-inline">
        Skip the sample night
      </a>
      <div className="night-inner">
        <header className="wrap night-head">
          <div>
            <h2 id="night-title" className="t-h2">
              One night at {trade.article} <TradeSelect label="Choose a trade for the sample night" />.
            </h2>
            <div className="night-lead-swap mt-4">
              <p className="t-lead" aria-hidden={mode === "without"}>
                {NIGHT.lead}
              </p>
              <p className="night-summary t-lead" aria-hidden={mode === "with"}>
                Without it: {trade.withoutSummary}
              </p>
            </div>
          </div>
          <div className="night-controls">
            <div className="night-toggle" role="group" aria-label="Show the night">
              <button type="button" aria-pressed={mode === "with"} onClick={() => setMode("with")}>
                {NIGHT.with}
              </button>
              <button type="button" aria-pressed={mode === "without"} onClick={() => setMode("without")}>
                {NIGHT.without}
              </button>
            </div>
            <p className="night-count">
              {mode === "with" ? NIGHT.handled : NIGHT.waiting}
              <b ref={countRef}>{mode === "with" ? handledTotal : trade.night.length}</b>
            </p>
          </div>
        </header>

        <div className="night-clockbar" aria-hidden="true">
          <span ref={clockBarRef} className="clock">
            19:30
          </span>
          <span className="t-small text-dim">{NIGHT.label}</span>
        </div>

        <div ref={wrapRef} className="track-wrap">
          <div className="playhead" aria-hidden="true">
            <span ref={clockRef} className="night-clock">
              19:30
            </span>
          </div>
          <ol ref={trackRef} className="track" data-cursor="time" data-cursor-label="19:30" aria-label="Sample night, 7:30 pm to 9 am">
            <li className="marker" data-min={START} data-time="19:30">
              <div className="ev-top">
                <p className="marker-title">Still open.</p>
              </div>
              <div className="ev-axis">
                <time className="ev-time">19:30</time>
              </div>
              <div className="ev-bottom">
                <p className="t-small text-dim max-w-[22ch]">You&apos;re with customers. The phone keeps ringing.</p>
              </div>
            </li>

            {trade.night.map((e, i) => {
              const t = NIGHT_TIMES[i];
              const nodes = [];
              if (i === 1) {
                nodes.push(
                  <li key="down" className="marker" data-min={SHUTTER_DOWN} data-time="21:00" data-late="">
                    <div className="ev-top">
                      <p className="marker-title">Shutter down.</p>
                    </div>
                    <div className="ev-axis">
                      <time className="ev-time">21:00</time>
                    </div>
                    <div className="ev-bottom">
                      <p className="t-small text-dim max-w-[22ch]">The shop stops answering. Customers don&apos;t.</p>
                    </div>
                  </li>
                );
              }
              if (i === 5) {
                nodes.push(
                  <li key="break" className="break" data-min={BREAK_FROM} data-min-end={BREAK_TO} data-time="01:00" data-late="">
                    <div className="ev-axis break-label">
                      <span className="t-small text-dim">5 hours later</span>
                    </div>
                  </li>
                );
              }
              nodes.push(
                <li
                  key={t.time}
                  className="ev"
                  data-min={t.min}
                  data-time={t.time}
                  data-late={late(t.min) ? "" : undefined}
                  data-needs={e.needsYou ? "" : undefined}
                  style={{ ["--i" as string]: i }}
                >
                  <div className="ev-top">
                    <p className="ev-source">{e.source}</p>
                    {e.said ? <q className="ev-said">{e.said}</q> : <p className="ev-context">{e.context}</p>}
                  </div>
                  <div className="ev-axis">
                    <time className="ev-time">{t.time}</time>
                  </div>
                  <svg className="ev-route" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M1 0 V100" pathLength={1} />
                  </svg>
                  <div className="ev-bottom">
                    <p className="ev-reply">
                      <span className="ev-reply-box">
                        <span className="ev-reply-text">
                          {mode === "without" && <span className="sr-only">Not sent: </span>}
                          <span className="strike-text">{e.reply}</span>
                        </span>
                      </span>
                      <span className="ev-without" aria-hidden={mode === "with"}>
                        {e.without}
                      </span>
                    </p>
                    {e.needsYou && mode === "with" && <p className="mt-2 t-small text-dawn">Anything public waits for you.</p>}
                  </div>
                </li>
              );
              return nodes;
            })}

            <li className="marker" data-min={SHUTTER_UP} data-time="09:00">
              <div className="ev-top">
                <p className="marker-title">Shutter up.</p>
              </div>
              <div className="ev-axis">
                <time className="ev-time">09:00</time>
              </div>
              <div className="ev-bottom">
                <p className="t-small text-dim max-w-[22ch]">You open to this:</p>
              </div>
            </li>

            <li className="morning-wrap" data-min={SHUTTER_UP + 5} data-time="09:05">
              <div className="ev-top">
                <p className="t-small text-dim">{NIGHT.label}</p>
              </div>
              <div className="ev-axis" />
              <div className="ev-bottom">
                <div className="morning">
                  <p className="morning-text">{trade.morning}</p>
                </div>
              </div>
            </li>

            {[0, 1].map((k) => (
              // TODO: replace these two slots with real client nights, shared with the owner's permission.
              <li key={`work-${k}`} className="work-wrap" data-cursor="media">
                <div className="ev-top">
                  <span className="tag">{NIGHT.workTag}</span>
                </div>
                <div className="ev-axis" />
                <div className="ev-bottom">
                  <div className="work-slot">
                    <p className="t-h3">{NIGHT.workTitle}</p>
                    <p className="mt-3 t-small text-dim">{NIGHT.workLine}</p>
                  </div>
                </div>
              </li>
            ))}

            <li className="end-wrap">
              <div className="ev-top">
                <p className="t-h3 max-w-[16ch]">{NIGHT.end}</p>
              </div>
              <div className="ev-axis" />
              <div className="ev-bottom">
                <BookCall />
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
