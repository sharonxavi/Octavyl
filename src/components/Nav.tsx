"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { dur, ease } from "@/lib/motion";
import { AREA, BRAND, EMAIL, HOURS, NAV, type NavId } from "@/content/site";
import { getLenis, prefersReducedMotion } from "@/lib/scroll";
import { TransitionLink, usePageTransition } from "./shell/PageTransition";
import { BookCall } from "./BookCall";

/** Which item is current: the route, or on Home, the section under the middle of the screen. */
function readSpy(): NavId {
  const mid = window.innerHeight * 0.5;
  const contact = document.getElementById("contact")?.getBoundingClientRect();
  if (contact && contact.top < mid) return "contact";
  const about = document.getElementById("about")?.getBoundingClientRect();
  if (about && about.top < mid && about.bottom > mid) return "about";
  return "home";
}

export function Nav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const { navigate } = usePageTransition();
  const bar = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [spy, setSpy] = useState<NavId>("home");
  const [hover, setHover] = useState<NavId | null>(null);
  const [open, setOpen] = useState(false);
  const active: NavId = pathname.startsWith("/solutions") ? "solutions" : onHome ? spy : "home";

  // Solid once the page moves, hidden while reading down, back the moment you scroll up.
  // Class toggles, never React state per frame; the spy only sets state when it changes.
  useLenis(
    ({ scroll, direction }) => {
      const el = bar.current;
      if (!el) return;
      el.classList.toggle("is-solid", scroll > 40);
      if (el.contains(document.activeElement) || open) el.classList.remove("is-hidden");
      else if (direction === 1 && scroll > 480) el.classList.add("is-hidden");
      else if (direction === -1 || scroll <= 480) el.classList.remove("is-hidden");
      if (onHome) setSpy(readSpy());
    },
    [onHome, open]
  );

  // A new page starts at the top with the bar showing.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    el.classList.remove("is-hidden");
    el.classList.toggle("is-solid", window.scrollY > 40);
    const id = requestAnimationFrame(() => onHome && setSpy(readSpy()));
    return () => cancelAnimationFrame(id);
  }, [pathname, onHome]);

  // The marker slides under the hovered item and returns to the current one.
  const place = useCallback((id: NavId, animate: boolean) => {
    const a = list.current?.querySelector<HTMLElement>(`[data-nav="${id}"]`);
    const m = marker.current;
    if (!a || !m) return;
    const props = { x: a.offsetLeft + 12, scaleX: Math.max(1, a.offsetWidth - 24), autoAlpha: 1 };
    if (animate && !prefersReducedMotion()) gsap.to(m, { ...props, duration: dur.base, ease: ease.arrive, overwrite: true });
    else gsap.set(m, props);
  }, []);
  const target = hover ?? active;
  const placed = useRef(false);
  useLayoutEffect(() => {
    place(target, placed.current);
    placed.current = true;
  }, [target, place]);
  useEffect(() => {
    const ul = list.current;
    if (!ul) return;
    const ro = new ResizeObserver(() => place(hover ?? active, false));
    ro.observe(ul);
    return () => ro.disconnect();
  }, [place, hover, active]);

  // Full-screen menu: comes down like the shutter, links rise out of their masks.
  useGSAP(
    () => {
      const el = menu.current;
      if (!el) return;
      const lines = el.querySelectorAll(".menu-line");
      const fades = el.querySelectorAll(".menu-fade");
      if (open) {
        gsap.set(el, { visibility: "visible" });
        if (prefersReducedMotion()) {
          gsap.fromTo(el, { autoAlpha: 0, yPercent: 0 }, { autoAlpha: 1, duration: 0.2 });
          return;
        }
        gsap
          .timeline()
          .fromTo(el, { yPercent: -100, autoAlpha: 1 }, { yPercent: 0, duration: 0.55, ease: ease.shutter })
          .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: dur.slow, ease: ease.arrive, stagger: 0.06 }, 0.22)
          .fromTo(fades, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: dur.base, ease: ease.arrive }, 0.42);
      } else if (el.style.visibility === "visible") {
        const hide = () => gsap.set(el, { visibility: "hidden" });
        if (prefersReducedMotion()) gsap.to(el, { autoAlpha: 0, duration: 0.15, onComplete: hide });
        else gsap.to(el, { yPercent: -100, duration: 0.42, ease: ease.shutter, onComplete: hide });
      }
    },
    { dependencies: [open], scope: menu }
  );

  // While the menu is open: the page behind is inert and still, focus stays inside, Escape closes.
  useEffect(() => {
    if (!open) return;
    const behind = [document.getElementById("content"), document.querySelector<HTMLElement>(".site-footer")];
    behind.forEach((el) => el?.setAttribute("inert", ""));
    getLenis()?.stop();
    const returnTo = menuButton.current;
    const sheet = menu.current;
    sheet?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab" || !sheet) return;
      const items = [returnTo, ...Array.from(sheet.querySelectorAll<HTMLElement>("a, button"))].filter(Boolean) as HTMLElement[];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      behind.forEach((el) => el?.removeAttribute("inert"));
      getLenis()?.start();
      document.removeEventListener("keydown", onKey);
      if (sheet?.contains(document.activeElement)) returnTo?.focus();
    };
  }, [open]);

  // Close the menu if the viewport grows past the phone layout.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const go = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setOpen(false);
    getLenis()?.start();
    navigate(href);
  };

  return (
    <>
      <header ref={bar} className={`nav ${open ? "is-open" : ""}`} onFocus={() => bar.current?.classList.remove("is-hidden")}>
        <div className="wrap flex h-full items-center justify-between gap-6">
          <TransitionLink href="/" onClick={() => setOpen(false)} className="wordmark" data-cursor="link" aria-label={`${BRAND}, home`}>
            {BRAND}
          </TransitionLink>
          <nav aria-label="Main" className="hidden lg:block" onPointerLeave={() => setHover(null)}>
            <ul ref={list} className="nav-list">
              {NAV.map((item) => (
                <li key={item.id}>
                  <TransitionLink
                    href={item.href}
                    data-nav={item.id}
                    className={`nav-link ${active === item.id ? "is-active" : ""}`}
                    aria-current={active === item.id ? (item.id === "about" || item.id === "contact" ? "location" : "page") : undefined}
                    onPointerEnter={() => setHover(item.id)}
                    onFocus={() => setHover(item.id)}
                    onBlur={() => setHover(null)}
                  >
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
            <span ref={marker} className="nav-marker" aria-hidden="true" />
          </nav>
          <div className="flex items-center gap-2">
            <BookCall size="sm" />
            <button
              ref={menuButton}
              type="button"
              className="quiet-toggle menu-toggle lg:hidden"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="menu-toggle-bars" aria-hidden="true" />
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        ref={menu}
        className="menu lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        data-lenis-prevent
      >
        <nav aria-label="Main" className="wrap">
          <ul className="menu-list">
            {NAV.map((item, i) => (
              <li key={item.id} className="overflow-hidden">
                <a
                  href={item.href}
                  onClick={go(item.href)}
                  className={`menu-line menu-link ${active === item.id ? "is-active" : ""}`}
                  aria-current={active === item.id ? "page" : undefined}
                >
                  <span className="menu-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="wrap menu-fade mt-auto grid gap-6 pt-10">
          <BookCall wide />
          <dl className="grid grid-cols-2 gap-4 t-small">
            <div>
              <dt className="text-dim">Write</dt>
              <dd className="mt-1 break-all">
                <a className="link" href={`mailto:${EMAIL}`}>
                  {EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-dim">Find us</dt>
              <dd className="mt-1">
                {AREA}
                <br />
                {HOURS}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
