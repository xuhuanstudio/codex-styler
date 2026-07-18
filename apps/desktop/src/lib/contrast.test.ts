import { describe, expect, it } from "vitest";
import {
  adaptiveReadableColor,
  compositeColor,
  contrastRatio,
  minimumContrast,
  mixColors,
} from "./contrast";

describe("adaptive contrast", () => {
  it("preserves authored colors that already meet the target", () => {
    expect(adaptiveReadableColor("#f1e8da", "#151515")).toBe("#f1e8da");
  });

  it("moves only as far as needed instead of snapping to pure white", () => {
    const color = adaptiveReadableColor("#777777", "#202020");
    expect(color).not.toBe("#ffffff");
    expect(color).not.toBe("#f7f7f5");
    expect(contrastRatio(color, "#202020")).toBeGreaterThanOrEqual(4.49);
  });

  it("retains a restrained theme tint while correcting luminance", () => {
    const color = adaptiveReadableColor("#8b6f5c", "#282421");
    const channels = [1, 3, 5].map((index) =>
      Number.parseInt(color.slice(index, index + 2), 16),
    );
    expect(contrastRatio(color, "#282421")).toBeGreaterThanOrEqual(4.49);
    expect(channels[0]).toBeGreaterThan(channels[2]);
    expect(new Set(channels).size).toBeGreaterThan(1);
  });

  it("finds one restrained foreground for multiple surface samples", () => {
    const color = adaptiveReadableColor("#222222", ["#8f8f8f", "#f7f7f7"], 4.5);
    expect(
      minimumContrast(color, ["#8f8f8f", "#f7f7f7"]),
    ).toBeGreaterThanOrEqual(4.49);
  });

  it("composites translucent surfaces in display order", () => {
    expect(mixColors("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(compositeColor("#ffffff", "#000000", 0.5)).toBe("#808080");
  });
});
