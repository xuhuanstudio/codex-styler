import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { importThemePackage, validateTheme } from "./index";

async function main(): Promise<void> {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: pnpm theme:validate <theme.json|theme.codex-styler-theme>");
    process.exitCode = 2;
    return;
  }

  const bytes = await readFile(input);
  if (input.endsWith(".codex-styler-theme")) {
    const result = await importThemePackage(bytes);
    console.log("Valid theme package: " + result.theme.metadata.name);
    return;
  }

  const result = validateTheme(JSON.parse(bytes.toString("utf8")));
  if (!result.ok) {
    for (const issue of result.issues) {
      console.error(issue.path + " " + issue.message);
    }
    process.exitCode = 1;
    return;
  }
  console.log("Valid theme manifest: " + basename(input));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

