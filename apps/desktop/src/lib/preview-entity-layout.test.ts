import { describe, expect, it } from "vitest";
import {
  previewEntityDimensions,
  resolvePreviewEntityScale,
} from "./preview-entity-layout";

describe("preview entity layout", () => {
  it("keeps authored pixels at the 100% Codex reference height", () => {
    expect(resolvePreviewEntityScale(760)).toBe(1);
    expect(previewEntityDimensions(136, 136, 760)).toEqual({
      scale: 1,
      width: 136,
      height: 136,
    });
  });

  it("preserves visual occupancy in miniature manager previews", () => {
    expect(previewEntityDimensions(136, 170, 380)).toEqual({
      scale: 0.5,
      width: 68,
      height: 85,
    });
  });

  it("does not enlarge above 100% or disappear in very small previews", () => {
    expect(resolvePreviewEntityScale(1_200)).toBe(1);
    expect(resolvePreviewEntityScale(80)).toBe(0.2);
  });
});
