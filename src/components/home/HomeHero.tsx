"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { MQ, scrub } from "@/lib/motion";
import { HOME_HERO } from "@/content/home";
import { BookCall } from "@/components/BookCall";
import { Magnetic } from "@/components/Magnetic";
import { TransitionLink } from "@/components/shell/PageTransition";

// The route field is the one heavy piece on the page. It never renders on the
// server and is only fetched once the browser is idle after first paint.
const HeroField = dynamic(() => import("./HeroField").then((m) => m.HeroField), { ssr: false });

/**
 * Home hero. The headline, sub and actions arrive with CSS keyframes (hero.css),
 * so they paint before hydration. Behind them, the route field draws the
 * business's messages finding their way to an agent and then to a booking.
 */
export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const [fieldOn, setFieldOn] = useState(false);

  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const start = () => setFieldOn(true);
    // Safari has no requestIdleCallback: a short timeout does the same job there.
    const ric = typeof window.requestIdleCallback === "function";
    if (ric) idle = window.requestIdleCallback(start, { timeout: 1200 });
    else timer = window.setTimeout(start, 450);
    return () => {
      if (ric && idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Hand-off: as the story starts, the headline lags the page a little and the map recedes.
      mm.add(MQ.full, () => {
        const scrollTrigger = {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: scrub.drift,
          invalidateOnRefresh: true,
        };
        gsap.to(copy.current, { y: () => (root.current?.offsetHeight ?? 0) * 0.12, ease: "none", scrollTrigger });
        gsap.to(field.current, { opacity: 0.35, ease: "none", scrollTrigger: { ...scrollTrigger } });
      });

      // The scroll cue has done its job once the page has moved.
      ScrollTrigger.create({
        start: 40,
        end: "max",
        onToggle: (self) => cue.current?.classList.toggle("is-away", self.isActive),
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="top" ref={root} className="hh" aria-labelledby="top-title">
      <div ref={field} className="hh-field" aria-hidden="true">
        {fieldOn && <HeroField host={root} />}
      </div>

      <div className="hh-body wrap">
        <div ref={copy} className="hh-copy">
          <h1 id="top-title" className="hh-title">
            <span className="hh-mask">
              <span className="hh-line hh-line-1">{HOME_HERO.lines[0]}</span>
            </span>{" "}
            <span className="hh-mask">
              <span className="hh-line hh-line-2">{HOME_HERO.lines[1]}</span>
            </span>
          </h1>
          <p className="hh-sub t-lead">{HOME_HERO.sub}</p>
          <div className="hh-actions">
            <BookCall wide />
            <Magnetic className="w-full sm:w-auto">
              <TransitionLink href="/solutions" className="btn btn-quiet btn-lg-mobile" data-cursor="link">
                <span data-magnet-label className="inline-block">
                  {HOME_HERO.secondary}
                </span>
              </TransitionLink>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* The key to the map. Both the map and its key are decoration, so screen readers skip them. */}
      <div className="hh-foot wrap" aria-hidden="true">
        <div ref={cue} className="hh-cue">
          <span className="hh-cue-rule">
            <i />
          </span>
          <span className="t-small text-dim">{HOME_HERO.cue}</span>
        </div>
        <div className="hh-legend">
          <ul className="hh-key t-small text-dim">
            {HOME_HERO.legend.map((item) => (
              <li key={item.kind}>
                <i className={`hh-mark hh-mark-${item.kind}`} />
                {item.label}
              </li>
            ))}
          </ul>
          <p className="hh-note t-small text-dim">
            <i className="hh-mark hh-mark-message" />
            <span>{HOME_HERO.legendNote}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
