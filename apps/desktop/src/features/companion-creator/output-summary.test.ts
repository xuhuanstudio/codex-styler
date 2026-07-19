import { describe, expect, it } from "vitest";
import { calibrateDirections } from "./calibration";
import { createCompanionProject } from "./model";
import {
  companionOutputLimits,
  summarizeCompanionOutput,
} from "./output-summary";

function addFrames(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `frame-${index}`,
    sourceIndex: index,
    excluded: false,
    visualDelta: index === 0 ? 0 : 1,
    baselineOffset: { x: 0, y: 0 },
  }));
}

describe("companion output summary", () => {
  it("describes a static companion as one image", () => {
    const project = createCompanionProject("local.static-summary");
    project.frames = addFrames(1);
    project.sharedCrop = { x: 0, y: 0, width: 320, height: 480 };
    const calibration = calibrateDirections(
      project.frames,
      project.directionAnchors,
    );

    expect(summarizeCompanionOutput(project, calibration)).toMatchObject({
      canvas: { width: 320, height: 480 },
      includedFrames: 1,
      directionCoverage: 1,
      directionPoses: 1,
      assetKind: "image",
      atlasPages: 0,
      withinLimits: true,
    });
  });

  it("reports atlas pages, exclusions, poses and idle clips", () => {
    const project = createCompanionProject("local.atlas-summary");
    project.frames = addFrames(12);
    project.frames[11]!.excluded = true;
    project.sharedCrop = { x: 0, y: 0, width: 900, height: 900 };
    project.directionAnchors = [
      { id: "north", frameIndex: 0, angle: 0 },
      { id: "east", frameIndex: 3, angle: 90 },
      { id: "south", frameIndex: 6, angle: 180 },
      { id: "west", frameIndex: 10, angle: 270 },
    ];
    project.motionRanges = [
      {
        id: "blink",
        name: "Blink",
        poseAnchorIds: ["north"],
        startFrame: 1,
        endFrame: 2,
        playback: "forward",
        speed: 1,
        minimumDelayMs: 1_000,
        maximumDelayMs: 2_000,
      },
    ];
    const calibration = calibrateDirections(
      project.frames,
      project.directionAnchors,
    );
    const summary = summarizeCompanionOutput(project, calibration);

    expect(summary.includedFrames).toBe(11);
    expect(summary.excludedFrames).toBe(1);
    expect(summary.directionPoses).toBe(9);
    expect(summary.idleClips).toBe(1);
    expect(summary.assetKind).toBe("atlas");
    expect(summary.atlasPages).toBeGreaterThan(0);
    expect(summary.atlasPages).toBeLessThanOrEqual(
      companionOutputLimits.atlasPages,
    );
    expect(summary.decodedPageBytes).toBeLessThanOrEqual(
      companionOutputLimits.decodedPageBytes,
    );
    expect(summary.withinLimits).toBe(true);
  });

  it("blocks compilation until a shared crop exists", () => {
    const project = createCompanionProject("local.missing-crop");
    project.frames = addFrames(4);
    const calibration = calibrateDirections(
      project.frames,
      project.directionAnchors,
    );

    expect(summarizeCompanionOutput(project, calibration)).toMatchObject({
      canvas: null,
      withinLimits: false,
      issue: "missing-crop",
    });
  });

  it("blocks an oversized shared canvas before build", () => {
    const project = createCompanionProject("local.oversized-canvas");
    project.frames = addFrames(1);
    project.sharedCrop = { x: 0, y: 0, width: 8193, height: 512 };
    const calibration = calibrateDirections(
      project.frames,
      project.directionAnchors,
    );

    expect(summarizeCompanionOutput(project, calibration)).toMatchObject({
      canvas: { width: 8193, height: 512 },
      withinLimits: false,
      issue: "canvas-limit",
    });
  });
});
