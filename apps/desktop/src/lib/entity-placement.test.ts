import { describe, expect, it } from "vitest";
import {
  clampEntityCenter,
  resolveAttachedEntityPosition,
  resolveFreeEntityAnchor,
  resolveFreeEntityPosition,
} from "./entity-placement";

describe("entity placement", () => {
  it("keeps the complete companion inside the viewport safe area", () => {
    expect(clampEntityCenter(318, 160, 320)).toBe(232);
    expect(
      resolveFreeEntityPosition(
        { x: 318, y: 238 },
        { width: 160, height: 120 },
        { width: 320, height: 240 },
      ),
    ).toEqual({ x: 232, y: 172 });
  });

  it("returns stable center percentages after a size-aware drag", () => {
    expect(
      resolveFreeEntityAnchor(
        { x: -20, y: 280 },
        { width: 80, height: 120 },
        { width: 400, height: 300 },
      ),
    ).toEqual({ x: 12, y: 77.33333333333333 });
  });

  it("clamps top and bottom attachments without breaking their edge model", () => {
    const target = { x: 260, y: 210, width: 80, height: 48 };
    const entity = { width: 140, height: 160 };
    const viewport = { width: 360, height: 280 };

    expect(
      resolveAttachedEntityPosition(
        target,
        {
          target: "composer",
          edge: "top",
          align: 1,
          offset: { x: 12, y: 3 },
        },
        entity,
        viewport,
      ),
    ).toEqual({ x: 282, y: 213 });

    expect(
      resolveAttachedEntityPosition(
        target,
        {
          target: "composer",
          edge: "bottom",
          align: 0,
          offset: { x: -20, y: 3 },
        },
        entity,
        viewport,
      ),
    ).toEqual({ x: 240, y: 112 });
  });

  it("uses the most visible edge when an oversized companion cannot fit", () => {
    expect(
      resolveAttachedEntityPosition(
        { x: 20, y: 100, width: 200, height: 40 },
        {
          target: "composer",
          edge: "top",
          align: 0.5,
          offset: { x: 0, y: 0 },
        },
        { width: 500, height: 360 },
        { width: 320, height: 240 },
      ),
    ).toEqual({ x: 160, y: 232 });
  });
});
