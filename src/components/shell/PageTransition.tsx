"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ease } from "@/lib/motion";
import { cursorBus } from "@/lib/cursor";
import { getLenis, prefersReducedMotion, scrollToSection, scrollToTop } from "@/lib/scroll";

type Ctx = { navigate: (href: string) => void };
const TransitionContext = createContext<Ctx>({ navigate: () => {} });
export const usePageTransition = () => useContext(TransitionContext);

/** What the shutter says while it's down. */
const LABELS: Record<string, string> = { "/": "Home", "/solutions": "Solutions" };

type Pending = { hash: string | null };

/**
 * Page changes run like the shop shutter: it comes down over the old page,
 * the route swaps behind it, the scroll resets (or lands on the linked
 * section), and it rolls back up. Under 700ms when the route is prefetched.
 * Reduced motion gets a short fade instead.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const wipe = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const pending = useRef<Pending | null>(null);
  const busy = useRef(false);
  const lastPath = useRef<string | null>(null);
  const fallback = useRef(0);

  const reveal = useCallback(() => {
    const el = wipe.current;
    if (!el) return;
    const done = () => {
      busy.current = false;
      gsap.set(el, { autoAlpha: 0, yPercent: -100 });
    };
    if (prefersReducedMotion()) gsap.to(el, { autoAlpha: 0, duration: 0.2, ease: "none", onComplete: done });
    else gsap.to(el, { yPercent: -100, duration: 0.34, ease: ease.shutter, delay: 0.04, onComplete: done });
  }, []);

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.assign(url.href);
        return;
      }
      const hash = url.hash.length > 1 ? decodeURIComponent(url.hash.slice(1)) : null;

      // Same page: scroll there instead of swapping the page for itself.
      if (url.pathname === window.location.pathname) {
        if (hash) {
          if (scrollToSection(hash)) history.replaceState(null, "", window.location.pathname + window.location.search + url.hash);
        } else {
          scrollToTop();
        }
        return;
      }
      if (busy.current) return;
      busy.current = true;
      pending.current = { hash };
      cursorBus.set({ state: "default", label: "" });
      getLenis()?.stop();

      const el = wipe.current!;
      if (label.current) label.current.textContent = LABELS[url.pathname] ?? "";
      const go = () => router.push(url.pathname + url.search, { scroll: false });
      if (prefersReducedMotion()) {
        gsap.fromTo(el, { autoAlpha: 0, yPercent: 0 }, { autoAlpha: 1, duration: 0.12, ease: "none", onComplete: go });
      } else {
        gsap.set(el, { autoAlpha: 1 });
        gsap.fromTo(el, { yPercent: -100 }, { yPercent: 0, duration: 0.3, ease: ease.shutter, onComplete: go });
        gsap.fromTo(label.current, { yPercent: 110 }, { yPercent: 0, duration: 0.35, ease: ease.arrive, delay: 0.1 });
      }
      // Never leave the page covered if the route doesn't arrive.
      window.clearTimeout(fallback.current);
      fallback.current = window.setTimeout(() => {
        pending.current = null;
        getLenis()?.start();
        reveal();
      }, 8000);
    },
    [router, reveal]
  );

  // A new route has committed. Its sections have built their triggers by now
  // (child effects run first), so measure, place the scroll, then open up.
  useEffect(() => {
    if (lastPath.current === pathname) return; // Strict Mode's second run
    const initial = lastPath.current === null;
    lastPath.current = pathname;
    const hashNow = window.location.hash.length > 1 ? decodeURIComponent(window.location.hash.slice(1)) : null;

    if (initial) {
      // Opened with /#about: land on it once fonts and pins have settled.
      if (hashNow) {
        document.fonts?.ready.then(() => {
          ScrollTrigger.refresh();
          scrollToSection(hashNow, { immediate: true });
        });
      }
      return;
    }

    const p = pending.current;
    pending.current = null;
    window.clearTimeout(fallback.current);
    requestAnimationFrame(() => {
      const lenis = getLenis();
      lenis?.start();
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
      lenis?.resize();
      ScrollTrigger.refresh();
      const hash = p?.hash ?? null;
      if (hash && scrollToSection(hash, { immediate: true })) {
        history.replaceState(null, "", window.location.pathname + window.location.search + "#" + hash);
      } else {
        // Keyboard and screen-reader users start at the new page's heading.
        const h1 = document.querySelector<HTMLElement>("main h1");
        if (h1) {
          h1.setAttribute("tabindex", "-1");
          h1.focus({ preventScroll: true });
        }
      }
      if (p) reveal();
    });
  }, [pathname, reveal]);

  // GSAP owns the shutter's transform from the start, so its tweens never stack on a CSS offset.
  useEffect(() => {
    gsap.set(wipe.current, { yPercent: -100, autoAlpha: 0 });
    return () => window.clearTimeout(fallback.current);
  }, []);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div ref={wipe} className="page-wipe" aria-hidden="true">
        <div className="page-wipe-label">
          <span ref={label} className="block" />
        </div>
        <div className="page-wipe-rail" />
      </div>
    </TransitionContext.Provider>
  );
}

type LinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & { href: string };

/** A Next link whose page changes go through the shutter. Modified clicks and new tabs behave normally. */
export function TransitionLink({ href, onClick, target, ...rest }: LinkProps) {
  const { navigate } = usePageTransition();
  return (
    <Link
      href={href}
      target={target}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || target === "_blank") return;
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}
