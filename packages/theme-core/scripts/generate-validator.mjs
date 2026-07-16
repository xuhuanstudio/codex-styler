import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import addFormats from "ajv-formats";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const schemaPath = new URL("../schema/theme.schema.json", import.meta.url);
const outputPath = new URL("../src/generated/theme-validator.ts", import.meta.url);
const schema = JSON.parse(await readFile(schemaPath, "utf8"));

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  allowUnionTypes: true,
  code: { source: true, esm: true, lines: true },
});
addFormats(ajv);

let generated = standaloneCode(ajv, ajv.compile(schema));
generated = generated
  .replace(
    'const func2 = require("ajv/dist/runtime/ucs2length").default;',
    "const func2 = ucs2Length;",
  )
  .replace(
    'const formats0 = require("ajv-formats/dist/formats").fullFormats.uri;',
    "const formats0 = fullFormats.uri;",
  )
  .replace(
    'const func0 = require("ajv/dist/runtime/equal").default;',
    "const func0 = deepEqual;",
  );

if (/\brequire\s*\(|\bnew Function\b|\beval\s*\(/u.test(generated)) {
  throw new Error("Generated validator contains a runtime code-generation primitive");
}

const output = `// Generated from schema/theme.schema.json. Do not edit by hand.
// @ts-nocheck -- Ajv emits optimized JavaScript without TypeScript annotations.
import ucs2Length from "ajv/dist/runtime/ucs2length.js";
import deepEqual from "ajv/dist/runtime/equal.js";
import { fullFormats } from "ajv-formats/dist/formats.js";

${generated}`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) {
    console.error(
      "Generated theme validator is stale. Run: pnpm --filter @codex-styler/theme-core generate:validator",
    );
    process.exitCode = 1;
  }
} else {
  await mkdir(new URL("../src/generated/", import.meta.url), { recursive: true });
  await writeFile(outputPath, output);
  console.log(`Generated ${fileURLToPath(outputPath).replace(packageRoot, "")}`);
}
