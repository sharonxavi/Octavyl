// One screenshot of a URL at a given size. Usage: node scripts/shot-url.mjs <url> <out.png> [width] [height] [full]
import { chromium } from "playwright-core";
const [url, out, w = "1440", h = "900", full] = process.argv.slice(2);
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on("pageerror", (e) => console.log("[pageerror]", e.message));
await p.goto(url, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: !!full });
await b.close();
console.log("shot", out);
