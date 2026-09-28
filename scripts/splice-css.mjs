// Replace the block between two section-comment markers in globals.css with a file's contents.
// Usage: node scripts/splice-css.mjs "<start marker>" "<end marker>" <file>
import { readFileSync, writeFileSync } from "node:fs";

const [start, end, file] = process.argv.slice(2);
const path = "src/app/globals.css";
const css = readFileSync(path, "utf8");
const a = css.indexOf(start);
const b = css.indexOf(end);
if (a < 0 || b < 0 || b <= a) throw new Error(`markers not found: ${a} ${b}`);
writeFileSync(path, css.slice(0, a) + readFileSync(file, "utf8").trimEnd() + "\n\n" + css.slice(b));
console.log(`spliced ${file} into ${path}`);
