// Renders src/app/icon.svg to 16, 32 and 48px PNGs and packs them into src/app/favicon.ico.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync("src/app/icon.svg", "utf8");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const sizes = [16, 32, 48];
const pngs = [];
for (const s of sizes) {
  const page = await browser.newPage({ viewport: { width: s, height: s } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${s}" height="${s}" `)}</body></html>`);
  pngs.push(await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } }));
  await page.close();
}
await browser.close();

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const dir = sizes.map((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s === 256 ? 0 : s, 0);
  e.writeUInt8(s === 256 ? 0 : s, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...dir, ...pngs]));
console.log("wrote src/app/favicon.ico", offset, "bytes");
