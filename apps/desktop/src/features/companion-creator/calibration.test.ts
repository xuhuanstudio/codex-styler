import { describe, expect, it } from "vitest";
import {
  atlasCellRect,
  atlasOverflow,
  calibrateDirections,
  commonSubjectCrop,
  diagnoseSharedAlignment,
  nearestDirectionFrame,
  normalizeAngle,
  pointerAngle,
  suggestSharedAlignment,
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
    expect(calibrated.coverageRatio).toBe(0.5);
    expect(calibrated.unmappedRanges).toEqual([
      { startFrame: 0, endFrame: 0 },
      { startFrame: 4, endFrame: 4 },
    ]);
    expect(calibrated.ready).toBe(false);
  });

  it("only marks a multi-frame calibration ready when anchors cover the full sequence", () => {
    const input = frames([0, 1, 1, 1, 1, 1, 1]);
    const incomplete = calibrateDirections(input, [
      { id: "a", frameIndex: 1, angle: 0 },
      { id: "b", frameIndex: 2, angle: 90 },
      { id: "c", frameIndex: 3, angle: 180 },
      { id: "d", frameIndex: 5, angle: 270 },
    ]);
    expect(incomplete.ready).toBe(false);
    expect(incomplete.coverageRatio).toBeCloseTo(5 / 7);

    const complete = calibrateDirections(input, [
      { id: "a", frameIndex: 0, angle: 0 },
      { id: "b", frameIndex: 2, angle: 90 },
      { id: "c", frameIndex: 4, angle: 180 },
      { id: "d", frameIndex: 6, angle: 270 },
    ]);
    expect(complete.ready).toBe(true);
    expect(complete.coverageRatio).toBe(1);
    expect(complete.maximumDirectionGap).toBe(90);
    expect(complete.seamGap).toBe(90);
  });

  it("reports reverse ranges and duplicate direction anchors", () => {
    const input = frames([0, 1, 1, 1]);
    const reversed = calibrateDirections(input, [
      { id: "a", frameIndex: 0, angle: 0 },
      { id: "b", frameIndex: 1, angle: 315 },
      { id: "c", frameIndex: 2, angle: 315 },
      { id: "d", frameIndex: 3, angle: 0 },
    ]);
    expect(reversed.warnings).toContain("reverse-segment");
    expect(reversed.warnings).toContain("duplicate-directions");
    expect(reversed.reverseSegments).toEqual([{ startFrame: 0, endFrame: 1 }]);
    expect(reversed.ready).toBe(false);
  });

  it("selects the nearest interpolated pose for a pointer angle", () => {
    expect(nearestDirectionFrame([0, 45, 90, 180], 82)).toBe(2);
    expect(nearestDirectionFrame([0, null, 270], 300)).toBe(2);
    expect(nearestDirectionFrame([null, null], 90, 1)).toBe(1);
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

  it("suggests shared offsets that center every subject on one ground line", () => {
    const input = frames([0, 1, 1]);
    input[0]!.subjectBounds = { x: 20, y: 30, width: 40, height: 70 };
    input[1]!.subjectBounds = { x: 8, y: 18, width: 64, height: 82 };
    input[2]!.subjectBounds = { x: 16, y: 34, width: 48, height: 60 };
    const suggestion = suggestSharedAlignment(input, 6, {
      width: 96,
      height: 120,
    });
    expect(suggestion).not.toBeNull();
    input.forEach((frame, index) => {
      frame.baselineOffset = suggestion!.offsets[index]!;
    });
    const diagnostics = diagnoseSharedAlignment(
      input,
      suggestion!.crop,
      suggestion!.groundLine,
    );
    expect(diagnostics.ready).toBe(true);
    expect(diagnostics.maximumBaselineDelta).toBe(0);
    expect(diagnostics.maximumCenterDelta).toBe(0);
  });

  it("shifts aligned subjects with a crop that meets the canvas edge", () => {
    const input = frames([0]);
    input[0]!.subjectBounds = { x: 4, y: 14, width: 414, height: 622 };
    const suggestion = suggestSharedAlignment(input, 8, {
      width: 448,
      height: 648,
    });
    expect(suggestion).not.toBeNull();
    input[0]!.baselineOffset = suggestion!.offsets[0]!;
    const diagnostics = diagnoseSharedAlignment(
      input,
      suggestion!.crop,
      suggestion!.groundLine,
    );
    expect(suggestion!.crop).toEqual({
      x: 0,
      y: 6,
      width: 430,
      height: 638,
    });
    expect(diagnostics.ready).toBe(true);
    expect(diagnostics.maximumBaselineDelta).toBe(0);
    expect(diagnostics.maximumCenterDelta).toBe(0);
  });

  it("reports missing silhouettes, canvas overflow and baseline drift", () => {
    const input = frames([0, 1, 1]);
    input[0]!.subjectBounds = { x: 8, y: 10, width: 30, height: 40 };
    input[1]!.subjectBounds = { x: 44, y: 16, width: 30, height: 38 };
    const diagnostics = diagnoseSharedAlignment(
      input,
      { x: 4, y: 4, width: 60, height: 48 },
      50,
    );
    expect(diagnostics.ready).toBe(false);
    expect(diagnostics.missingBounds).toBe(1);
    expect(diagnostics.outsideCrop).toBe(1);
    expect(diagnostics.baselineOutliers).toBe(1);
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
