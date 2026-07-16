import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  builtinThemes,
  exportThemePackage,
  importThemePackage,
  isSafeArchivePath,
  nativeRefined,
  pointerDirectionFrame,
  readImageDimensions,
  validateTheme,
} from "../src";

describe("built-in themes", () => {
  it("conform to the public v1 schema", () => {
    for (const theme of builtinThemes) {
      expect(validateTheme(theme), theme.id).toEqual({ ok: true, issues: [] });
    }
  });
});

describe("archive path safety", () => {
  it("rejects traversal and absolute paths", () => {
    expect(isSafeArchivePath("../theme.json")).toBe(false);
    expect(isSafeArchivePath("/assets/image.png")).toBe(false);
    expect(isSafeArchivePath("assets\\image.png")).toBe(false);
    expect(isSafeArchivePath("assets/image.png")).toBe(true);
  });

  it("rejects a path that ZIP normalization would otherwise hide", async () => {
    const zip = new JSZip();
    zip.file("../theme.json", "{}");
    await expect(importThemePackage(await zip.generateAsync({ type: "uint8array" })))
      .rejects.toThrow(/unsafe path|Disallowed archive path/);
  });
});

describe("pointer direction mapping", () => {
  it("maps cardinal screen directions clockwise from up", () => {
    expect(pointerDirectionFrame(50, 0, 50, 50, 16)).toBe(0);
    expect(pointerDirectionFrame(100, 50, 50, 50, 16)).toBe(4);
    expect(pointerDirectionFrame(50, 100, 50, 50, 16)).toBe(8);
    expect(pointerDirectionFrame(0, 50, 50, 50, 16)).toBe(12);
  });
});

describe("image dimension inspection", () => {
  it("reads PNG dimensions without decoding pixels", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47], 0);
    png.set([0x00, 0x00, 0x06, 0x40], 16);
    png.set([0x00, 0x00, 0x03, 0x84], 20);
    expect(readImageDimensions("assets/background.png", png)).toEqual({
      width: 1600,
      height: 900,
    });
  });

  it("reads extended WebP canvas dimensions", () => {
    const webp = new Uint8Array(30);
    webp.set(new TextEncoder().encode("RIFF"), 0);
    webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
    webp.set([0x3f, 0x06, 0x00], 24);
    webp.set([0x83, 0x03, 0x00], 27);
    expect(readImageDimensions("assets/background.webp", webp)).toEqual({
      width: 1600,
      height: 900,
    });
  });
});

describe("theme package round trip", () => {
  it("exports and imports a validated data-only archive", async () => {
    const webp = new Uint8Array(30);
    webp.set(new TextEncoder().encode("RIFF"), 0);
    webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
    webp.set([0x3f, 0x06, 0x00], 24);
    webp.set([0x83, 0x03, 0x00], 27);

    const archive = await exportThemePackage(nativeRefined, async () => webp);
    const imported = await importThemePackage(archive);
    expect(imported.theme.id).toBe(nativeRefined.id);
    expect(imported.files.has("previews/native-refined.webp")).toBe(true);
  });

  it("rejects remote resources at the schema boundary", () => {
    const theme = structuredClone(nativeRefined) as unknown as {
      variants: { dark: { background: { image?: string } } };
    };
    theme.variants.dark.background.image = "https://example.com/image.webp";
    expect(validateTheme(theme).ok).toBe(false);
  });
});
