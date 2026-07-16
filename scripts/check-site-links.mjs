import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";

const root = resolve("apps/site/dist");
const base = "/codex-styler";
const documents = [];

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith(".html")) documents.push(path);
  }
}

function targetFor(value, document) {
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean || clean.startsWith("#") || /^[a-z][a-z+.-]*:/i.test(clean)) {
    return null;
  }

  const withoutBase = clean === base ? "/" : clean.startsWith(base + "/")
    ? clean.slice(base.length)
    : clean;
  let target = withoutBase.startsWith("/")
    ? join(root, withoutBase)
    : resolve(dirname(document), withoutBase);
  target = normalize(target);
  if (!target.startsWith(root)) return target;
  if (target.endsWith("/") || !/.[a-z0-9]+$/i.test(target)) {
    target = join(target, "index.html");
  }
  return target;
}

walk(root);
const missing = [];
const attributePattern = /(?:href|src)=["']([^"']+)["']/g;

for (const document of documents) {
  const html = readFileSync(document, "utf8");
  for (const match of html.matchAll(attributePattern)) {
    const target = targetFor(match[1], document);
    if (target && !existsSync(target)) {
      missing.push(relative(root, document) + " -> " + match[1]);
    }
  }
}

if (missing.length) {
  console.error("Broken static links:\n" + missing.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Checked " + documents.length + " HTML files: no broken local links.");
}
