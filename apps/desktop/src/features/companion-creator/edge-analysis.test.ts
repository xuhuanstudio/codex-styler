import { describe, expect, it } from "vitest";
import { createCompanionProject } from "./model";
import {
  analyzeEdgePixels,
  representativeEdgeFrameIndexes,
} from "./edge-analysis";

function pixels(width: number, height: number) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
}

function fill(
  buffer: ReturnType<typeof pixels>,
  x: number,
  y: number,
  width: number,
  height: number,
  rgba: [number, number, number, number],
) {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      buffer.data.set(rgba, (row * buffer.width + column) * 4);
    }
  }
}

describe("companion edge analysis", () => {
  it("prioritizes semantic frames and keeps representative scans bounded", () => {
    const project = createCompanionProject("edge-samples");
    project.frames = Array.from({ length: 80 }, (_, index) => ({
      id: `frame-${index}`,
      sourceIndex: index,
      excluded: index === 3,
      visualDelta: 1,
      baselineOffset: { x: 0, y: 0 },
    }));
    project.neutralFrame = 7;
    project.reducedMotionFrame = 9;
    project.directionAnchors = [
      { id: "north", frameIndex: 12, angle: 0 },
      { id: "east", frameIndex: 24, angle: 90 },
    ];
    project.motionRanges = [
      {
        id: "blink",
        name: "Blink",
        poseAnchorIds: ["north"],
        startFrame: 30,
        endFrame: 34,
        playback: "forward",
        speed: 1,
        minimumDelayMs: 1000,
        maximumDelayMs: 2000,
      },
    ];

    const result = representativeEdgeFrameIndexes(project, 12);
    expect(result).toHaveLength(12);
    expect(result).toEqual(
      expect.arrayContaining([0, 7, 9, 12, 24, 30, 34, 79]),
    );
    expect(result).not.toContain(3);
  });

  it("reports an opaque background as the primary issue without redundant clipping noise", () => {
    const buffer = pixels(32, 32);
    fill(buffer, 0, 0, 32, 32, [245, 245, 245, 255]);
    const cleanup = createCompanionProject("opaque").cleanup;
    expect(analyzeEdgePixels(buffer, cleanup)).toEqual(["background-retained"]);
  });

  it("flags disconnected residue without rejecting a clean centered subject", () => {
    const cleanup = createCompanionProject("dust").cleanup;
    const dirty = pixels(80, 80);
    fill(dirty, 24, 12, 32, 60, [80, 120, 90, 255]);
    fill(dirty, 3, 20, 5, 5, [80, 120, 90, 255]);
    expect(analyzeEdgePixels(dirty, cleanup)).toContain("floating-pixels");

    const clean = pixels(80, 80);
    fill(clean, 24, 12, 32, 60, [80, 120, 90, 255]);
    expect(analyzeEdgePixels(clean, cleanup)).toEqual([]);
  });

  it("flags sampled-background color remaining in translucent edge pixels", () => {
    const cleanup = createCompanionProject("spill").cleanup;
    cleanup.mode = "sampled-color";
    cleanup.sampledColor = "#ffffff";
    const buffer = pixels(80, 80);
    fill(buffer, 24, 12, 32, 60, [80, 120, 90, 255]);
    fill(buffer, 22, 24, 4, 28, [250, 250, 250, 110]);
    expect(analyzeEdgePixels(buffer, cleanup)).toContain("color-spill");
  });
});
