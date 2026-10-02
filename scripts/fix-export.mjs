// After a static export (out/), copies each nested route's prefetch file to the flat
// name the browser requests. Next 16 writes solutions/__next.solutions/__PAGE__.txt but
// asks for solutions/__next.solutions.__PAGE__.txt; on a static host that's a 404 and an
// extra request. Run after `next build` in the GitHub Pages workflow.
import { copyFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const out = join(process.cwd(), "out");
let copied = 0;

async function walk(dir) {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    if (!(await stat(full)).isDirectory() || name === "_next") continue;
    if (name.startsWith("__next.")) await flatten(full, dir, name);
    else await walk(full);
  }
}

/** Copies every file under segDir to parent/<prefix>.<relative path joined with dots>. */
async function flatten(segDir, parent, prefix) {
  for (const name of await readdir(segDir)) {
    const full = join(segDir, name);
    if ((await stat(full)).isDirectory()) await flatten(full, parent, `${prefix}.${name}`);
    else {
      await copyFile(full, join(parent, `${prefix}.${name}`));
      copied++;
    }
  }
}

await walk(out);
console.log(`fix-export: ${copied} prefetch file(s) copied to their flat names`);
