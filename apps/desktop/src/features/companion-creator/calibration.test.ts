import { describe, expect, it } from "vitest";
import {
  atlasCellRect,
  atlasOverflow,
  calibrateDirections,
  commonSubjectCrop,
  normalizeAngle,
  pointerAngle,
} from "./calibration";
import type { DirectionAnchor, LogicalFrame } from "./model";

function frames(deltas: number[]): LogicalFrame[] {
  return deltas.map((visualDelta, index) => ({
    id: `frame-${index}`,
    sourceIndex: index,
    excluded: false,
    visualDelta,
    baselineOffset: { x: 0, y: 0 },
  }));
}

describe("companion direction calibration", () => {
  it("uses clockwise screen angles with zero at the top", () => {
    expect(pointerAngle(50, 0, 50, 50)).toBe(0);
    expect(pointerAngle(100, 50, 50, 50)).toBe(90);
    expect(pointerAngle(50, 100, 50, 50)).toBe(180);
    expect(pointerAngle(0, 50, 50, 50)).toBe(270);
    expect(normalizeAngle(360)).toBe(0);
  });

  it("interpolates by cumulative visual change rather than frame number", () => {
    const input = frames([0, 1, 8, 1, 1]);
    const anchors: DirectionAnchor[] = [
      { id: "a", frameIndex: 0, angle: 0 },
      { id: "b", frameIndex: 4, angle: 90 },
    ];
    const calibrated = calibrateDirections(input, anchors);
    expect(calibrated.frameAngles[1]).toBeCloseTo(8.18, 1);
    expect(calibrated.frameAngles[2]).toBeCloseTo(73.64, 1);
  });

  it("leaves excluded frames unmapped and reports incomplete ranges", () => {
    const input = frames([0, 1, 1, 1, 1]);
    input[2]!.excluded = true;
    const calibrated = calibrateDirections(input, [
      { id: "a", frameIndex: 1, angle: 0 },
      { id: "b", frameIndex: 3, angle: 90 },
    ]);
    expect(calibrated.frameAngles[2]).toBeNull();
    expect(calibrated.warnings).toContain("missing-leading-range");
    expect(calibrated.warnings).toContain("missing-trailing-range");
  });
});

describe("shared alignment and atlas slicing", () => {
  it("creates one shared crop instead of scaling frames independently", () => {
    const input = frames([0, 1]);
    input[0]!.subjectBounds = { x: 10, y: 20, width: 40, height: 60 };
    input[1]!.subjectBounds = { x: 8, y: 24, width: 50, height: 54 };
    expect(commonSubjectCrop(input, 2)).toEqual({
      x: 6,
      y: 18,
      width: 54,
      height: 64,
    });
  });

  it("calculates atlas cells and flags cells outside the source image", () => {
    const settings = {
      columns: 2,
      rows: 2,
      cellWidth: 100,
      cellHeight: 80,
      marginX: 4,
      marginY: 6,
      gapX: 2,
      gapY: 4,
      order: "row-major" as const,
      page: 0,
    };
    expect(atlasCellRect(3, settings)).toEqual({
      x: 106,
      y: 90,
      width: 100,
      height: 80,
    });
    expect(atlasOverflow(205, 170, settings)).toEqual([1, 3]);
  });
});
