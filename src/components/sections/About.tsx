"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { dur, ease, stagger } from "@/lib/motion";
import { ABOUT } from "@/content/site";

/** The quiet section: slower, smaller, human. */
export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const title = root.current!.querySelector<HTMLElement>("h2")!;
        const split = SplitText.create(title, {
          type: "words",
          mask: "words",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, {
              yPercent: 110,
              duration: dur.slow,
              ease: ease.arrive,
              stagger: stagger.word,
              scrollTrigger: { trigger: title, start: "top 80%", once: true },
            }),
        });
        gsap.from(root.current!.querySelectorAll(".about-fade"), {
          autoAlpha: 0,
          y: 16,
          duration: dur.slow,
          ease: ease.arrive,
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 62%", once: true },
        });
        gsap.fromTo(
          root.current!.querySelector(".photo-slot"),
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 1.1,
            ease: ease.shutter,
            scrollTrigger: { trigger: root.current!.querySelector(".photo-slot"), start: "top 78%", once: true },
          }
        );
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="relative py-32 lg:py-48" aria-labelledby="about-title">
      <div className="wrap grid12 items-end gap-y-14">
        <div className="col-span-4 lg:col-span-5 lg:col-start-2">
          <h2 id="about-title" className="t-h2">
            {ABOUT.title}
          </h2>
          <div className="mt-8 grid gap-5">
            {ABOUT.body.map((line) => (
              <p key={line} className="about-fade t-body text-chalk">
                {line}
              </p>
            ))}
          </div>
          <ul className="about-fade mt-10 grid gap-0">
            {ABOUT.facts.map((f) => (
              <li key={f} className="fd border-t border-rule py-3 text-[1.25rem] [font-weight:600] [--wdth:66] last:border-b">
                {f}
              </li>
            ))}
          </ul>
        </div>

        <figure className="col-span-4 sm:col-span-3 lg:col-span-4 lg:col-start-8">
          {/* TODO: replace with a real photo (next/image) and real alt text, e.g. "Founder at the front desk of a client's clinic in Anna Nagar". */}
          <div className="photo-slot" data-cursor="media" role="img" aria-label="Photo placeholder">
            <span className="tag">Photo placeholder</span>
          </div>
          <figcaption className="t-small text-dim mt-3">{ABOUT.photoNote}</figcaption>
        </figure>
      </div>
    </section>
  );
}
