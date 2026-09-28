// Exercises the interactive pieces and screenshots each state.
import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", (e) => console.log("[pageerror]", e.message));
p.on("console", (m) => m.type() === "error" && console.log("[console.error]", m.text().slice(0, 200)));
await p.goto("http://localhost:3210", { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(2500);
const go = async (sel, off = -60) => {
  await p.evaluate(([s, o]) => { const el = document.querySelector(s); const y = el.getBoundingClientRect().top + scrollY + o; window.__lenis.scrollTo(y, { immediate: true, force: true }); }, [sel, off]);
  await p.waitForTimeout(1400);
};

// Hero: point at the 18:00 slot and let a request route there.
const row = p.locator(".reg-row").nth(6);
const box = await row.boundingBox();
await p.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 10 });
await p.waitForTimeout(3600);
await p.screenshot({ path: ".captures/i-hero-pointer.png" });
console.log("hero rows:", await p.$$eval(".reg-row", (els) => els.map((e) => e.dataset.state + ":" + e.querySelector(".entry").textContent).join(" | ")));

// Explorer: tick two rows.
await go("#build", 40);
await p.click('[data-row="busy"] .x-row');
await p.waitForTimeout(500);
await p.click('[data-row="reviews"] .x-row');
await p.waitForTimeout(900);
await p.screenshot({ path: ".captures/i-build-selected.png" });

// Demo: drag past closing, then Tamil.
await go(".demo", -120);
await p.fill("#call-time", "1320").catch(async () => {
  await p.$eval("#call-time", (el) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; s.call(el, "1320"); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); });
});
await p.waitForTimeout(700);
await p.screenshot({ path: ".captures/i-demo-closed.png" });
await p.click('.seg button[lang="ta"]');
await p.waitForTimeout(900);
await p.screenshot({ path: ".captures/i-demo-tamil.png" });
console.log("demo text:", await p.$eval(".demo-text", (e) => e.textContent));

// Night: switch to Without mid-track.
await p.evaluate(() => { const st = window.__ST.getById("pin-night"); window.__lenis.scrollTo(st.start + (st.end - st.start) * 0.3, { immediate: true, force: true }); });
await p.waitForTimeout(1500);
await p.click('.night-toggle button:nth-child(2)');
await p.waitForTimeout(900);
await p.screenshot({ path: ".captures/i-night-without.png" });

// Trade switch to gym from the night heading.
await p.selectOption("#night select", "gym");
await p.waitForTimeout(900);
await p.screenshot({ path: ".captures/i-night-gym.png" });
await b.close();
