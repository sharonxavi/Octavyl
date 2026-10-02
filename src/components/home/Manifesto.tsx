"use client";

import { Fragment, useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { MQ } from "@/lib/motion";
import { MANIFESTO } from "@/content/home";

// "[[phrase]]" marks an accent phrase: odd entries after the split are the phrases.
const PARTS = MANIFESTO.text.split(/\[\[(.+?)\]\]/);

/**
 * What we believe. One paragraph, set large, that brightens word by word as it
 * is read down the page. The words stay in reading order in the DOM, so screen
 * readers get the plain paragraph; the split is visual only.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const text = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const read = (scrub: number) => {
        const el = text.current;
        if (!el) return;
        const split = SplitText.create(el, { type: "words", tag: "span", wordsClass: "mf-w", aria: "none" });
        gsap.fromTo(
          split.words,
          // Starts at half strength: dim enough to read as "not yet", bright enough to pass large-text contrast.
          { opacity: 0.5 },
          {
            opacity: 1,
            ease: "none",
            duration: 1,
            stagger: 0.18,
            scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 55%", scrub },
          }
        );
        return () => split.revert();
      };
      // Reduced motion never splits: the paragraph is simply there, at full strength.
      mm.add(MQ.full, () => read(0.6));
      mm.add(MQ.compact, () => read(0.4));
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="belief" ref={root} className="mf py-32 lg:py-48" aria-labelledby="belief-title">
      <div className="wrap grid12 mf-grid">
        <h2 id="belief-title" className="mf-label t-small text-dim">
          {MANIFESTO.label}
        </h2>
        <p ref={text} className="mf-text">
          {PARTS.map((part, i) =>
            i % 2 ? (
              <em key={i} className="mf-key">
                {part}
              </em>
            ) : (
              <Fragment key={i}>{part}</Fragment>
            )
          )}
        </p>
      </div>
    </section>
  );
}
