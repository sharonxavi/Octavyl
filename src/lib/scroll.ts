"use client";

import type Lenis from "lenis";
import { ScrollTrigger } from "./gsap";

let lenisRef: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenisRef = l;
};
export const getLenis = () => lenisRef;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Where a section starts. Pinned sections are measured from their ScrollTrigger, because the pin spacer moves the element itself. */
export function sectionTop(id: string) {
  const el = document.getElementById(id);
  if (!el) return null;
  const pinned = ScrollTrigger.getById(`pin-${id}`);
  const target = pinned ? pinned.start : el.getBoundingClientRect().top + window.scrollY - (id === "top" ? 0 : 72);
  return Math.max(0, target);
}

/** Jump to a section, then hand focus to its heading for keyboard and screen-reader users. */
export function scrollToSection(id: string, { immediate = prefersReducedMotion() }: { immediate?: boolean } = {}) {
  const el = document.getElementById(id);
  const target = sectionTop(id);
  if (!el || target === null) return false;
  if (lenisRef) lenisRef.scrollTo(target, { immediate, force: true, duration: 1.4 });
  else window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
  const heading = el.querySelector<HTMLElement>("h1, h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  return true;
}

/** Back to the top of the page, smoothly unless motion is reduced. */
export function scrollToTop({ immediate = prefersReducedMotion() }: { immediate?: boolean } = {}) {
  if (lenisRef) lenisRef.scrollTo(0, { immediate, force: true, duration: 1.2 });
  else window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
}

/** Click handler for in-page links: keeps the href for no-JS, scrolls with Lenis when JS runs. */
export function onAnchorClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute("href") || "";
  if (!href.startsWith("#") || href.length < 2) return;
  e.preventDefault();
  scrollToSection(href.slice(1));
  history.replaceState(null, "", href);
}
