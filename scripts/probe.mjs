// Evaluate an expression on the running site. Usage: node scripts/probe.mjs "<js expression>" [width] [height]
import { chromium } from "playwright-core";
const [expr, w = "1440", h = "900"] = process.argv.slice(2);
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on("pageerror", (e) => console.log("[pageerror]", e.message));
await p.goto(process.env.URL || "http://localhost:3210", { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(Number(process.env.WAIT || 1500));
console.log(JSON.stringify(await p.evaluate(expr), null, 2));
await b.close();
