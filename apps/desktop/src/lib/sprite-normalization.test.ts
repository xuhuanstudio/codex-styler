import { describe, expect, it } from "vitest";
import type { SpriteAtlasRenderer } from "@codex-styler/theme-core";
import { analyzeAtlasPixels } from "./sprite-normalization";

const renderer: SpriteAtlasRenderer = {
  type: "sprite-atlas",
  asset: "assets/companion.png",
  columns: 2,
  rows: 2,
  frameWidth: 4,
  frameHeight: 4,
  directions: 4,
  normalization: "grounded",
  alphaThreshold: 24,
};

describe("sprite normalization", () => {
  it("keeps one scale and one ground line across differently padded frames", () => {
    const pixels = new Uint8ClampedArray(8 * 8 * 4);
    const makeOpaque = (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      for (let row = y; row < y + height; row += 1) {
        for (let column = x; column < x + width; column += 1) {
          pixels[(row * 8 + column) * 4 + 3] = 255;
        }
      }
    };
    makeOpaque(1, 1, 2, 3);
    makeOpaque(4, 2, 4, 2);
    makeOpaque(0, 4, 3, 4);
    makeOpaque(5, 5, 2, 2);

    const analysis = analyzeAtlasPixels(pixels, 8, renderer);
    expect(analysis.frames).toEqual([
      { x: 1, y: 1, width: 2, height: 3 },
      { x: 0, y: 2, width: 4, height: 2 },
      { x: 0, y: 0, width: 3, height: 4 },
      { x: 1, y: 1, width: 2, height: 2 },
    ]);
    expect(analysis.maxWidth).toBe(4);
    expect(analysis.maxHeight).toBe(4);
  });
});
