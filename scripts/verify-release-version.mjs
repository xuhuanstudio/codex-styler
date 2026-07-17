import { readFile } from "node:fs/promises";

const expected = process.argv[2];

if (!expected || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(expected)) {
  console.error("Usage: node scripts/verify-release-version.mjs <version>");
  process.exit(1);
}

async function readJson(path) {
  return JSON.parse(
    await readFile(new URL(`../${path}`, import.meta.url), "utf8"),
  );
}

const rootPackage = await readJson("package.json");
const desktopPackage = await readJson("apps/desktop/package.json");
const sitePackage = await readJson("apps/site/package.json");
const tauriConfig = await readJson("apps/desktop/src-tauri/tauri.conf.json");
const cargoManifest = await readFile(
  new URL("../apps/desktop/src-tauri/Cargo.toml", import.meta.url),
  "utf8",
);
const siteLayout = await readFile(
  new URL("../apps/site/src/layouts/BaseLayout.astro", import.meta.url),
  "utf8",
);
const desktopMessages = await readFile(
  new URL("../apps/desktop/src/lib/i18n.ts", import.meta.url),
  "utf8",
);

const cargoVersion = cargoManifest.match(
  /^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/mu,
)?.[1];
const siteVersion = siteLayout.match(/softwareVersion:\s*"([^"]+)"/u)?.[1];
const alphaMatch = expected.match(/^\d+\.\d+\.\d+-alpha\.(\d+)$/u);
const expectedDisplayVersion = alphaMatch
  ? `Alpha 0.${alphaMatch[1]}`
  : expected;
const displayVersions = [
  ...desktopMessages.matchAll(/version:\s*"([^"]+)"/gu),
].map((match) => match[1]);

const versions = new Map([
  ["package.json", rootPackage.version],
  ["apps/desktop/package.json", desktopPackage.version],
  ["apps/site/package.json", sitePackage.version],
  ["apps/desktop/src-tauri/tauri.conf.json", tauriConfig.version],
  ["apps/desktop/src-tauri/Cargo.toml", cargoVersion],
  ["apps/site/src/layouts/BaseLayout.astro", siteVersion],
]);

const mismatches = [...versions].filter(([, version]) => version !== expected);

if (mismatches.length > 0) {
  console.error(`Release version ${expected} is not synchronized:`);
  for (const [path, version] of mismatches) {
    console.error(`- ${path}: ${version ?? "missing"}`);
  }
  process.exit(1);
}

if (
  displayVersions.length !== 2 ||
  displayVersions.some((version) => version !== expectedDisplayVersion)
) {
  console.error(
    `Desktop display version is not synchronized: expected ${expectedDisplayVersion}, found ${displayVersions.join(", ") || "missing"}.`,
  );
  process.exit(1);
}

console.log(
  `Release version ${expected} is synchronized across ${versions.size} files and the desktop display.`,
);
