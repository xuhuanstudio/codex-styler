import {
  THEME_PACKAGE_LIMITS,
  isSafeArchivePath,
  readImageDimensions,
} from "./archive";
import { assertCompanion, validateCompanion } from "./companion-validation";
import type { CompanionPackage, CompanionPackageDefinition } from "./types";

const allowedFile =
  /^(companion|LICENSES)\.json$|^(assets|previews)\/[A-Za-z0-9._/-]+\.(png|jpe?g|webp)$/i;

async function loadZip() {
  return (await import("jszip")).default;
}

async function inputBytes(
  input: Blob | ArrayBuffer | Uint8Array,
): Promise<ArrayBuffer | Uint8Array> {
  if (!(input instanceof Blob)) return input;
  if (typeof input.arrayBuffer === "function") return input.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read companion package"));
    reader.readAsArrayBuffer(input);
  });
}

function contentsMatch(path: string, bytes: Uint8Array): boolean {
  const lower = path.toLowerCase();
  if (lower.endsWith(".json")) {
    try {
      JSON.parse(new TextDecoder().decode(bytes));
      return true;
    } catch {
      return false;
    }
  }
  if (lower.endsWith(".png")) {
    return (
      bytes.length > 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
  }
  if (lower.endsWith(".webp")) {
    return (
      bytes.length > 12 &&
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

export async function importCompanionPackage(
  input: Blob | ArrayBuffer | Uint8Array,
): Promise<CompanionPackage> {
  const compressedSize = input instanceof Blob ? input.size : input.byteLength;
  if (compressedSize > THEME_PACKAGE_LIMITS.compressedBytes) {
    throw new Error("Companion package exceeds the 50 MiB compressed limit");
  }
  const JSZip = await loadZip();
  const zip = await JSZip.loadAsync(await inputBytes(input));
  let declaredTotal = 0;
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const unsafeOriginalName = (
      entry as typeof entry & { unsafeOriginalName?: string }
    ).unsafeOriginalName;
    if (unsafeOriginalName && unsafeOriginalName !== path) {
      throw new Error(
        `Archive entry used an unsafe path: ${unsafeOriginalName}`,
      );
    }
    if (!isSafeArchivePath(path) || !allowedFile.test(path)) {
      throw new Error(`Disallowed companion archive path: ${path}`);
    }
    const declaredSize = (
      entry as typeof entry & { _data?: { uncompressedSize?: number } }
    )._data?.uncompressedSize;
    if (typeof declaredSize === "number") {
      if (declaredSize > THEME_PACKAGE_LIMITS.singleFileBytes) {
        throw new Error(`Companion file exceeds the 20 MiB limit: ${path}`);
      }
      declaredTotal += declaredSize;
      if (declaredTotal > THEME_PACKAGE_LIMITS.uncompressedBytes) {
        throw new Error(
          "Companion package exceeds the 100 MiB extracted limit",
        );
      }
    }
  }

  const files = new Map<string, Uint8Array>();
  let total = 0;
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > THEME_PACKAGE_LIMITS.singleFileBytes) {
      throw new Error(`Companion file exceeds the 20 MiB limit: ${path}`);
    }
    total += bytes.byteLength;
    if (total > THEME_PACKAGE_LIMITS.uncompressedBytes) {
      throw new Error("Companion package exceeds the 100 MiB extracted limit");
    }
    if (!contentsMatch(path, bytes)) {
      throw new Error(`File contents do not match the declared type: ${path}`);
    }
    if (/\.(png|jpe?g|webp)$/i.test(path)) {
      const dimensions = readImageDimensions(path, bytes);
      if (!dimensions)
        throw new Error(`Could not read image dimensions: ${path}`);
      if (
        dimensions.width > THEME_PACKAGE_LIMITS.maxImageDimension ||
        dimensions.height > THEME_PACKAGE_LIMITS.maxImageDimension
      ) {
        throw new Error(`Companion image exceeds 8192 × 8192: ${path}`);
      }
    }
    files.set(path, bytes);
  }

  const manifest = files.get("companion.json");
  if (!manifest) throw new Error("Companion package is missing companion.json");
  const licenses = files.get("LICENSES.json");
  if (!licenses) throw new Error("Companion package is missing LICENSES.json");
  const companion = JSON.parse(
    new TextDecoder().decode(manifest),
  ) as CompanionPackageDefinition;
  const validation = validateCompanion(companion);
  if (!validation.ok) {
    throw new Error(
      "Companion manifest is invalid:\n" +
        validation.issues
          .map((issue) => `${issue.path} ${issue.message}`)
          .join("\n"),
    );
  }
  for (const asset of companion.assets) {
    if (!files.has(asset.path)) {
      throw new Error(`Declared companion asset is missing: ${asset.path}`);
    }
  }
  const declaredPaths = new Set([
    "companion.json",
    "LICENSES.json",
    ...companion.assets.map((asset) => asset.path),
  ]);
  for (const path of files.keys()) {
    if (!declaredPaths.has(path)) {
      throw new Error(`Companion package contains an undeclared file: ${path}`);
    }
  }
  return { companion, files };
}

export async function exportCompanionPackage(
  companion: CompanionPackageDefinition,
  resolveAsset: (path: string) => Promise<Uint8Array>,
): Promise<Blob> {
  assertCompanion(companion);
  const JSZip = await loadZip();
  const zip = new JSZip();
  zip.file("companion.json", JSON.stringify(companion, null, 2));
  zip.file(
    "LICENSES.json",
    JSON.stringify(
      {
        companion: companion.metadata.license,
        assets: companion.assets.map(({ path, license }) => ({
          path,
          license,
        })),
      },
      null,
      2,
    ),
  );
  for (const asset of companion.assets) {
    zip.file(asset.path, await resolveAsset(asset.path));
  }
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}
