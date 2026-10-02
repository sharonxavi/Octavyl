// Checks the Home hero's route field on the running site.
// Usage: node scripts/hero-field.mjs [--vp=desktop|wide|mobile] [--reduced] [--out=.captures/hh/field]
// Writes a few mid-animation frames and a pointer-hover frame, then prints:
// when the field became ready (vs first paint), frame cost, and whether the loop
// stops off screen and while the tab is hidden.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const VP = {
  desktop: { width: 1440, height: 900, dsf: 1 },
  wide: { width: 1920, height: 1080, dsf: 1 },
  mobile: { width: 360, height: 740, dsf: 2, touch: true },
};
const name = args.vp || "desktop";
const vp = VP[name];
const out = args.out || ".captures/hh/field";
const reduced = !!args.reduced;
mkdirSync(out, { recursive: true });
const tag = `${name}${reduced ? "-reduced" : ""}`;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: Number(args.dsf || vp.dsf),
  isMobile: !!vp.touch,
  hasTouch: !!vp.touch,
  reducedMotion: reduced ? "reduce" : "no-preference",
});
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") console.log(`[console.${m.type()}]`, m.text().slice(0, 300));
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

// Note when the canvas first gets .is-ready, relative to navigation start.
await page.addInitScript(() => {
  window.__hhReadyAt = null;
  new MutationObserver(() => {
    const c = document.querySelector(".hh-canvas.is-ready");
    if (c && window.__hhReadyAt === null) window.__hhReadyAt = performance.now();
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
});

await page.goto(args.url || "http://localhost:3210", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(3200);

const timing = await page.evaluate(() => {
  const fp = performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint");
  return { fcp: fp ? Math.round(fp.startTime) : null, fieldReady: window.__hhReadyAt && Math.round(window.__hhReadyAt) };
});
console.log("timing (ms from navigation):", JSON.stringify(timing));

const stats = () => page.evaluate(() => ({ ...(window.__hhField || {}), ms: +(window.__hhField?.ms ?? 0).toFixed(3) }));
console.log("stats:", JSON.stringify(await stats()));

const clip = { x: 0, y: 0, width: vp.width, height: vp.height };
for (let i = 0; i < 3; i++) {
  await page.screenshot({ path: `${out}/${tag}-frame${i}.png`, clip });
  await page.waitForTimeout(450);
}
if (args.zoom) {
  // A closer look at the busy right half, several frames apart.
  const z = { x: Math.round(vp.width * 0.55), y: Math.round(vp.height * 0.08), width: Math.round(vp.width * 0.45), height: Math.round(vp.height * 0.6) };
  for (let i = 0; i < 6; i++) {
    await page.screenshot({ path: `${out}/${tag}-zoom${i}.png`, clip: z });
    await page.waitForTimeout(260);
  }
}

if (!vp.touch && !reduced) {
  // Rest the pointer on the map, right of the headline, and let the streets bend.
  const px = Math.round(vp.width * 0.78);
  const py = Math.round(vp.height * 0.3);
  await page.mouse.move(px - 200, py + 120, { steps: 4 });
  await page.mouse.move(px, py, { steps: 16 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${tag}-hover.png`, clip });
  await page.screenshot({
    path: `${out}/${tag}-hover-zoom.png`,
    clip: { x: px - 260, y: Math.max(0, py - 200), width: 520, height: 400 },
  });
  console.log("hover stats:", JSON.stringify(await stats()));
  await page.mouse.move(40, vp.height - 20, { steps: 6 });
}

// Off screen: scroll well past the hero and count frames.
const frames = () => page.evaluate(() => window.__hhField?.frames ?? -1);
await page.evaluate(() => {
  const y = document.getElementById("belief").getBoundingClientRect().top + scrollY + innerHeight;
  if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
  else scrollTo(0, y);
});
await page.waitForTimeout(400);
const a = await frames();
await page.waitForTimeout(1000);
const b = await frames();
console.log(`off screen: ${b - a} frames in 1s (running=${(await stats()).running})`);

await page.evaluate(() => (window.__lenis ? window.__lenis.scrollTo(0, { immediate: true, force: true }) : scrollTo(0, 0)));
await page.waitForTimeout(400);
const c = await frames();
await page.waitForTimeout(1000);
const d = await frames();
console.log(`back on screen: ${d - c} frames in 1s (running=${(await stats()).running})`);

// Tab hidden: fake the Page Visibility state and fire the event.
await page.evaluate(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
  document.dispatchEvent(new Event("visibilitychange"));
});
await page.waitForTimeout(200);
const e = await frames();
await page.waitForTimeout(1000);
const f = await frames();
console.log(`tab hidden: ${f - e} frames in 1s (running=${(await stats()).running})`);
await page.evaluate(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  document.dispatchEvent(new Event("visibilitychange"));
});
await page.waitForTimeout(600);
console.log("final stats:", JSON.stringify(await stats()));

await browser.close();
