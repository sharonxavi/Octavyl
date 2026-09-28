"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { BRAND, NAV } from "@/content/site";
import { onAnchorClick, scrollToSection } from "@/lib/scroll";
import { Magnetic } from "./Magnetic";
import { BookCall } from "./BookCall";

export function Nav() {
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  // Solid background once the page moves. A class toggle, never React state per frame.
  // Hide while reading down, come back the moment you scroll up.
  useLenis(({ scroll, direction }) => {
    const el = bar.current;
    if (!el) return;
    el.classList.toggle("is-solid", scroll > 40);
    if (el.contains(document.activeElement)) return el.classList.remove("is-hidden");
    if (direction === 1 && scroll > 480) el.classList.add("is-hidden");
    else if (direction === -1 || scroll <= 480) el.classList.remove("is-hidden");
  });
  useEffect(() => {
    bar.current?.classList.toggle("is-solid", window.scrollY > 40);
  }, []);

  // Mobile sheet: lock the page behind it, trap focus, close on Escape.
  useEffect(() => {
    if (!open) return;
    const main = document.getElementById("content");
    main?.setAttribute("inert", "");
    const returnTo = menuButton.current;
    sheet.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && sheet.current) {
        const items = Array.from(sheet.current.querySelectorAll<HTMLElement>("a, button"));
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (!e.shiftKey && i === items.length - 1) {
          e.preventDefault();
          items[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      main?.removeAttribute("inert");
      document.removeEventListener("keydown", onKey);
      returnTo?.focus();
    };
  }, [open]);

  return (
    <>
      <header ref={bar} className="nav" onFocus={() => bar.current?.classList.remove("is-hidden")}>
        <div className="wrap flex h-full items-center justify-between gap-6">
          <a href="#top" onClick={onAnchorClick} className="wordmark" data-cursor="link" aria-label={`${BRAND}, back to top`}>
            {BRAND}
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Magnetic key={item.href} kind="link">
                <a href={item.href} onClick={onAnchorClick} className="nav-link">
                  {item.label}
                </a>
              </Magnetic>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <BookCall size="sm" />
            <button
              ref={menuButton}
              type="button"
              className="quiet-toggle lg:hidden"
              aria-expanded={open}
              aria-controls="menu-sheet"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div id="menu-sheet" ref={sheet} className="menu-sheet lg:hidden" role="dialog" aria-modal="true" aria-label="Sections">
          <ul className="flex flex-col gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="t-h2 block py-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    requestAnimationFrame(() => scrollToSection(item.href.slice(1)));
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <button type="button" className="btn btn-quiet w-full" onClick={() => setOpen(false)}>
              Close menu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
