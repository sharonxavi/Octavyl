"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ, stagger } from "@/lib/motion";
import { clock, toMin } from "@/lib/time";
import { getLenis, onAnchorClick } from "@/lib/scroll";
import { BRAND, CONTACT, EMAIL, LEGAL_NAME, whatsappHref } from "@/content/site";
import { useTrade } from "../TradeProvider";
import { BookCall } from "../BookCall";
import { Magnetic } from "../Magnetic";
import { RegisterView, type RowView } from "../Register";

const SLATS = 10;

/**
 * The closing transition: the register you watched fill in the hero comes back
 * full, then the shop's shutter comes down over it. The contact details are
 * painted on the shutter, and its buttons still work.
 */
export function Contact() {
  const { trade } = useTrade();
  const root = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const q = gsap.utils.selector(root);

      mm.add(MQ.full, () => {
        gsap.set(sheet.current, { yPercent: -100 });
        gsap.set(q(".paint-in"), { yPercent: 110 });
        gsap.set(q(".paint-fade"), { autoAlpha: 0, y: 14 });
        const tl = gsap.timeline({
          scrollTrigger: {
            id: "pin-contact",
            trigger: root.current,
            start: "top top",
            end: () => "+=" + window.innerHeight * 1.4,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.to(q(".inside"), { scale: 0.97, autoAlpha: 0.55, duration: 0.7, ease: "none" }, 0.1)
          .to(sheet.current, { yPercent: 0, duration: 0.7, ease: ease.shutter }, 0.1)
          .to(sheet.current, { yPercent: -1.4, duration: 0.05, ease: "power1.out" }, 0.8)
          .to(sheet.current, { yPercent: 0, duration: 0.07, ease: ease.settle }, 0.85)
          .to(q(".paint-in"), { yPercent: 0, duration: 0.25, ease: ease.arrive, stagger: 0.03 }, 0.82)
          .to(q(".paint-fade"), { autoAlpha: 1, y: 0, duration: 0.2, ease: ease.arrive }, 0.9);

        // A keyboard user tabbing into the painted buttons gets the shutter down first.
        const onFocus = () => {
          const st = ScrollTrigger.getById("pin-contact");
          if (st && st.progress < 0.99) getLenis()?.scrollTo(st.end, { immediate: true, force: true });
        };
        root.current!.addEventListener("focusin", onFocus);
        return () => root.current?.removeEventListener("focusin", onFocus);
      });

      // Phones and tablets: no pin. The shutter comes down as the section rises into view.
      mm.add(MQ.compact, () => {
        gsap.fromTo(
          sheet.current,
          { yPercent: -100 },
          { yPercent: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top 95%", end: "top 5%", scrub: 0.6 } }
        );
        gsap.fromTo(
          q(".paint-fade"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: dur.slow, ease: ease.arrive, scrollTrigger: { trigger: root.current, start: "top 10%", toggleActions: "play none none reverse" } }
        );
        gsap.fromTo(
          q(".paint-in"),
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: dur.slow,
            ease: ease.arrive,
            stagger: stagger.line,
            scrollTrigger: { trigger: root.current, start: "top 10%", toggleActions: "play none none reverse" },
          }
        );
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // Inside the shop: tomorrow's register, full.
  const slotEntries = trade.incoming.filter((m) => m.to === "slot");
  let k = 0;
  const rows: RowView[] = trade.register.map((r) => {
    if (r.who) return { time: r.time, state: "preset", entry: `${r.who}, ${r.what}`, status: "Booked earlier" };
    const m = slotEntries[k++];
    return m
      ? { time: r.time, state: "booked", entry: `${m.who}, ${m.what}`, status: `Booked ${clock(toMin(m.at) + 2)}` }
      : { time: r.time, state: "free" };
  });

  const waText = `Hi, I run ${trade.article} ${trade.label} in Chennai. I'd like to book a call.`; // TODO: adjust the prefilled message.

  return (
      <section id="contact" ref={root} className="shopfront" aria-labelledby="contact-title">
        <div className="inside wrap flex h-full items-center justify-center" aria-hidden="true">
          <div className="w-full max-w-[540px]">
            <RegisterView
              id="shop-reg"
              rows={rows}
              clock="20:58"
              hours={`${trade.label[0].toUpperCase()}${trade.label.slice(1)}, closing up`}
              needs={1}
              header={<>Tomorrow: full</>}
            />
          </div>
        </div>

        <div ref={sheet} className="shutter">
          {Array.from({ length: SLATS }, (_, i) => (
            <div key={i} className="slat" aria-hidden="true" />
          ))}
          <div className="rail" aria-hidden="true" />

          <div className="paint">
            <div className="wrap flex items-baseline justify-between gap-6">
              <span className="block overflow-hidden">
                <span className="paint-in wordmark block text-[2rem] sm:text-[2.4rem]">{BRAND}</span>
              </span>
              <span className="hidden overflow-hidden sm:block">
                <span className="paint-in block t-small text-dim">{CONTACT.tagline}</span>
              </span>
            </div>

            <div className="wrap">
              <h2 id="contact-title" className="paint-title">
                <span className="block overflow-hidden pb-[0.06em]">
                  <span className="paint-in block">{CONTACT.title}</span>
                </span>
              </h2>
              <div className="overflow-hidden">
                <p className="paint-in t-lead mt-5 text-chalk">{CONTACT.sub}</p>
              </div>
              <div>
                <div className="paint-fade mt-7 flex flex-wrap items-center gap-4">
                  <BookCall wide />
                  <Magnetic className="w-full sm:w-auto">
                    <a
                      href={whatsappHref(waText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-quiet btn-lg-mobile"
                      data-cursor="link"
                    >
                      <span data-magnet-label className="inline-block">
                        {CONTACT.whatsapp}
                      </span>
                    </a>
                  </Magnetic>
                </div>
              </div>
            </div>

            <div className="wrap">
              <div className="overflow-hidden">
                {/* TODO: the real number, painted the way it would be on a shop shutter. */}
                <p className="paint-in paint-phone">{CONTACT.painted}</p>
              </div>
              <div className="overflow-hidden">
                <p className="paint-in paint-last mt-3">{CONTACT.last}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap grid12 gap-y-10 py-16 lg:py-20">
        <div className="col-span-4 lg:col-span-4">
          <p className="wordmark">{BRAND}</p>
          <p className="t-small text-dim mt-3 max-w-[30ch]">{CONTACT.footer.serving}</p>
        </div>
        <dl className="col-span-4 grid gap-8 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
          <div>
            <dt className="t-small text-dim">Visit</dt>
            <dd className="mt-1">{CONTACT.footer.visit}</dd>
          </div>
          <div>
            <dt className="t-small text-dim">Hours</dt>
            <dd className="mt-1">{CONTACT.footer.hours}</dd>
          </div>
          <div>
            <dt className="t-small text-dim">Write</dt>
            <dd className="mt-1">
              <a className="link" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </dd>
          </div>
        </dl>
      </div>
      <div className="border-t border-rule">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="t-small text-dim">
            © 2026 {LEGAL_NAME}
          </p>
          <a href="#top" className="t-small link" onClick={onAnchorClick}>
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
