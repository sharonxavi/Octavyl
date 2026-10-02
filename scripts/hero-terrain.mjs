// Hero terrain states: idle, pointer moving, right after a click, and frame-time stats.
// Usage: node scripts/hero-terrain.mjs [--width=1440] [--height=900] [--out=.captures/terrain]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const W = Number(args.width || 1440);
const H = Number(args.height || 900);
const out = args.out || ".captures/terrain";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--use-angle=default", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && console.log(`[${m.type()}]`, m.text().slice(0, 300)));
await page.goto((args.url || "http://localhost:3210") + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/${W}-intro.png` });
await page.waitForTimeout(3600);
await page.screenshot({ path: `${out}/${W}-idle.png` });

// Sweep the pointer across the right half.
await page.mouse.move(W * 0.55, H * 0.75);
for (let i = 0; i <= 30; i++) {
  await page.mouse.move(W * (0.55 + 0.3 * (i / 30)), H * (0.75 - 0.2 * Math.sin((i / 30) * Math.PI)));
  await page.waitForTimeout(16);
}
await page.waitForTimeout(250);
await page.screenshot({ path: `${out}/${W}-pointer.png` });
await page.mouse.click(W * 0.72, H * 0.7);
await page.waitForTimeout(650);
await page.screenshot({ path: `${out}/${W}-click.png` });
await page.waitForTimeout(1200);
const stats = await page.evaluate(() => window.__hhTerrain ?? null);
console.log("stats", JSON.stringify(stats));
const log = await page.evaluate(() => [...document.querySelectorAll(".hh-log-row")].map((r) => r.textContent));
console.log("log", JSON.stringify(log));
await browser.close();
