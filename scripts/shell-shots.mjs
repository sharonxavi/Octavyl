// Screenshots of the shared shell: nav, mobile menu, the page shutter mid-transition, the footer.
// Usage: node scripts/shell-shots.mjs [--out=.captures/shell]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6) || ".captures/shell";
mkdirSync(out, { recursive: true });
const base = "http://localhost:3210";
const browser = await chromium.launch({ channel: "msedge", headless: true });

// Desktop: nav, hover marker, the shutter mid-way, footer with pointer.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await page.hover('header.nav nav a:text-is("About")');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/desktop-nav-hover.png`, clip: { x: 0, y: 0, width: 1440, height: 120 } });
  await page.click('header.nav nav a:text-is("Solutions")');
  await page.waitForTimeout(260);
  await page.screenshot({ path: `${out}/desktop-wipe.png` });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/desktop-solutions-top.png`, clip: { x: 0, y: 0, width: 1440, height: 120 } });
  await page.evaluate(() => window.__lenis.scrollTo(document.documentElement.scrollHeight, { immediate: true, force: true }));
  await page.waitForTimeout(1600);
  const box = await page.locator(".fm").boundingBox();
  if (box) await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.5, { steps: 6 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/desktop-footer.png` });
  await ctx.close();
}

// Phone: menu open, footer.
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/mobile-nav.png`, clip: { x: 0, y: 0, width: 360, height: 90 } });
  await page.click("button.menu-toggle");
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${out}/mobile-menu.png` });
  await page.click("button.menu-toggle");
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__lenis.scrollTo(document.documentElement.scrollHeight, { immediate: true, force: true }));
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/mobile-footer.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log("mobile horizontal overflow px:", overflow);
  await ctx.close();
}
await browser.close();
console.log("done", out);
