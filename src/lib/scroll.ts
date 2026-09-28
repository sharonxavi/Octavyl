"use client";

import type Lenis from "lenis";
import { ScrollTrigger } from "./gsap";

let lenisRef: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenisRef = l;
};
export const getLenis = () => lenisRef;

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Jump to a section. Pinned sections are measured from their ScrollTrigger
 * start, because the pin spacer moves the element itself.
 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const pinned = ScrollTrigger.getById(`pin-${id}`);
  const target = pinned ? pinned.start : el.getBoundingClientRect().top + window.scrollY - (id === "top" ? 0 : 72);
  const immediate = reduced();
  if (lenisRef) lenisRef.scrollTo(Math.max(0, target), { immediate, duration: 1.4 });
  else window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
  // Move focus for keyboard and screen-reader users without a second jump.
  const heading = el.querySelector<HTMLElement>("h1, h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

/** Click handler for in-page links: keeps the href for no-JS, scrolls with Lenis when JS runs. */
export function onAnchorClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute("href") || "";
  if (!href.startsWith("#") || href.length < 2) return;
  e.preventDefault();
  scrollToSection(href.slice(1));
  history.replaceState(null, "", href);
}
