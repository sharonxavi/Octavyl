"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ, stagger } from "@/lib/motion";
import { PROCESS } from "@/content/site";

export function Process() {
  const root = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const lamp = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const heads = root.current!.querySelectorAll<HTMLElement>("[data-split]");
        const splits = Array.from(heads).map((el) =>
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            // aria-label is not allowed on a plain <p>; split lines still read in order.
            aria: el.tagName === "P" ? "none" : "auto",
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 105,
                duration: dur.slow,
                ease: ease.arrive,
                stagger: stagger.line,
                scrollTrigger: { trigger: el, start: "top 80%", once: true },
              }),
          })
        );

        // Each step opens like a shutter lifting, top edge first.
        root.current!.querySelectorAll<HTMLElement>(".step").forEach((step) => {
          gsap.fromTo(
            step.querySelectorAll(".step-reveal"),
            { clipPath: "inset(0 0 100% 0)", y: 18 },
            {
              clipPath: "inset(0 0 0% 0)",
              y: 0,
              duration: dur.slow,
              ease: ease.shutter,
              stagger: stagger.line,
              clearProps: "clipPath",
              scrollTrigger: { trigger: step, start: "top 75%", toggleActions: "play none none reverse" },
            }
          );
        });

        // The progress lamp follows your scroll down the steps.
        gsap.fromTo(
          lamp.current,
          { scaleY: 0 },
          { scaleY: 1, ease: "none", scrollTrigger: { trigger: list.current, start: "top 55%", end: "bottom 55%", scrub: 0.6 } }
        );
        return () => splits.forEach((s) => s.revert());
      });

      // Desktop: the big numeral rolls from 1 to 5 like an odometer, one click per step.
      mm.add(MQ.full, () => {
        const steps = root.current!.querySelectorAll<HTMLElement>(".step");
        let current = 0;
        const go = (i: number) => {
          if (i === current) return;
          current = i;
          gsap.to(stack.current, { yPercent: -20 * i, duration: dur.base, ease: ease.shutter, overwrite: "auto" });
        };
        const triggers = Array.from(steps).map((step, i) =>
          ScrollTrigger.create({
            trigger: step,
            start: "top 55%",
            end: "bottom 55%",
            onToggle: (self) => self.isActive && go(i),
          })
        );
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="process" ref={root} className="relative py-32 lg:py-40" aria-labelledby="process-title">
      <div className="wrap grid12 gap-y-10">
        <div className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-[24vh]">
            <div className="odo" aria-hidden="true">
              <div ref={stack} className="odo-stack">
                {PROCESS.steps.map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
            </div>
            <p className="t-small text-dim mt-5">of {PROCESS.steps.length} steps</p>
          </div>
        </div>

        <div className="col-span-4 lg:col-span-8 lg:col-start-5">
          <h2 id="process-title" className="t-h2" data-split>
            {PROCESS.title}
          </h2>
          <p className="t-lead mt-5" data-split>
            {PROCESS.lead}
          </p>

          <div className="relative mt-14">
            <span className="lamp" aria-hidden="true">
              <i ref={lamp} />
            </span>
            <ol ref={list} className="steps">
            {PROCESS.steps.map((s, i) => (
              <li key={s.verb} className="step">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.4fr)] lg:gap-10">
                  <h3 className="step-reveal t-h3 flex items-baseline gap-4">
                    <span className="step-num lg:hidden" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.verb}
                  </h3>
                  <dl className="grid gap-5 sm:grid-cols-[1.4fr_1fr_0.7fr] sm:gap-6">
                    <div className="step-reveal">
                      <dt>{PROCESS.cols[0]}</dt>
                      <dd>{s.we}</dd>
                    </div>
                    <div className="step-reveal">
                      <dt>{PROCESS.cols[1]}</dt>
                      <dd>{s.you}</dd>
                    </div>
                    <div className="step-reveal">
                      <dt>{PROCESS.cols[2]}</dt>
                      <dd className="t-data text-[1.0625rem]">{s.when}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
