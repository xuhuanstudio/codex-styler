import { readFile } from "node:fs/promises";
import { basename, isAbsolute, resolve } from "node:path";
import {
  importCompanionPackage,
  importThemePackage,
  validateCompanion,
  validateTheme,
} from "./index";

async function main(): Promise<void> {
  const input = process.argv[2];
  if (!input) {
    console.error(
      "Usage: pnpm package:validate <manifest.json|*.codex-styler-theme|*.codex-styler-companion>",
    );
    process.exitCode = 2;
    return;
  }

  const invocationDirectory = process.env.INIT_CWD ?? process.cwd();
  const inputPath = isAbsolute(input)
    ? input
    : resolve(invocationDirectory, input);
  const bytes = await readFile(inputPath);
  if (input.endsWith(".codex-styler-theme")) {
    const result = await importThemePackage(bytes);
    console.log("Valid theme package: " + result.theme.metadata.name);
    return;
  }

  if (input.endsWith(".codex-styler-companion")) {
    const result = await importCompanionPackage(bytes);
    console.log("Valid companion package: " + result.companion.metadata.name);
    return;
  }

  const manifest = JSON.parse(bytes.toString("utf8")) as { format?: string };
  const companion = manifest.format === "codex-styler-companion-v1";
  const result = companion
    ? validateCompanion(manifest)
    : validateTheme(manifest);
  if (!result.ok) {
    for (const issue of result.issues) {
      console.error(issue.path + " " + issue.message);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `Valid ${companion ? "companion" : "theme"} manifest: ${basename(input)}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
