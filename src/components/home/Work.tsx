"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ, stagger } from "@/lib/motion";
import { clamp } from "@/lib/time";
import { getLenis } from "@/lib/scroll";
import { WORK } from "@/content/home";
import { TRADES } from "@/content/trades";
import { solutionsHref } from "@/lib/trade-param";
import { TransitionLink } from "@/components/shell/PageTransition";
import { BookCall } from "@/components/BookCall";
import { WkArt, type WkArtKind } from "./WkArt";

const ART: WkArtKind[] = ["register", "chat", "calendar"];
// TODO: copy. Move to WORK in src/content/home.ts (e.g. WORK.placeholder) so all Home words live there.
const PLACEHOLDER_TAG = "Placeholder";

const pad = (n: number) => String(n).padStart(2, "0");
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Copy that is still a TODO is drawn as a marked placeholder; real copy renders as itself. */
function Copy({ text }: { text: string }) {
  return text.startsWith("TODO:") ? <span className="todo">{text}</span> : <>{text}</>;
}

/**
 * Case studies. Desktop with motion: the section pins and vertical scroll runs the cards
 * sideways past a fixed header, each card's picture drifting against the track.
 * Phones, tablets and reduced motion: the same cards stacked, nothing pinned.
 * Until real case-study pages exist, each card opens the sample for its trade.
 */
export function Work() {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const total = WORK.items.length;

  useGSAP(
    () => {
      const section = root.current!;
      const stage = stageRef.current!;
      const track = trackRef.current!;
      const count = countRef.current!;
      const bar = barRef.current!;
      const items = Array.from(track.querySelectorAll<HTMLLIElement>(".wk-item"));
      const cards = items.filter((li) => !li.classList.contains("wk-end"));
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const heads = Array.from(section.querySelectorAll<HTMLElement>("[data-split]"));
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
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              }),
          })
        );
        return () => splits.forEach((s) => s.revert());
      });

      /* Desktop with motion: pinned, sideways. */
      mm.add(MQ.full, () => {
        const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);
        let lefts: number[] = [];
        let current = 0;
        let roll: gsap.core.Timeline | null = null;

        // The readout rolls to the next number as each card reaches the middle of the screen.
        const setCount = (i: number) => {
          if (i === current) return;
          const dir = i > current ? 1 : -1;
          current = i;
          roll?.kill();
          roll = gsap
            .timeline()
            .to(count, { yPercent: -100 * dir, duration: 0.16, ease: ease.leave })
            .call(() => {
              count.textContent = String(i + 1);
            })
            .fromTo(count, { yPercent: 100 * dir }, { yPercent: 0, duration: dur.quick, ease: ease.arrive });
        };
        const measure = () => {
          lefts = cards.map((li) => li.offsetLeft);
        };
        const render = () => {
          const x = -(gsap.getProperty(track, "x") as number);
          const d = distance();
          bar.style.transform = `scaleX(${d > 0 ? clamp(x / d) : 0})`;
          const at = x + stage.clientWidth * 0.5;
          let idx = 0;
          for (let k = 0; k < lefts.length; k++) if (lefts[k] <= at) idx = k;
          setCount(idx);
        };

        gsap.set(track, { x: 0 });
        measure();
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          onUpdate: render,
          scrollTrigger: {
            id: "pin-work",
            trigger: section,
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onRefresh: () => {
              measure();
              render();
            },
          },
        });

        // Each picture drifts against the track, so it reads as a window onto something behind the card.
        cards.forEach((li) => {
          const art = li.querySelector<HTMLElement>(".wk-art");
          if (!art) return;
          gsap.fromTo(
            art,
            { xPercent: -8 },
            {
              xPercent: 8,
              ease: "none",
              scrollTrigger: { trigger: li, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
            }
          );
        });

        // Keyboard: the track is moved by the page scroll, so bring a focused card in by scrolling the page.
        const onFocus = (e: FocusEvent) => {
          const li = (e.target as Element).closest<HTMLElement>(".wk-item");
          const st = tween.scrollTrigger;
          if (!li || !st) return;
          stage.scrollLeft = 0;
          const d = distance();
          const x = -(gsap.getProperty(track, "x") as number);
          const left = li.offsetLeft - x;
          const inView = left >= 0 && left + li.offsetWidth <= stage.clientWidth;
          if (inView && window.scrollY >= st.start && window.scrollY <= st.end) return;
          const padStart = parseFloat(getComputedStyle(track).paddingLeft) || 0;
          const want = clamp(li.offsetLeft - padStart, 0, d);
          const y = st.start + (d > 0 ? want / d : 0) * (st.end - st.start);
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(y, { duration: 0.9, force: true });
          else window.scrollTo(0, y);
        };
        // A focused card must never scroll the clipped stage itself; the transform does the moving.
        const onStageScroll = () => {
          if (stage.scrollLeft !== 0) stage.scrollLeft = 0;
        };
        track.addEventListener("focusin", onFocus);
        stage.addEventListener("scroll", onStageScroll);

        return () => {
          track.removeEventListener("focusin", onFocus);
          stage.removeEventListener("scroll", onStageScroll);
          roll?.kill();
          count.textContent = "1";
          gsap.set(count, { clearProps: "transform" });
          bar.style.transform = "";
        };
      });

      /* Phones and tablets: stacked cards rise in as they arrive. */
      mm.add(MQ.compact, () => {
        items.forEach((li) => {
          gsap.fromTo(
            li,
            { y: 32, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: dur.slow,
              ease: ease.arrive,
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: li, start: "top 88%", once: true },
            }
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="work" ref={root} className="wk" aria-labelledby="work-title">
      <div className="wk-inner">
        <header className="wrap grid12 wk-head">
          <h2 id="work-title" className="t-h2 wk-title" data-split>
            {WORK.title}
          </h2>
          <p className="t-lead wk-lead" data-split>
            {WORK.lead}
          </p>
          <p className="wk-count t-data" aria-hidden="true">
            <span className="wk-count-mask">
              <span ref={countRef} className="wk-count-now">
                1
              </span>
            </span>
            <span className="wk-count-of">/ {total}</span>
            <span className="wk-count-track">
              <span ref={barRef} className="wk-count-fill" />
            </span>
          </p>
        </header>

        <div ref={stageRef} className="wk-stage">
          <ol ref={trackRef} className="wk-track" role="list">
            {WORK.items.map((item, i) => (
              <li key={i} className="wk-item">
                <TransitionLink
                  href={solutionsHref(item.trade)}
                  className="wk-card"
                  draggable={false}
                  data-cursor="view"
                  data-cursor-label={WORK.view}
                >
                  <span className="wk-media" aria-hidden="true">
                    <span className="wk-art">
                      <WkArt kind={ART[i % ART.length]} trade={item.trade} />
                    </span>
                    <span className="tag wk-tag">{PLACEHOLDER_TAG}</span>
                  </span>

                  <span className="wk-caption">
                    <span className="wk-cap-top">
                      <span className="wk-index t-data" aria-hidden="true">
                        {pad(i + 1)}
                      </span>
                      <span id={`wk-trade-${i}`} className="wk-trade">
                        {sentence(TRADES[item.trade].label)}
                      </span>
                      <span className="wk-view" aria-hidden="true">
                        {WORK.view}
                        <span className="wk-arrow" />
                      </span>
                    </span>
                    <span className="wk-cap-who">
                      <h3 id={`wk-client-${i}`} className="wk-client">
                        <Copy text={item.client} />
                      </h3>
                      <span className="wk-place">
                        <Copy text={item.place} />
                      </span>
                    </span>
                    <span className="wk-cap-what">
                      <span id={`wk-built-${i}`} className="wk-built">
                        <Copy text={item.built} />
                      </span>
                      <span id={`wk-result-${i}`} className="wk-result">
                        <Copy text={item.result} />
                      </span>
                    </span>
                  </span>
                </TransitionLink>
              </li>
            ))}

            <li className="wk-item wk-end">
              <div className="wk-end-frame">
                <span className="wk-end-index t-data" aria-hidden="true">
                  {pad(total + 1)}
                </span>
                <p className="wk-end-title">{WORK.end}</p>
                <BookCall />
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
