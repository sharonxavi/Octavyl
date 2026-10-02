// Renders Home's social card (1200 x 630) from the real hero: real fonts, real route field.
// Usage: node scripts/og-home.mjs [--url=http://localhost:3210]
import { chromium } from "playwright-core";
import { copyFileSync } from "node:fs";
const url = process.argv.find((a) => a.startsWith("--url="))?.slice(6) || "http://localhost:3210";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(url + "/", { waitUntil: "networkidle" });
await page.addStyleTag({
  content: `.nav nav, .nav .btn, .nav .menu-toggle, .cursor, .hh-cue, .hh-actions, .hh-legend { display: none !important; }
            .nav { background: none !important; box-shadow: none !important; }
            .hh-body { padding-top: 92px !important; }`,
});
await page.waitForTimeout(4200);
await page.screenshot({ path: "src/app/opengraph-image.png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
copyFileSync("src/app/opengraph-image.png", "src/app/twitter-image.png");
await browser.close();
console.log("wrote src/app/opengraph-image.png and twitter-image.png");
