"use client";

import { useCallback, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ } from "@/lib/motion";
import { getLenis } from "@/lib/scroll";
import { SERVICES } from "@/content/home";
import { ServiceArt } from "./ServiceArt";

const ITEMS = SERVICES.items;
const N = ITEMS.length;
const pad = (n: number) => String(n).padStart(2, "0");

/** What each drawing shows, for the replay button's label. */
const ART_LABEL: Record<(typeof ITEMS)[number]["id"], string> = {
  booking: "A WhatsApp message goes to the agent, which books a free slot in tomorrow's calendar.",
  reception: "A call is answered by the agent; an unusual one is passed to you.",
  whatsapp: "Three messages arrive and each gets a reply from your number.",
  leads: "An enquiry from an ad gets follow-ups on day 1, 3 and 7 until it books.",
  workflow: "Today's bills are copied into your sheet and a summary goes out at 9pm.",
};

/**
 * What we build. Desktop with motion: the section pins and scrolling walks the
 * five agents; hover, focus or click picks one directly. The panel on the right
 * shows what it does and a drawing of the flow, which replays on click.
 * Phones, tablets and reduced motion: a plain accordion with the same content.
 */
export function Services() {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState<number | null>(0);
  const [pinned, setPinned] = useState(false);
  const [replay, setReplay] = useState(0);
  const shown = useRef<number | null>(0);

  // Pinned mode: one ScrollTrigger maps progress to the active agent.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.full, () => {
        const panels = gsap.utils.toArray<HTMLElement>(".sv-panel", root.current);
        const start = shown.current ?? 0;
        gsap.set(panels, { autoAlpha: (i: number) => (i === start ? 1 : 0) });
        setPinned(true);
        setActive(start);
        let last = -1;
        const st = ScrollTrigger.create({
          id: "pin-services",
          trigger: root.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 2.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(bar.current, { scaleX: self.progress });
            const i = Math.min(N - 1, Math.floor(self.progress * N));
            if (i !== last) {
              last = i;
              setActive(i);
            }
          },
        });
        return () => {
          st.kill();
          setPinned(false);
        };
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // Pinned mode: swap the panel. The old text lifts away, the new text rises in.
  useGSAP(
    () => {
      if (!pinned || active === null) return;
      const prev = shown.current;
      shown.current = active;
      if (prev === active) return;
      const panels = gsap.utils.toArray<HTMLElement>(".sv-panel", root.current);
      const out = prev !== null ? panels[prev] : null;
      const next = panels[active];
      if (out) {
        gsap.to(out.querySelectorAll(".sv-in"), { y: -12, autoAlpha: 0, duration: 0.25, ease: ease.leave, overwrite: true });
        gsap.to(out, { autoAlpha: 0, duration: 0.01, delay: 0.26, overwrite: true });
      }
      gsap.set(next, { autoAlpha: 1, overwrite: true });
      gsap.fromTo(
        next.querySelectorAll(".sv-in"),
        { y: 22, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: dur.base, ease: ease.arrive, stagger: 0.05, delay: 0.12, overwrite: true }
      );
    },
    { dependencies: [active, pinned], scope: root }
  );

  // Section reveal for both modes: the header and list rise in once.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current!.querySelectorAll(".sv-rise"), {
          y: 28,
          autoAlpha: 0,
          duration: dur.slow,
          ease: ease.arrive,
          stagger: 0.06,
          scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  const goTo = useCallback(
    (i: number) => {
      if (!pinned) {
        // Accordion: toggle, and re-measure the page once the height has settled.
        setActive((cur) => (cur === i ? null : i));
        window.setTimeout(() => ScrollTrigger.refresh(), 560);
        return;
      }
      setActive(i);
      const st = ScrollTrigger.getById("pin-services");
      if (st) getLenis()?.scrollTo(st.start + ((i + 0.5) / N) * (st.end - st.start), { duration: 1 });
    },
    [pinned]
  );

  return (
    <section id="services" ref={root} className={`sv ${pinned ? "is-pinned" : ""}`} aria-labelledby="services-title">
      <div className="wrap sv-inner">
        <header className="sv-head">
          <h2 id="services-title" className="t-h2 sv-rise">
            {SERVICES.title}
          </h2>
          <p className="t-lead sv-rise">{SERVICES.lead}</p>
        </header>

        <div className="sv-body">
          <ol className="sv-list">
            {ITEMS.map((s, i) => {
              const open = active === i;
              return (
                <li key={s.id} className={`sv-item ${open ? "is-open" : ""}`}>
                  {/* The reveal moves the heading, never the li: a transform there would re-anchor the panel. */}
                  <h3 className="sv-h sv-rise">
                    <button
                      id={`sv-btn-${i}`}
                      type="button"
                      className="sv-btn"
                      aria-expanded={open}
                      aria-controls={`sv-panel-${i}`}
                      onClick={() => goTo(i)}
                      onPointerEnter={(e) => pinned && e.pointerType === "mouse" && setActive(i)}
                      onFocus={() => pinned && setActive(i)}
                    >
                      <span className="sv-num t-data" aria-hidden="true">
                        {pad(i + 1)}
                      </span>
                      <span className="sv-title">{s.title}</span>
                      <span className="sv-plus" aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={`sv-panel-${i}`} className="sv-panel" role="region" aria-labelledby={`sv-btn-${i}`}>
                    <div className="sv-clip">
                      <div className="sv-panel-inner">
                        <button
                          type="button"
                          className="sv-art-frame sv-in"
                          data-cursor="explore"
                          data-cursor-label="Replay"
                          onClick={() => setReplay((n) => n + 1)}
                        >
                          {/* The name comes from this text, not aria-label: the drawing's own words stay hidden from it. */}
                          <span className="sr-only">Replay the example: {ART_LABEL[s.id]}</span>
                          <ServiceArt key={open ? `on-${replay}` : "off"} kind={s.id} active={open} />
                        </button>
                        <p className="sv-outcome sv-in">{s.outcome}</p>
                        <div className="sv-builds">
                          <p className="sv-label t-small sv-in">{SERVICES.buildsLabel}</p>
                          <ul>
                            {s.builds.map((b) => (
                              <li key={b} className="sv-in">
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="sv-progress" aria-hidden="true">
            <span ref={bar} />
          </div>
        </div>
      </div>
    </section>
  );
}
