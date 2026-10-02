"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { dur, ease } from "@/lib/motion";
import { CONTACT_HOME } from "@/content/home";
import { AREA, CONTACT, EMAIL, HOURS, PHONE_DISPLAY, whatsappHref } from "@/content/site";
import { BookCall } from "@/components/BookCall";
import { ContactForm } from "./ContactForm";

const WA_TEXT = "Hi, I'd like to talk about an AI agent for my business."; // TODO: adjust the prefilled message.

/**
 * The last word on Home: one big line, one call to book, and for anyone who'd
 * rather write, the form and every direct way to reach us.
 */
export function ContactHome() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const title = q(".ct-title")[0] as HTMLElement;
        const split = SplitText.create(title, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 108,
              duration: 1.05,
              ease: ease.arrive,
              stagger: 0.08,
              scrollTrigger: { trigger: title, start: "top 84%", once: true },
            }),
        });
        gsap.from(q(".ct-rise"), {
          autoAlpha: 0,
          y: 18,
          duration: dur.slow,
          ease: ease.arrive,
          stagger: 0.08,
          delay: 0.3,
          scrollTrigger: { trigger: title, start: "top 84%", once: true },
        });

        const lower = q(".ct-lower")[0];
        gsap.fromTo(
          q(".ct-lower-rule"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: ease.shutter, scrollTrigger: { trigger: lower, start: "top 88%", once: true } }
        );
        gsap.from(q(".ct-lower-rise"), {
          autoAlpha: 0,
          y: 22,
          duration: dur.slow,
          ease: ease.arrive,
          stagger: 0.1,
          delay: 0.15,
          scrollTrigger: { trigger: lower, start: "top 82%", once: true },
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="contact" ref={root} className="ct relative py-28 lg:py-40" aria-labelledby="contact-title">
      <div className="wrap">
        <div className="grid12">
          <h2 id="contact-title" className="ct-title col-span-4 lg:col-span-11">
            {CONTACT_HOME.title}
          </h2>
          <div className="col-span-4 lg:col-span-6">
            <p className="ct-rise ct-sub t-lead">{CONTACT_HOME.sub}</p>
            <div className="ct-rise ct-book">
              <BookCall wide className="ct-book-btn" />
            </div>
          </div>
        </div>

        <div className="ct-lower grid12">
          <span className="ct-lower-rule" aria-hidden="true" />

          <address className="ct-direct ct-lower-rise col-span-4 lg:col-span-5">
            <a className="ct-direct-link ct-email" href={`mailto:${EMAIL}`} data-cursor="link">
              {EMAIL}
            </a>
            <a className="ct-direct-link" href={whatsappHref(WA_TEXT)} target="_blank" rel="noopener noreferrer" data-cursor="link">
              {CONTACT.whatsapp}
              <span className="ct-out" aria-hidden="true" />
              <span className="sr-only"> (opens WhatsApp)</span>
            </a>
            <p className="ct-phone">{PHONE_DISPLAY}</p>
            <p className="ct-where">
              {AREA}
              <br />
              {HOURS}
            </p>
          </address>

          <div className="ct-lower-rise col-span-4 lg:col-span-6 lg:col-start-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
