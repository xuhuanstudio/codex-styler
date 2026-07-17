import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import addFormats from "ajv-formats";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const validators = [
  {
    source: "theme.schema.json",
    output: "theme-validator.ts",
  },
  {
    source: "companion.schema.json",
    output: "companion-validator.ts",
  },
];

function generateValidator(schema) {
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
      /const (func\d+) = require\("ajv\/dist\/runtime\/ucs2length"\)\.default;/gu,
      "const $1 = ucs2Length;",
    )
    .replace(
      /const (formats\d+) = require\("ajv-formats\/dist\/formats"\)\.fullFormats\.uri;/gu,
      "const $1 = fullFormats.uri;",
    )
    .replace(
      /const (func\d+) = require\("ajv\/dist\/runtime\/equal"\)\.default;/gu,
      "const $1 = deepEqual;",
    );

  if (/\brequire\s*\(|\bnew Function\b|\beval\s*\(/u.test(generated)) {
    throw new Error(
      "Generated validator contains a runtime code-generation primitive",
    );
  }
  return generated;
}

function normalizeLineEndings(value) {
  return value.replace(/\r\n?/gu, "\n");
}

await mkdir(new URL("../src/generated/", import.meta.url), {
  recursive: true,
});

let stale = false;
for (const validator of validators) {
  const schemaPath = new URL(`../schema/${validator.source}`, import.meta.url);
  const outputPath = new URL(
    `../src/generated/${validator.output}`,
    import.meta.url,
  );
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const generated = generateValidator(schema);
  const output = `// Generated from schema/${validator.source}. Do not edit by hand.
// @ts-nocheck -- Ajv emits optimized JavaScript without TypeScript annotations.
import ucs2LengthRuntime from "ajv/dist/runtime/ucs2length.js";
import deepEqualRuntime from "ajv/dist/runtime/equal.js";
import { fullFormats } from "ajv-formats/dist/formats.js";

// Node ESM exposes these CommonJS helpers as { default }, while Vite unwraps them.
const ucs2Length = ucs2LengthRuntime.default ?? ucs2LengthRuntime;
const deepEqual = deepEqualRuntime.default ?? deepEqualRuntime;

${generated}`;

  if (process.argv.includes("--check")) {
    const current = await readFile(outputPath, "utf8").catch(() => "");
    if (normalizeLineEndings(current) !== normalizeLineEndings(output)) {
      stale = true;
      console.error(`Generated validator is stale: ${validator.output}`);
    }
  } else {
    await writeFile(outputPath, output);
    console.log(
      `Generated ${fileURLToPath(outputPath).replace(packageRoot, "")}`,
    );
  }
}

if (stale) {
  console.error(
    "Run: pnpm --filter @codex-styler/theme-core generate:validator",
  );
  process.exitCode = 1;
}
