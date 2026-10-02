"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ, stagger } from "@/lib/motion";
import { FAQ } from "@/content/home";
import { whatsappHref } from "@/content/site";

const WA_TEXT = "Hi, I have a question about an AI agent for my business."; // TODO: adjust the prefilled message.

/** The lead with "WhatsApp" turned into the link. */
function Lead() {
  const at = FAQ.lead.indexOf("WhatsApp");
  if (at < 0) return <>{FAQ.lead}</>;
  return (
    <>
      {FAQ.lead.slice(0, at)}
      <a className="link" href={whatsappHref(WA_TEXT)} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      {FAQ.lead.slice(at + "WhatsApp".length)}
    </>
  );
}

/**
 * Six questions owners ask before they book. Each opens on its own, several
 * can stay open, and the page re-measures after every change so the pins
 * below it stay honest.
 */
export function Faq() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<boolean[]>(() => FAQ.items.map(() => false));

  const { contextSafe } = useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const title = q(".fq-title")[0] as HTMLElement;
        const split = SplitText.create(title, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: dur.slow,
              ease: ease.arrive,
              stagger: stagger.line,
              scrollTrigger: { trigger: title, start: "top 82%", once: true },
            }),
        });
        gsap.from(q(".fq-lead"), {
          autoAlpha: 0,
          y: 14,
          duration: dur.slow,
          ease: ease.arrive,
          delay: 0.2,
          scrollTrigger: { trigger: title, start: "top 82%", once: true },
        });

        // Rules draw across first, then each question settles onto its line.
        const list = q(".fq-list")[0];
        gsap.fromTo(
          q(".fq-rule"),
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1,
            ease: ease.shutter,
            stagger: 0.07,
            scrollTrigger: { trigger: list, start: "top 82%", once: true },
          }
        );
        gsap.from(q(".fq-q"), {
          autoAlpha: 0,
          y: 16,
          duration: dur.slow,
          ease: ease.arrive,
          stagger: 0.07,
          delay: 0.12,
          scrollTrigger: { trigger: list, start: "top 82%", once: true },
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // contextSafe is applied at click time, so the tweens belong to this section's GSAP context.
  const toggle = (i: number) =>
    contextSafe(() => {
      const item = root.current?.querySelectorAll<HTMLElement>(".fq-item")[i];
      const region = item?.querySelector<HTMLElement>(".fq-a");
      const inner = item?.querySelector<HTMLElement>(".fq-a-inner");
      if (!region || !inner) return;
      const next = !open[i];
      setOpen((prev) => prev.map((v, k) => (k === i ? next : v)));

      gsap.killTweensOf([region, inner]);
      // Hand the final state back to the stylesheet ([data-open]) and re-measure the page.
      const settle = () => {
        gsap.set(region, { clearProps: "height,visibility" });
        if (!next) gsap.set(inner, { clearProps: "opacity,visibility,transform" });
        ScrollTrigger.refresh();
      };

      // Reduced motion: the answer is simply there, or not.
      if (window.matchMedia(MQ.reduce).matches) {
        gsap.set(region, { clearProps: "height,visibility" });
        gsap.set(inner, { clearProps: "opacity,visibility,transform" });
        requestAnimationFrame(() => ScrollTrigger.refresh());
        return;
      }

      // Tweens start from the current height, so a second click mid-way reverses cleanly.
      const from = region.offsetHeight;
      if (next) {
        gsap.set(region, { visibility: "visible" });
        gsap.fromTo(region, { height: from }, { height: "auto", duration: 0.5, ease: ease.arrive, onComplete: settle });
        gsap.fromTo(
          inner,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: ease.arrive, delay: 0.06, clearProps: "opacity,visibility,transform" }
        );
      } else {
        gsap.fromTo(region, { height: from, visibility: "visible" }, { height: 0, duration: 0.35, ease: ease.leave, onComplete: settle });
        gsap.to(inner, { autoAlpha: 0, y: 4, duration: 0.25, ease: ease.leave });
      }
    })();

  return (
    <section id="faq" ref={root} className="fq relative py-28 lg:py-40" aria-labelledby="faq-title">
      <div className="wrap grid12 gap-y-12">
        <div className="col-span-4 lg:col-span-4">
          <div className="fq-side">
            <h2 id="faq-title" className="fq-title t-h2">
              {FAQ.title}
            </h2>
            <p className="fq-lead t-lead">
              <Lead />
            </p>
          </div>
        </div>

        <div className="fq-list col-span-4 lg:col-span-7 lg:col-start-6">
          {FAQ.items.map((item, i) => (
            <div key={item.q} className="fq-item" data-open={open[i]}>
              <span className="fq-rule" aria-hidden="true" />
              <h3 className="fq-h">
                <button
                  type="button"
                  id={`fq-q-${i}`}
                  className="fq-q"
                  aria-expanded={open[i]}
                  aria-controls={`fq-a-${i}`}
                  onClick={() => toggle(i)}
                >
                  <span className="fq-q-text">{item.q}</span>
                  <span className="fq-icon" aria-hidden="true" />
                </button>
              </h3>
              <div id={`fq-a-${i}`} className="fq-a" role="region" aria-labelledby={`fq-q-${i}`}>
                <div className="fq-a-inner">
                  <p className="fq-answer">{item.a}</p>
                  {"confirm" in item && item.confirm ? (
                    <p className="fq-confirm">
                      <span className="todo">{item.confirm}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
