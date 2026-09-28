// Burst of hero frames with the pointer resting on a free slot, to see routes in flight.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const out = process.argv[2] || ".captures/burst";
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3210", { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1200);
const box = await p.locator("#top .reg-row").nth(7).boundingBox();
await p.mouse.move(box.x + 140, box.y + box.height / 2, { steps: 12 });
for (let i = 0; i < 14; i++) {
  await p.waitForTimeout(350);
  await p.screenshot({ path: `${out}/f${String(i).padStart(2, "0")}.png`, clip: { x: 440, y: 180, width: 1000, height: 600 } });
}
await b.close();
console.log("done");
