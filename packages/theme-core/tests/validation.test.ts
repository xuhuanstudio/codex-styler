import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  builtinCompanions,
  builtinThemes,
  companionToPackage,
  composeThemeWithCompanion,
  defaultCompanionForTheme,
  embeddedCompanionForTheme,
  exportCompanionPackage,
  exportThemePackage,
  importCompanionPackage,
  importThemePackage,
  isSafeArchivePath,
  nativeRefined,
  mossCompanion,
  pointerDirectionFrame,
  readImageDimensions,
  validateTheme,
  validateCompanion,
} from "../src";

describe("built-in themes", () => {
  it("conform to the public v1 schema", () => {
    for (const theme of builtinThemes) {
      expect(validateTheme(theme), theme.id).toEqual({ ok: true, issues: [] });
    }
  });

  it("declares replaceable shell treatments instead of hard-coded theme ids", () => {
    expect(
      builtinThemes.map((theme) => theme.variants.dark.appearance.layout),
    ).toEqual(["native", "editorial", "immersive", "editorial", "immersive"]);
    expect(
      builtinThemes.every(
        (theme) => theme.variants.dark.appearance.iconStyle !== undefined,
      ),
    ).toBe(true);
  });

  it("accepts portable semantic palette overrides without exposing Codex tokens", () => {
    const theme = structuredClone(nativeRefined);
    theme.variants.dark.appearance.palette = {
      canvas: "#101318",
      surfaceRaised: "#252A31",
      controlHover: "#303741",
      success: "#52C982",
    };
    expect(validateTheme(theme)).toEqual({ ok: true, issues: [] });
    expect(JSON.stringify(theme)).not.toContain("--color-token");
  });

  it("ships the two expressive themes with complete light and dark palettes", () => {
    const expressiveThemeIds = new Set([
      "codex-styler.gilded-grandeur",
      "codex-styler.merry-big-top",
    ]);
    const expressiveThemes = builtinThemes.filter((theme) =>
      expressiveThemeIds.has(theme.id),
    );
    expect(expressiveThemes).toHaveLength(2);
    for (const theme of expressiveThemes) {
      for (const variant of Object.values(theme.variants)) {
        expect(variant.background.image, theme.id).toBeDefined();
        expect(
          Object.keys(variant.appearance.palette ?? {}),
          `${theme.id} semantic palette`,
        ).toHaveLength(19);
        expect(variant.appearance.iconStyle).toBe("themed");
        expect(variant.appearance.decorations).toBe("expressive");
      }
    }
  });

  it("uses a CSP-safe precompiled schema validator", async () => {
    const source = await readFile(
      new URL("../src/generated/theme-validator.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/\brequire\s*\(|\bnew Function\b|\beval\s*\(/u);
  });

  it("composes a companion independently without mutating the theme", () => {
    const composed = composeThemeWithCompanion(nativeRefined, mossCompanion, {
      anchor: { x: 40, y: 60 },
    });
    expect(nativeRefined.scene.entities).toHaveLength(0);
    expect(composed.scene.entities[0]?.id).toBe("moss-gecko");
    expect(composed.scene.entities[0]?.anchor).toEqual({ x: 40, y: 60 });
    expect(composed.scene.entities[0]?.attachment?.target).toBe("composer");
    expect(composed.scene.entities[0]?.renderer.normalization).toBe("preserve");
    expect(
      mossCompanion.assets.filter((asset) => asset.type === "sprite-atlas"),
    ).toHaveLength(4);
    expect(composed.scene.entities[0]?.renderer).toMatchObject({
      directions: 181,
      framesPerPage: 48,
      transitionFps: 60,
    });
    expect(validateTheme(composed)).toEqual({ ok: true, issues: [] });
  });

  it("keeps a v0.1 embedded companion available during migration", () => {
    const legacy = structuredClone(nativeRefined);
    legacy.scene.entities = [structuredClone(mossCompanion.entity)];
    legacy.assets.push(...structuredClone(mossCompanion.assets));
    const migrated = embeddedCompanionForTheme(legacy);
    expect(migrated?.entity.id).toBe("moss-gecko");
    expect(migrated?.assets).toHaveLength(
      mossCompanion.assets.filter((asset) => asset.type === "sprite-atlas")
        .length,
    );
  });

  it("recommends an intentional companion for every built-in theme", () => {
    expect(
      builtinThemes.map((theme) => defaultCompanionForTheme(theme.id)?.id),
    ).toEqual([
      "moss-gecko",
      "reset-god",
      "token-thief",
      "moss-gecko",
      "moss-gecko",
    ]);
    expect(defaultCompanionForTheme("local.blank-theme")).toBeNull();
  });

  it("ships every calibrated companion as a valid independent composition", () => {
    expect(builtinCompanions.map((companion) => companion.id)).toEqual([
      "moss-gecko",
      "reset-god",
      "token-thief",
      "pico-parrot",
      "puddle-frog",
      "mochi-cat",
    ]);
    for (const companion of builtinCompanions) {
      const composed = composeThemeWithCompanion(nativeRefined, companion);
      const renderer = composed.scene.entities[0]?.renderer;
      expect(renderer?.type, companion.id).toBe("sprite-atlas");
      if (renderer?.type !== "sprite-atlas") continue;
      expect(renderer.pages, companion.id).toHaveLength(
        companion.assets.filter((asset) => asset.type === "sprite-atlas")
          .length,
      );
      expect(companion.metadata.preview, companion.id).toMatch(
        /-portrait\.webp$/u,
      );
      expect(
        companion.assets.some(
          (asset) =>
            asset.type === "preview" &&
            asset.path === companion.metadata.preview,
        ),
        companion.id,
      ).toBe(true);
      expect(renderer.frameAngles, companion.id).toHaveLength(
        renderer.directions,
      );
      expect(renderer.frameCount, companion.id).toBe(renderer.directions);
      expect(renderer.poses?.length, companion.id).toBeGreaterThanOrEqual(4);
      expect(
        validateCompanion(companionToPackage(companion)),
        companion.id,
      ).toEqual({ ok: true, issues: [] });
      expect(validateTheme(composed), companion.id).toEqual({
        ok: true,
        issues: [],
      });
    }
  });
});

describe("companion packages", () => {
  it("exports and imports a licensed, data-only companion archive", async () => {
    const webp = new Uint8Array(30);
    webp.set(new TextEncoder().encode("RIFF"), 0);
    webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
    webp.set([0xff, 0x00, 0x00], 24);
    webp.set([0xff, 0x00, 0x00], 27);

    const definition = companionToPackage(mossCompanion);
    const archive = await exportCompanionPackage(definition, async () => webp);
    const imported = await importCompanionPackage(archive);

    expect(imported.companion.id).toBe("moss-gecko");
    expect(imported.companion.entity.renderer).toMatchObject({
      frameCount: 181,
      neutralFrame: 0,
    });
    expect(imported.files.has("LICENSES.json")).toBe(true);
  });

  it("rejects invalid pose references and atlas bounds", () => {
    const definition = companionToPackage(mossCompanion);
    const renderer = definition.entity.renderer;
    expect(renderer.type).toBe("sprite-atlas");
    if (renderer.type !== "sprite-atlas" || !renderer.poses) return;
    renderer.poses[0]!.frame = 999;
    expect(validateCompanion(definition)).toMatchObject({ ok: false });
  });

  it("rejects undeclared files even when their type is otherwise allowed", async () => {
    const definition = companionToPackage(mossCompanion);
    const zip = new JSZip();
    zip.file("companion.json", JSON.stringify(definition));
    zip.file("LICENSES.json", "{}");
    const webp = new Uint8Array(30);
    webp.set(new TextEncoder().encode("RIFF"), 0);
    webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
    for (const asset of definition.assets) zip.file(asset.path, webp);
    zip.file("previews/undeclared.webp", webp);

    await expect(
      importCompanionPackage(await zip.generateAsync({ type: "uint8array" })),
    ).rejects.toThrow(/undeclared file/);
  });

  it("rejects traversal hidden by ZIP path normalization", async () => {
    const zip = new JSZip();
    zip.file("../companion.json", "{}");
    await expect(
      importCompanionPackage(await zip.generateAsync({ type: "uint8array" })),
    ).rejects.toThrow(/unsafe path|Disallowed companion archive path/);
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
    await expect(
      importThemePackage(await zip.generateAsync({ type: "uint8array" })),
    ).rejects.toThrow(/unsafe path|Disallowed archive path/);
  });
});

describe("pointer direction mapping", () => {
  it("maps cardinal screen directions clockwise from up", () => {
    expect(pointerDirectionFrame(50, 0, 50, 50, 16)).toBe(0);
    expect(pointerDirectionFrame(100, 50, 50, 50, 16)).toBe(4);
    expect(pointerDirectionFrame(50, 100, 50, 50, 16)).toBe(8);
    expect(pointerDirectionFrame(0, 50, 50, 50, 16)).toBe(12);
  });

  it("uses calibrated non-linear frame angles when supplied", () => {
    expect(pointerDirectionFrame(100, 50, 50, 50, 4, [0, 20, 40, 180])).toBe(2);
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
