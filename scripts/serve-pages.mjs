// Serves the static export (out/) the way GitHub Pages does: under /<base>, with
// "/x" -> x.html, "/x/" -> x/index.html, and 404.html for anything else.
// Build first:  GITHUB_PAGES=true PAGES_BASE_PATH=/Octavyl npx next build
// Then:         node scripts/serve-pages.mjs [--base=/Octavyl] [--port=3400]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const base = (args.base ?? "/Octavyl").replace(/\/$/, "");
const port = Number(args.port ?? 3400);
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain",
};
const isFile = async (p) => (await stat(p).catch(() => null))?.isFile() ?? false;

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith(base + "/") && url.pathname !== base) {
    res.writeHead(404).end("Not under " + base);
    return;
  }
  const rel = decodeURIComponent(url.pathname.slice(base.length)) || "/";
  const safe = normalize(rel).replace(/^([/\\])+/, "");
  const candidates = [join(root, safe), join(root, safe + ".html"), join(root, safe, "index.html")];
  for (const file of candidates) {
    if (await isFile(file)) {
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(await readFile(file));
      return;
    }
  }
  res.writeHead(404, { "content-type": TYPES[".html"] });
  res.end(await readFile(join(root, "404.html")).catch(() => "Not found"));
}).listen(port, () => console.log(`Pages preview: http://localhost:${port}${base}/`));
