import { describe, expect, it } from "vitest";
import { mattePixel, retainLargestAlphaComponent } from "./media";

describe("local controllable matte", () => {
  it("makes sampled background transparent while retaining distant subject color", () => {
    const settings = { tolerance: 20, feather: 4, despill: 40 };
    expect(mattePixel([252, 250, 252, 255], [255, 255, 255], settings)[3]).toBe(
      0,
    );
    expect(mattePixel([180, 40, 30, 255], [255, 255, 255], settings)[3]).toBe(
      255,
    );
  });

  it("feathers pixels near the tolerance boundary", () => {
    const alpha = mattePixel([212, 212, 212, 255], [255, 255, 255], {
      tolerance: 24,
      feather: 8,
      despill: 0,
    })[3];
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(255);
  });

  it("removes detached matte specks while preserving the connected subject", () => {
    const image = {
      data: new Uint8ClampedArray(4 * 3 * 4),
      width: 4,
      height: 3,
      colorSpace: "srgb",
    } as ImageData;
    for (const index of [0, 1, 4, 5, 10]) image.data[index * 4 + 3] = 255;
    retainLargestAlphaComponent(image);
    expect(image.data[10 * 4 + 3]).toBe(0);
    expect(image.data[5 * 4 + 3]).toBe(255);
  });
});
