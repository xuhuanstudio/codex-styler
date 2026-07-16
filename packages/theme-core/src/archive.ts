import JSZip from "jszip";
import { assertTheme, validateTheme } from "./validation";
import type { ThemeDefinition, ThemePackage } from "./types";

export const THEME_PACKAGE_LIMITS = {
  compressedBytes: 50 * 1024 * 1024,
  uncompressedBytes: 100 * 1024 * 1024,
  singleFileBytes: 20 * 1024 * 1024,
  maxImageDimension: 8192,
} as const;

const allowedFile = /^(theme|LICENSES)\.json$|^(assets|previews)\/[A-Za-z0-9._/-]+\.(png|jpe?g|webp)$/i;

export function isSafeArchivePath(path: string): boolean {
  if (!path || path.startsWith("/") || path.includes("\\") || path.includes("\0")) {
    return false;
  }
  const parts = path.split("/");
  return !parts.some((part) => part === ".." || part === ".");
}

function hasExpectedMagic(path: string, bytes: Uint8Array): boolean {
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

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] * 256 + bytes[offset + 1];
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + bytes[offset + 1] * 256;
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65_536;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 16_777_216 +
    bytes[offset + 1] * 65_536 +
    bytes[offset + 2] * 256 +
    bytes[offset + 3]
  );
}

export function readImageDimensions(
  path: string,
  bytes: Uint8Array,
): { width: number; height: number } | null {
  const lower = path.toLowerCase();

  if (lower.endsWith(".png") && bytes.length >= 24) {
    return {
      width: readUint32BE(bytes, 16),
      height: readUint32BE(bytes, 20),
    };
  }

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    let offset = 2;
    const startOfFrame = new Set([
      0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
      0xce, 0xcf,
    ]);
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0x01) continue;
      if (marker === 0xd9 || marker === 0xda || offset + 2 > bytes.length) break;
      const segmentLength = readUint16BE(bytes, offset);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if (startOfFrame.has(marker) && segmentLength >= 7) {
        return {
          width: readUint16BE(bytes, offset + 5),
          height: readUint16BE(bytes, offset + 3),
        };
      }
      offset += segmentLength;
    }
    return null;
  }

  if (lower.endsWith(".webp") && bytes.length >= 30) {
    const chunk = new TextDecoder().decode(bytes.slice(12, 16));
    if (chunk === "VP8X") {
      return {
        width: readUint24LE(bytes, 24) + 1,
        height: readUint24LE(bytes, 27) + 1,
      };
    }
    if (chunk === "VP8L" && bytes[20] === 0x2f && bytes.length >= 25) {
      return {
        width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
        height:
          1 +
          (bytes[22] >> 6) +
          (bytes[23] << 2) +
          ((bytes[24] & 0x0f) << 10),
      };
    }
    if (
      chunk === "VP8 " &&
      bytes.length >= 30 &&
      bytes[23] === 0x9d &&
      bytes[24] === 0x01 &&
      bytes[25] === 0x2a
    ) {
      return {
        width: readUint16LE(bytes, 26) & 0x3fff,
        height: readUint16LE(bytes, 28) & 0x3fff,
      };
    }
  }

  return null;
}

export async function importThemePackage(
  input: Blob | ArrayBuffer | Uint8Array,
): Promise<ThemePackage> {
  const compressedSize =
    input instanceof Blob
      ? input.size
      : input instanceof Uint8Array
        ? input.byteLength
        : input.byteLength;

  if (compressedSize > THEME_PACKAGE_LIMITS.compressedBytes) {
    throw new Error("Theme package exceeds the 50 MiB compressed limit");
  }

  const zipInput = input instanceof Blob ? await input.arrayBuffer() : input;
  const zip = await JSZip.loadAsync(zipInput);
  const files = new Map<string, Uint8Array>();
  let declaredTotal = 0;
  let total = 0;

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const unsafeOriginalName = (
      entry as typeof entry & { unsafeOriginalName?: string }
    ).unsafeOriginalName;
    if (unsafeOriginalName && unsafeOriginalName !== path) {
      throw new Error("Archive entry was normalized from an unsafe path: " + unsafeOriginalName);
    }
    if (!isSafeArchivePath(path) || !allowedFile.test(path)) {
      throw new Error("Disallowed archive path or file type: " + path);
    }

    const declaredSize = (
      entry as typeof entry & { _data?: { uncompressedSize?: number } }
    )._data?.uncompressedSize;
    if (typeof declaredSize === "number") {
      if (declaredSize > THEME_PACKAGE_LIMITS.singleFileBytes) {
        throw new Error("Theme file exceeds the 20 MiB limit: " + path);
      }
      declaredTotal += declaredSize;
      if (declaredTotal > THEME_PACKAGE_LIMITS.uncompressedBytes) {
        throw new Error("Theme package exceeds the 100 MiB extracted limit");
      }
    }
  }

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;

    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > THEME_PACKAGE_LIMITS.singleFileBytes) {
      throw new Error("Theme file exceeds the 20 MiB limit: " + path);
    }
    total += bytes.byteLength;
    if (total > THEME_PACKAGE_LIMITS.uncompressedBytes) {
      throw new Error("Theme package exceeds the 100 MiB extracted limit");
    }
    if (!hasExpectedMagic(path, bytes)) {
      throw new Error("File contents do not match the declared type: " + path);
    }
    if (/\.(png|jpe?g|webp)$/i.test(path)) {
      const dimensions = readImageDimensions(path, bytes);
      if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
        throw new Error("Could not read image dimensions: " + path);
      }
      if (
        dimensions.width > THEME_PACKAGE_LIMITS.maxImageDimension ||
        dimensions.height > THEME_PACKAGE_LIMITS.maxImageDimension
      ) {
        throw new Error("Theme image exceeds the 8192 × 8192 limit: " + path);
      }
    }
    files.set(path, bytes);
  }

  const manifestBytes = files.get("theme.json");
  if (!manifestBytes) throw new Error("Theme package is missing theme.json");

  const theme = JSON.parse(new TextDecoder().decode(manifestBytes)) as unknown;
  const result = validateTheme(theme);
  if (!result.ok) {
    throw new Error(
      "Theme manifest is invalid:\n" +
        result.issues.map((issue) => issue.path + " " + issue.message).join("\n"),
    );
  }
  assertTheme(theme);

  for (const asset of theme.assets) {
    if (!files.has(asset.path)) {
      throw new Error("Declared asset is missing: " + asset.path);
    }
  }

  return { theme, files };
}

export async function exportThemePackage(
  theme: ThemeDefinition,
  resolveAsset?: (path: string) => Promise<Uint8Array>,
): Promise<Blob> {
  assertTheme(theme);
  const zip = new JSZip();
  zip.file("theme.json", JSON.stringify(theme, null, 2));
  zip.file(
    "LICENSES.json",
    JSON.stringify(
      {
        theme: theme.metadata.license,
        assets: theme.assets.map(({ path, license }) => ({ path, license })),
      },
      null,
      2,
    ),
  );

  for (const asset of theme.assets) {
    if (!resolveAsset) {
      throw new Error("An asset resolver is required to export " + asset.path);
    }
    zip.file(asset.path, await resolveAsset(asset.path));
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}
