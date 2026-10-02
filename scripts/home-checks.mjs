// Behaviour checks for Home: contact form states, FAQ toggling, industry cards (drag vs click), cursor labels.
// Usage: node scripts/home-checks.mjs [--base=http://localhost:3210]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://localhost:3210";
const out = ".captures/checks";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const ok = (label, cond, extra = "") => console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
const jump = (id, px = 0) =>
  page.evaluate(
    async ({ id, px }) => {
      const y = document.getElementById(id).getBoundingClientRect().top + scrollY + px;
      for (let s = scrollY; Math.abs(s - y) > 10; ) {
        s += Math.sign(y - s) * Math.min(700, Math.abs(y - s));
        window.__lenis.scrollTo(s, { immediate: true, force: true });
        await new Promise((r) => setTimeout(r, 40));
      }
    },
    { id, px }
  );

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

/* FAQ */
await jump("faq", 100);
await page.waitForTimeout(1200);
const q0 = page.locator("#faq button[aria-expanded]").first();
await q0.click();
await page.waitForTimeout(700);
ok("FAQ opens on click", (await q0.getAttribute("aria-expanded")) === "true");
const regionH = await page.evaluate(() => document.querySelector("#faq .fq-a")?.getBoundingClientRect().height ?? 0);
ok("FAQ answer has height", regionH > 20, `${Math.round(regionH)}px`);
await q0.focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(600);
ok("FAQ closes with Enter", (await q0.getAttribute("aria-expanded")) === "false");

/* Contact form */
await jump("contact", 560);
await page.waitForTimeout(1200);
const form = page.locator("#contact form");
await form.locator('button[type="submit"]').click();
await page.waitForTimeout(400);
const invalid = await form.locator('[aria-invalid="true"]').count();
const focused = await page.evaluate(() => document.activeElement?.getAttribute("name") || document.activeElement?.id);
ok("empty submit marks fields invalid", invalid >= 3, `${invalid} invalid, focus on ${focused}`);
await page.screenshot({ path: `${out}/form-errors.png` });

await form.locator('input[name="name"]').fill("Priya");
await form.locator("select").selectOption({ index: 4 });
await form.locator('input[name="contact"]').fill("98400 12345");
await form.locator("textarea").fill("We miss calls when the clinic is busy.");

// Failure first: the server says no.
await page.route("**/api/contact", (r) => r.fulfill({ status: 500, body: "{}" }));
await form.locator('button[type="submit"]').click();
await page.waitForTimeout(1500);
const failText = await page.locator("#contact").innerText();
ok("failure panel shows", /didn.t send/i.test(failText));
ok("values kept after failure", (await form.locator('input[name="name"]').inputValue()) === "Priya");
await page.screenshot({ path: `${out}/form-failure.png` });

// Then the real (placeholder) handler.
await page.unroute("**/api/contact");
const resp = page.waitForResponse("**/api/contact");
const retry = page.getByRole("button", { name: /try again/i });
if (await retry.count()) await retry.first().click();
else await form.locator('button[type="submit"]').click();
const r = await resp;
await page.waitForTimeout(1600);
ok("POST /api/contact returns 200", r.status() === 200, String(r.status()));
const successText = await page.locator("#contact").innerText();
ok("success panel shows the name", /Got it, Priya/i.test(successText));
await page.screenshot({ path: `${out}/form-success.png` });

/* Industries: a drag scrolls the row and does not navigate; a click navigates. */
await jump("industries", 300);
await page.waitForTimeout(1200);
const card = page.locator("#industries a[href^='/solutions']").first();
const box = await card.boundingBox();
const label = await card.getAttribute("data-cursor-label");
ok("industry card cursor label", label === "Explore", label);
const row = await page.evaluate(() => {
  const r = document.querySelector("#industries a[href^='/solutions']").closest("ul, ol, [class*=row]");
  return { cls: r?.className, before: r?.scrollLeft };
});
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2 - 220, box.y + box.height / 2, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(900);
const after = await page.evaluate(() => ({
  path: location.pathname,
  left: document.querySelector("#industries a[href^='/solutions']").closest("ul, ol, [class*=row]")?.scrollLeft,
}));
ok("drag scrolls the row", after.left > (row.before ?? 0) + 50, `${row.before} -> ${after.left}`);
ok("drag does not navigate", after.path === "/", after.path);
const href = await card.getAttribute("href");
await card.click();
await page.waitForTimeout(2200);
ok("click opens the trade sample", page.url().endsWith(href), page.url());
const trade = await page.evaluate(() => document.querySelector(".inline-select select")?.value);
ok("sample opens with that trade chosen", href.includes(`type=${trade}`), trade);

console.log(errors.length ? "PAGE ERRORS:\n" + errors.join("\n") : "no page errors");
await browser.close();
