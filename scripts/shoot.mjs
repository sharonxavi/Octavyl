// Screenshots the running site with the installed Edge (no browser download).
// Usage: node scripts/shoot.mjs [--only=desktop,mobile] [--steps=hero,night:0.3] [--reduced] [--out=.captures]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const url = args.url || "http://localhost:3210";
const out = args.out || ".captures";
const reduced = !!args.reduced;
mkdirSync(out, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, dsf: 1 },
  laptop: { width: 1366, height: 768, dsf: 1 },
  tablet: { width: 820, height: 1180, dsf: 1, touch: true },
  mobile: { width: 360, height: 740, dsf: 2, touch: true },
};
const only = (args.only || "desktop,mobile").split(",");
const steps = (args.steps || "hero,night:0,night:0.35,night:0.7,night:1,build,process,about,contact:0.5,contact:1,footer").split(",");
const wait = Number(args.wait || 1300);

const browser = await chromium.launch({ channel: "msedge", headless: true });
for (const name of only) {
  const vp = VIEWPORTS[name];
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    isMobile: !!vp.touch && vp.width < 800,
    hasTouch: !!vp.touch,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console.log(`[${name} console.${m.type()}]`, m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => console.log(`[${name} pageerror]`, e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(Number(args.boot || 2600));

  for (const step of steps) {
    const [id, frac] = step.split(":");
    const y = await page.evaluate(
      ({ id, frac }) => {
        const ST = window.__ST;
        if (id === "hero") return 0;
        if (id === "footer") return document.documentElement.scrollHeight;
        const st = ST?.getById?.(`pin-${id}`);
        if (st && frac !== undefined) return st.start + (st.end - st.start) * Number(frac);
        const el = document.getElementById(id);
        if (!el) return null;
        return el.getBoundingClientRect().top + window.scrollY - 40;
      },
      { id, frac }
    );
    if (y === null) {
      console.log(`[${name}] no target for ${step}`);
      continue;
    }
    await page.evaluate((y) => {
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }, y);
    await page.waitForTimeout(wait);
    if (args.hover && id === "hero") {
      const box = await page.locator(".reg-row").nth(6).boundingBox();
      if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
      await page.waitForTimeout(2200);
    }
    const file = `${out}/${name}${reduced ? "-reduced" : ""}-${step.replace(":", "-")}.png`;
    await page.screenshot({ path: file, fullPage: false });
    console.log("shot", file);
  }
  if (args.full) {
    const file = `${out}/${name}${reduced ? "-reduced" : ""}-full.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log("shot", file);
  }
  await ctx.close();
}
await browser.close();
