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
const themeCorePackage = await readJson("packages/theme-core/package.json");
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
const desktopRuntime = await readFile(
  new URL("../apps/desktop/src/lib/runtime.ts", import.meta.url),
  "utf8",
);
const desktopApp = await readFile(
  new URL("../apps/desktop/src/App.tsx", import.meta.url),
  "utf8",
);
const siteLanding = await readFile(
  new URL("../apps/site/src/components/LandingPage.astro", import.meta.url),
  "utf8",
);
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const chineseReadme = await readFile(
  new URL("../README.zh-CN.md", import.meta.url),
  "utf8",
);
const releaseNotes = await readFile(
  new URL(`../.github/release-notes/v${expected}.md`, import.meta.url),
  "utf8",
);
const localizedReleaseNotes = await readJson(
  `.github/release-notes/v${expected}.json`,
);

const cargoVersion = cargoManifest.match(
  /^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/mu,
)?.[1];
const siteVersion = siteLayout.match(/softwareVersion:\s*"([^"]+)"/u)?.[1];
const runtimeVersion = desktopRuntime.match(
  /currentVersion:\s*"([^"]+)"/u,
)?.[1];
const appVersion = desktopApp.match(
  /useState\("(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)"\)/u,
)?.[1];
const previewMatch = expected.match(/^\d+\.\d+\.\d+-(alpha|beta|rc)\.(\d+)$/u);
const expectedDisplayVersion = previewMatch
  ? previewMatch[1] === "alpha"
    ? `Alpha 0.${previewMatch[2]}`
    : previewMatch[1] === "beta"
      ? `Beta ${previewMatch[2]}`
      : `RC ${previewMatch[2]}`
  : expected;
const displayVersions = [
  ...desktopMessages.matchAll(/version:\s*"([^"]+)"/gu),
].map((match) => match[1]);

const versions = new Map([
  ["package.json", rootPackage.version],
  ["apps/desktop/package.json", desktopPackage.version],
  ["apps/site/package.json", sitePackage.version],
  ["packages/theme-core/package.json", themeCorePackage.version],
  ["apps/desktop/src-tauri/tauri.conf.json", tauriConfig.version],
  ["apps/desktop/src-tauri/Cargo.toml", cargoVersion],
  ["apps/site/src/layouts/BaseLayout.astro", siteVersion],
  ["apps/desktop/src/lib/runtime.ts", runtimeVersion],
  ["apps/desktop/src/App.tsx", appVersion],
]);

const mismatches = [...versions].filter(([, version]) => version !== expected);

if (mismatches.length > 0) {
  console.error(`Release version ${expected} is not synchronized:`);
  for (const [path, version] of mismatches) {
    console.error(`- ${path}: ${version ?? "missing"}`);
  }
  process.exit(1);
}

const localizedNotesAreValid =
  localizedReleaseNotes.format === "codex-styler-release-notes-v1" &&
  localizedReleaseNotes.version === expected &&
  localizedReleaseNotes.defaultLocale === "en" &&
  ["en", "zh-CN"].every((locale) => {
    const notes = localizedReleaseNotes.locales?.[locale];
    return (
      typeof notes?.summary === "string" &&
      notes.summary.length > 0 &&
      Array.isArray(notes.highlights) &&
      notes.highlights.length > 0 &&
      notes.highlights.every((item) => typeof item === "string") &&
      Array.isArray(notes.fixes) &&
      notes.fixes.every((item) => typeof item === "string")
    );
  });

if (!localizedNotesAreValid) {
  console.error(
    `Localized release notes for ${expected} must contain validated English and Simplified Chinese content.`,
  );
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

const releaseTag = `v${expected}`;
const macAsset = `Codex-Styler_${expected}_aarch64-unsigned.dmg`;
const windowsAsset = `Codex-Styler_${expected}_x64-unsigned-setup.exe`;
const releaseReferences = new Map([
  ["README.md", readme],
  ["README.zh-CN.md", chineseReadme],
  ["apps/site/src/components/LandingPage.astro", siteLanding],
  [`.github/release-notes/${releaseTag}.md`, releaseNotes],
]);

const staleReleaseReferences = [...releaseReferences].flatMap(
  ([path, contents]) => {
    const missing = [releaseTag, macAsset, windowsAsset].filter(
      (value) => !contents.includes(value),
    );
    return missing.map((value) => `${path}: missing ${value}`);
  },
);

if (staleReleaseReferences.length > 0) {
  console.error(`Release links for ${expected} are not synchronized:`);
  for (const mismatch of staleReleaseReferences) {
    console.error(`- ${mismatch}`);
  }
  process.exit(1);
}

console.log(
  `Release version ${expected} is synchronized across ${versions.size} files, localized update notes, the desktop display, and both platform downloads.`,
);
