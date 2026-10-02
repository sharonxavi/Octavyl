// Screenshot at "<id>+<px>" offsets (section top plus pixels). Usage:
// node scripts/shoot-at.mjs --only=desktop,mobile --at=about+700,contact+650 [--out=.captures/at] [--reduced]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const out = args.out || ".captures/at";
mkdirSync(out, { recursive: true });
const VP = { desktop: { width: 1440, height: 900, dsf: 1 }, mobile: { width: 360, height: 740, dsf: 2, touch: true } };
const browser = await chromium.launch({ channel: "msedge", headless: true });
for (const name of (args.only || "desktop").split(",")) {
  const vp = VP[name];
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dsf, isMobile: !!vp.touch, hasTouch: !!vp.touch, reducedMotion: args.reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[${name} pageerror]`, e.message));
  await page.goto((args.url || "http://localhost:3210") + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  for (const spec of String(args.at).split(",")) {
    const [id, px] = spec.split("+");
    const y = await page.evaluate(({ id, px }) => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + scrollY + Number(px || 0) : null;
    }, { id, px });
    if (y === null) { console.log("no", id); continue; }
    // Walk there in steps so once-only reveals fire on the way.
    await page.evaluate(async (y) => { for (let s = scrollY; Math.abs(s - y) > 10; ) { s += Math.sign(y - s) * Math.min(600, Math.abs(y - s)); window.__lenis.scrollTo(s, { immediate: true, force: true }); await new Promise((r) => setTimeout(r, 60)); } }, y);
    await page.waitForTimeout(1400);
    const file = `${out}/${name}${args.reduced ? "-reduced" : ""}-${id}-${px || 0}.png`;
    await page.screenshot({ path: file });
    console.log("shot", file);
  }
  await ctx.close();
}
await browser.close();
