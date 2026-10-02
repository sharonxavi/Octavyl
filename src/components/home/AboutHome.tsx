"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ, stagger } from "@/lib/motion";
import { ABOUT_HOME } from "@/content/home";

const isTodo = (s: string) => s.startsWith("TODO:");

/** A line that may still be a placeholder: placeholders render as a marked chip, real words as themselves. */
function Copy({ text }: { text: string }) {
  return isTodo(text) ? <span className="todo">{text}</span> : <>{text}</>;
}

/**
 * Who we are, told slowly: why it started, the four rules we decide by, and
 * the people you'd actually talk to. No numbers, no counters.
 */
export function AboutHome() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const title = q(".ab-title")[0] as HTMLElement;
        const split = SplitText.create(title, {
          type: "words",
          mask: "words",
          wordsClass: "ab-word",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, {
              yPercent: 110,
              duration: dur.slow,
              ease: ease.arrive,
              stagger: stagger.word,
              scrollTrigger: { trigger: title, start: "top 82%", once: true },
            }),
        });

        gsap.from(q(".ab-story"), {
          autoAlpha: 0,
          y: 16,
          duration: dur.slow,
          ease: ease.arrive,
          delay: 0.2,
          scrollTrigger: { trigger: title, start: "top 82%", once: true },
        });

        // The ledger is ruled line by line: each row wipes in from the left edge.
        const ledger = q(".ab-ledger")[0];
        gsap.from(q(".ab-label"), {
          autoAlpha: 0,
          y: 10,
          duration: dur.base,
          ease: ease.arrive,
          scrollTrigger: { trigger: ledger, start: "top 82%", once: true },
        });
        gsap.fromTo(
          q(".ab-row"),
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: 1,
            ease: ease.shutter,
            stagger: 0.09,
            clearProps: "clipPath",
            scrollTrigger: { trigger: ledger, start: "top 82%", once: true },
          }
        );

        gsap.from(q(".ab-team-title"), {
          autoAlpha: 0,
          y: 16,
          duration: dur.slow,
          ease: ease.arrive,
          scrollTrigger: { trigger: q(".ab-team")[0], start: "top 80%", once: true },
        });

        // Portraits lift into view like a shutter going up, then the words under them.
        q(".ab-person").forEach((person) => {
          const portrait = person.querySelector(".ab-portrait");
          gsap.fromTo(
            portrait,
            { clipPath: "inset(100% 0 0 0)" },
            {
              clipPath: "inset(0% 0 0 0)",
              duration: 1.1,
              ease: ease.shutter,
              scrollTrigger: { trigger: portrait, start: "top 85%", once: true },
            }
          );
          gsap.from(person.querySelectorAll(".ab-person-text > *"), {
            autoAlpha: 0,
            y: 12,
            duration: dur.slow,
            ease: ease.arrive,
            stagger: 0.07,
            delay: 0.5,
            scrollTrigger: { trigger: portrait, start: "top 85%", once: true },
          });
        });

        return () => split.revert();
      });

      // Desktop with motion: the picture inside each frame drifts slower than the page.
      mm.add(MQ.full, () => {
        q(".ab-portrait").forEach((portrait) => {
          gsap.fromTo(
            portrait.querySelector(".ab-portrait-layer"),
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: portrait, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  const { story } = ABOUT_HOME;

  return (
    <section id="about" ref={root} className="ab relative py-28 lg:py-40" aria-labelledby="about-title">
      <div className="wrap grid12 gap-y-16">
        <div className="col-span-4 lg:col-span-5">
          <h2 id="about-title" className="ab-title t-h2">
            {ABOUT_HOME.title}
          </h2>
          {isTodo(story) ? (
            <p className="ab-story todo-block">{story}</p>
          ) : (
            <p className="ab-story t-lead text-chalk">{story}</p>
          )}
        </div>

        <div className="col-span-4 lg:col-span-6 lg:col-start-7">
          <h3 className="ab-label t-small text-dim">{ABOUT_HOME.principlesTitle}</h3>
          <dl className="ab-ledger">
            {ABOUT_HOME.principles.map((p) => (
              <div key={p.title} className="ab-row">
                <dt className="ab-principle">{p.title}</dt>
                <dd className="ab-line">{p.line}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="ab-team wrap grid12 gap-y-10">
        <h3 className="ab-team-title col-span-4 lg:col-span-3">{ABOUT_HOME.teamTitle}</h3>
        <ul className="ab-people col-span-4 lg:col-span-8 lg:col-start-5">
          {ABOUT_HOME.team.map((person, i) => (
            <li key={i} className="ab-person">
              {/* TODO: swap for a real photo (next/image) with real alt text once each person has one. */}
              <div
                className="ab-portrait"
                role="img"
                aria-label={isTodo(person.name) ? ABOUT_HOME.photoLabel : `${ABOUT_HOME.photoLabel}: ${person.name}`}
                data-cursor="media"
              >
                <div className="ab-portrait-layer" aria-hidden="true" />
                <span className="tag ab-tag" aria-hidden="true">
                  {ABOUT_HOME.photoLabel}
                </span>
              </div>
              <div className="ab-person-text">
                <h4 className="ab-name">
                  <Copy text={person.name} />
                </h4>
                <p className="ab-role">
                  <Copy text={person.role} />
                </p>
                <p className="ab-bio">
                  <Copy text={person.bio} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
