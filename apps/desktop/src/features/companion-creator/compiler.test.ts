import { afterEach, describe, expect, it, vi } from "vitest";
import {
  companionToPackage,
  exportCompanionPackage,
  importCompanionPackage,
} from "@codex-styler/theme-core";
import {
  assertEncodedFileSize,
  assertOutputCanvasSize,
  atlasPackLayout,
  compileCompanion,
  decodedPageLimit,
  encodedFileLimit,
  expandMotionFrames,
  rasterDimensionLimit,
  rasterExtensionForBytes,
} from "./compiler";
import { createCompanionProject } from "./model";

function canvasContextMock() {
  return {
    save: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    restore: vi.fn(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("companion atlas compiler limits", () => {
  it("keeps every decoded atlas page within the 48 MiB target", () => {
    const layout = atlasPackLayout(1000, 1000, 80);
    expect(layout.columns * layout.rows * 1000 * 1000 * 4).toBeLessThanOrEqual(
      decodedPageLimit,
    );
    expect(layout.pages).toBeLessThanOrEqual(8);
  });

  it("rejects a canvas that would require more than eight safe pages", () => {
    expect(() => atlasPackLayout(1000, 1000, 100)).toThrow(
      /eight safe atlas pages/,
    );
  });

  it("rejects every generated asset above the encoded package limit", () => {
    expect(() => assertEncodedFileSize(encodedFileLimit)).not.toThrow();
    expect(() => assertEncodedFileSize(encodedFileLimit + 1)).toThrow(
      /20 MiB package limit/,
    );
  });

  it("rejects shared canvases that exceed the raster dimension limit", () => {
    expect(() =>
      assertOutputCanvasSize(rasterDimensionLimit, rasterDimensionLimit),
    ).not.toThrow();
    expect(() => assertOutputCanvasSize(rasterDimensionLimit + 1, 512)).toThrow(
      /8192 pixels/,
    );
  });

  it("expands ping-pong motion without duplicating the endpoints", () => {
    expect(expandMotionFrames([0, 1, 2, 3], "ping-pong")).toEqual([
      0, 1, 2, 3, 2, 1,
    ]);
  });
});

describe("generated companion asset formats", () => {
  it("uses image signatures instead of trusting a requested Canvas MIME type", () => {
    const png = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const webp = Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      0x00,
    ]);

    expect(rasterExtensionForBytes(png)).toBe("png");
    expect(rasterExtensionForBytes(webp)).toBe("webp");
  });

  it("renames Canvas PNG fallback output before package validation", async () => {
    const png = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ close: vi.fn(), width: 2, height: 2 }),
    );
    const context = canvasContextMock();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) =>
        callback(
          new Blob([png], {
            // Reproduces a WebView that reports the requested type while
            // returning PNG bytes.
            type: "image/webp",
          }),
        ),
    );

    const project = createCompanionProject("local.canvas-fallback");
    project.name = "Canvas fallback";
    project.description = "A locally generated test companion.";
    project.author = "Codex Styler";
    project.license = "CC0-1.0";
    project.sharedCrop = { x: 0, y: 0, width: 2, height: 2 };
    project.groundLine = 2;
    project.contentScale = 0.75;
    project.frames = [
      {
        id: "frame-0",
        sourceIndex: 0,
        excluded: false,
        visualDelta: 0,
        baselineOffset: { x: 2, y: 3 },
      },
    ];

    const result = await compileCompanion(project, [
      {
        id: "frame-0",
        sourceIndex: 0,
        blob: new Blob([png], { type: "image/png" }),
        url: "blob:test",
        width: 2,
        height: 2,
      },
    ]);

    expect(result.companion.metadata.preview).toBe("previews/portrait.png");
    expect(result.companion.entity.renderer.asset).toBe("assets/companion.png");
    expect([...result.files.keys()]).toEqual([
      "previews/portrait.png",
      "assets/companion.png",
    ]);
    expect(context.scale).toHaveBeenCalledWith(0.75, 0.75);
    expect(context.translate).toHaveBeenCalledWith(2, 3);
  });

  it("renames every atlas page when a WebView falls back to PNG", async () => {
    const png = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlDq0EAAAAASUVORK5CYII=",
      ),
      (character) => character.charCodeAt(0),
    );
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ close: vi.fn(), width: 2, height: 2 }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      canvasContextMock() as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(new Blob([png], { type: "image/webp" })),
    );

    const project = createCompanionProject("local.canvas-atlas-fallback");
    project.name = "Canvas atlas fallback";
    project.description = "A locally generated multi-frame test companion.";
    project.author = "Codex Styler";
    project.license = "CC0-1.0";
    project.sharedCrop = { x: 0, y: 0, width: 16, height: 16 };
    project.frames = Array.from({ length: 4 }, (_, index) => ({
      id: `frame-${index}`,
      sourceIndex: index,
      excluded: false,
      visualDelta: index === 0 ? 0 : 1,
      baselineOffset: { x: 0, y: 0 },
    }));
    project.directionAnchors = [0, 90, 180, 270].map((angle, index) => ({
      id: `anchor-${index}`,
      frameIndex: index,
      angle,
    }));

    const result = await compileCompanion(
      project,
      project.frames.map((frame, index) => ({
        id: frame.id,
        sourceIndex: index,
        blob: new Blob([png], { type: "image/png" }),
        url: `blob:test-${index}`,
        width: 16,
        height: 16,
      })),
    );

    expect(result.companion.metadata.preview).toBe("previews/portrait.png");
    expect(result.companion.entity.renderer.type).toBe("sprite-atlas");
    if (result.companion.entity.renderer.type !== "sprite-atlas") {
      throw new Error("Expected a sprite atlas companion");
    }
    expect(result.companion.entity.renderer.asset).toBe("assets/atlas-1.png");
    expect(result.companion.entity.renderer.pages).toEqual([
      "assets/atlas-1.png",
    ]);
    expect([...result.files.keys()]).toEqual([
      "previews/portrait.png",
      "assets/atlas-1.png",
    ]);

    const archive = await exportCompanionPackage(
      companionToPackage(result.companion),
      async (path) => result.files.get(path)!,
    );
    const installed = await importCompanionPackage(archive);
    expect(installed.companion.entity.renderer.asset).toBe(
      "assets/atlas-1.png",
    );
  });
});
