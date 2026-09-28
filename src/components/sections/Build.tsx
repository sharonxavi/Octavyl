"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Flip, gsap, SplitText, useGSAP } from "@/lib/gsap";
import { dur, ease, MQ, stagger } from "@/lib/motion";
import { clock, spoken } from "@/lib/time";
import { renderReply, type Lang } from "@/lib/demo";
import { BUILD } from "@/content/site";
import { useTrade } from "../TradeProvider";
import { TradeSelect } from "../TradeSelect";
import { BookCall } from "../BookCall";

const REST = 56;
const HOVER = 63;
const CHOSEN = 74;
const CHOSEN_PHONE = 64;
const MIN_T = 7 * 60;
const MAX_T = 23 * 60 + 30;

export function Build() {
  const root = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const pieces = BUILD.rows.filter((r) => selected.includes(r.id));

  const animateRow = (id: string, to: number, weight: number, fast = false) => {
    const label = root.current?.querySelector<HTMLElement>(`[data-row="${id}"] .x-label`);
    if (!label) return;
    const still = window.matchMedia(MQ.reduce).matches;
    gsap.to(label, { "--wdth": to, fontWeight: weight, duration: still ? 0 : fast ? dur.quick : dur.base, ease: ease.arrive, overwrite: "auto" });
  };

  const toggle = (id: string) => {
    const panel = panelRef.current;
    if (panel) flipState.current = Flip.getState(panel.querySelectorAll("[data-flip]"));
    const on = !selected.includes(id);
    const narrow = window.matchMedia("(max-width: 767.98px)").matches;
    animateRow(id, on ? (narrow ? CHOSEN_PHONE : CHOSEN) : REST, on ? 700 : 560);
    setSelected((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  // Rearrange the build panel smoothly when pieces come and go.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;
    if (window.matchMedia(MQ.reduce).matches) return;
    Flip.from(state, {
      duration: dur.base,
      ease: ease.arrive,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: dur.base, ease: ease.arrive }),
    });
  }, [selected]);

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
        // Rows are painted on: they unroll from the left while widening to their resting width.
        const labels = root.current!.querySelectorAll<HTMLElement>(".x-label");
        gsap.fromTo(
          labels,
          { clipPath: "inset(0 100% 0 0)", "--wdth": 50 },
          {
            clipPath: "inset(0 0% 0 0)",
            "--wdth": REST,
            duration: dur.slow,
            ease: ease.shutter,
            stagger: 0.07,
            clearProps: "clipPath",
            scrollTrigger: { trigger: root.current!.querySelector(".x-list"), start: "top 78%", once: true },
          }
        );
        return () => splits.forEach((s) => s.revert());
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // Phone sheet: focus in, Escape out, focus back to the bar.
  const barButton = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (!sheetOpen) return;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>("button, a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    const trigger = barButton.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [sheetOpen]);

  const panelBody = (
    <>
      <p className="fd text-[1.5rem] [font-weight:700] [--wdth:60]">{BUILD.panelTitle}</p>
      <ul className="mt-4" aria-live="polite">
        {pieces.length === 0 && (
          <li data-flip className="build-empty t-small text-dim py-3">
            {BUILD.empty}
          </li>
        )}
        {pieces.map((p) => (
          <li key={p.id} data-flip className="piece">
            <p className="piece-name">{p.piece}</p>
            <p className="mt-1 t-small text-dim">{p.does}</p>
          </li>
        ))}
      </ul>
      <div data-flip className="mt-6">
        <p className="t-small text-dim">{BUILD.price}</p>
        <div className="mt-4">
          <BookCall />
        </div>
      </div>
    </>
  );

  return (
    <section id="build" ref={root} className="relative py-32 lg:py-44" aria-labelledby="build-title">
      <div className="wrap grid12 gap-y-12">
        <div className="col-span-4 lg:col-span-7">
          <h2 id="build-title" className="t-h2" data-split>
            {BUILD.title}
          </h2>
          <p className="t-lead mt-5" data-split>
            {BUILD.lead}
          </p>
          <ul className="x-list mt-12" aria-label="Problems at your shop">
            {BUILD.rows.map((r) => {
              const on = selected.includes(r.id);
              return (
                <li key={r.id} data-row={r.id}>
                  <button
                    type="button"
                    className="x-row"
                    aria-pressed={on}
                    onClick={() => toggle(r.id)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && !on && animateRow(r.id, HOVER, 600, true)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && !on && animateRow(r.id, REST, 560, true)}
                  >
                    <span className="x-tick" aria-hidden="true" />
                    <span className="x-label">{r.problem}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="hidden lg:col-span-4 lg:col-start-9 lg:block" aria-label={BUILD.panelTitle}>
          <div ref={panelRef} className="build-panel lg:sticky lg:top-28">
            {panelBody}
          </div>
        </aside>
      </div>

      {/* Phones: the build lives in a bar that opens into a sheet. */}
      <div className="build-bar lg:hidden">
        <button ref={barButton} type="button" className="build-bar-button" aria-expanded={sheetOpen} onClick={() => setSheetOpen(true)}>
          <span>
            {BUILD.panelTitle}: <b>{pieces.length}</b> {pieces.length === 1 ? "piece" : "pieces"}
          </span>
          <span className="text-dawn">Open</span>
        </button>
      </div>
      {sheetOpen && (
        <div className="build-sheet lg:hidden" role="dialog" aria-modal="true" aria-label={BUILD.panelTitle}>
          <div ref={sheetRef} className="build-sheet-inner">
            <div className="flex justify-end">
              <button type="button" className="quiet-toggle" onClick={() => setSheetOpen(false)}>
                Close
              </button>
            </div>
            <div>{panelBody}</div>
          </div>
        </div>
      )}

      <Demo />
    </section>
  );
}

function Demo() {
  const { trade, tradeId } = useTrade();
  const [minutes, setMinutes] = useState(19 * 60 + 40);
  const [lang, setLang] = useState<Lang>("en");
  const out = useRef<HTMLParagraphElement>(null);
  const { state, text } = useMemo(() => renderReply(trade, minutes, lang), [trade, minutes, lang]);
  const key = `${tradeId}-${state}-${lang}-${minutes < trade.open}`;
  const pct = ((minutes - MIN_T) / (MAX_T - MIN_T)) * 100;
  const closePct = ((trade.close - MIN_T) / (MAX_T - MIN_T)) * 100;

  // The reply re-sets itself only when its wording actually changes.
  const lastKey = useRef(key);
  useLayoutEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    if (!out.current || window.matchMedia(MQ.reduce).matches) return;
    gsap.fromTo(out.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: dur.base, ease: ease.arrive });
  }, [key]);

  return (
    <div className="wrap mt-24 lg:mt-36">
      <div className="demo grid12 gap-y-10 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="col-span-4 lg:col-span-5">
          <h3 className="t-h3">{BUILD.demoTitle}</h3>
          <p className="t-small text-dim mt-3 max-w-[44ch]">
            Pick a trade and the time of the call. This is the exact reply your customer would get.
          </p>

          <div className="mt-8 grid gap-7">
            <p className="fd text-[1.25rem] [font-weight:620] [--wdth:66]">
              Your trade: <TradeSelect label="Trade for the demo" />
            </p>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="call-time" className="t-small text-dim">
                  Time of the missed call
                </label>
                <span className="t-data text-[1.25rem]" aria-hidden="true">
                  {clock(minutes)}
                </span>
              </div>
              <div className="relative mt-1">
                <input
                  id="call-time"
                  type="range"
                  className="range"
                  min={MIN_T}
                  max={MAX_T}
                  step={5}
                  value={minutes}
                  aria-valuetext={spoken(minutes)}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  style={{ ["--fill" as string]: `${pct}%` }}
                />
                <span className="range-mark" style={{ left: `${closePct}%` }} aria-hidden="true">
                  Closes {clock(trade.close)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="t-small text-dim">Reply in</span>
              <div className="seg" role="group" aria-label="Reply language">
                <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
                  English
                </button>
                <button type="button" aria-pressed={lang === "ta"} onClick={() => setLang("ta")} lang="ta">
                  தமிழ்
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 lg:col-span-6 lg:col-start-7">
          <div className="demo-out p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="state-pill" data-state={state}>
                {state === "busy" ? "Shop open, you're busy" : "Shutter down"}
              </span>
              <span className="t-small text-dim">Sent {clock(minutes + 1)}</span>
            </div>
            <p ref={out} className="demo-text mt-6 text-[1.1875rem] leading-[1.55] text-chalk" lang={lang === "ta" ? "ta" : "en"} aria-live="polite">
              {text}
            </p>
            <p className="t-small text-dim mt-6 border-t border-rule pt-4">{BUILD.demoNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
