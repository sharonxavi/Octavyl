// Route check: Home <-> Solutions through the nav, deep links, hash links, reload mid-scroll.
// Reports pathname, scroll, trigger count and errors after every step, so leaks show up as growing counts.
// Usage: node scripts/routes.mjs [--base=http://localhost:3210] [--mobile] [--reduced] [--rounds=3]
import { chromium } from "playwright-core";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const base = args.base || "http://localhost:3210";
const rounds = Number(args.rounds || 3);
const mobile = !!args.mobile;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext({
  viewport: mobile ? { width: 360, height: 740 } : { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: args.reduced ? "reduce" : "no-preference",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 200)));
page.on("response", (r) => r.status() >= 400 && errors.push(`http ${r.status()}: ${r.url()}`));

const state = (label) =>
  page
    .evaluate(() => ({
      path: location.pathname + location.search + location.hash,
      y: Math.round(scrollY),
      triggers: window.__ST?.getAll().length ?? null,
      pins: window.__ST?.getAll().filter((t) => t.pin).map((t) => t.vars.id || "?") ?? [],
      spacers: document.querySelectorAll(".pin-spacer").length,
      h1: document.querySelector("main h1")?.textContent?.trim().slice(0, 50),
      trade: document.querySelector(".inline-select select")?.value ?? null,
      mains: document.querySelectorAll("main").length,
      footers: document.querySelectorAll("footer.site-footer").length,
      wipe: getComputedStyle(document.querySelector(".page-wipe")).visibility,
      lenisStopped: window.__lenis?.isStopped ?? null,
    }))
    .then((s) => console.log(label.padEnd(28), JSON.stringify(s)));

const clickNav = async (label) => {
  const sel = mobile ? null : `header.nav nav a:text-is("${label}")`;
  if (mobile) {
    await page.mouse.wheel(0, -160);
    await page.waitForTimeout(700);
    await page.click("button.menu-toggle");
    await page.waitForTimeout(700);
    await page.click(`#site-menu a:has-text("${label}")`);
  } else {
    // A user scrolls up a little to bring the hidden bar back.
    await page.mouse.wheel(0, -160);
    await page.waitForTimeout(700);
    await page.click(sel);
  }
  await page.waitForTimeout(1600);
};

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await state("load /");
for (let i = 0; i < rounds; i++) {
  await page.mouse.wheel(0, 1800);
  await page.waitForTimeout(600);
  await clickNav("Solutions");
  await state(`r${i} -> Solutions`);
  await page.mouse.wheel(0, 2400);
  await page.waitForTimeout(600);
  await clickNav("Home");
  await state(`r${i} -> Home`);
}
await clickNav("Solutions");
await clickNav("About");
await state("Solutions -> About (hash)");
await clickNav("Contact");
await state("About -> Contact (same page)");

await page.goto(base + "/solutions?type=salon", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await state("deep link ?type=salon");
await page.goto(base + "/solutions?type=clinic", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await state("deep link ?type=clinic");

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.mouse.wheel(0, 2600);
await page.waitForTimeout(1200);
await state("before reload");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await state("after reload");
await page.goBack().catch(() => {});
await page.waitForTimeout(1500);
await state("history back");

console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no errors");
await browser.close();
