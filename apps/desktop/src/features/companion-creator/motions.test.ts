import { describe, expect, it } from "vitest";
import { createCompanionProject } from "./model";
import {
  clampMotionRange,
  diagnoseMotionRange,
  motionPreviewFrames,
  motionRangeSignature,
  validateMotionRanges,
} from "./motions";

function projectWithFrames(count = 8) {
  const project = createCompanionProject("motion-test");
  project.frames = Array.from({ length: count }, (_, index) => ({
    id: `frame-${index}`,
    sourceIndex: index,
    excluded: false,
    visualDelta: index === 0 ? 0 : 1,
    baselineOffset: { x: 0, y: 0 },
  }));
  project.directionAnchors = [
    { id: "north", frameIndex: 0, angle: 0 },
    { id: "east", frameIndex: 2, angle: 90 },
    { id: "south", frameIndex: 4, angle: 180 },
    { id: "west", frameIndex: 7, angle: 270 },
  ];
  project.preview.frameRate = 20;
  return project;
}

describe("motion range helpers", () => {
  it("clamps and orders range boundaries", () => {
    expect(clampMotionRange(9, -2, 8)).toEqual({
      startFrame: 0,
      endFrame: 7,
    });
  });

  it("skips excluded frames and builds a ping-pong preview", () => {
    const project = projectWithFrames(5);
    project.frames[2]!.excluded = true;
    expect(motionPreviewFrames(project.frames, 0, 4, "ping-pong")).toEqual([
      0, 1, 3, 4, 3, 1,
    ]);
  });

  it("changes the review signature when playback or exclusions change", () => {
    const project = projectWithFrames(4);
    const forward = motionRangeSignature(0, 3, "forward", project.frames);
    const pingPong = motionRangeSignature(0, 3, "ping-pong", project.frames);
    project.frames[2]!.excluded = true;
    const excluded = motionRangeSignature(0, 3, "forward", project.frames);
    expect(forward).not.toBe(pingPong);
    expect(forward).not.toBe(excluded);
  });

  it("reports duration, overlap, direction drift and the nearest pose", () => {
    const project = projectWithFrames();
    project.frames[3]!.excluded = true;
    project.motionRanges.push({
      id: "existing",
      name: "Blink",
      poseAnchorIds: ["east"],
      startFrame: 1,
      endFrame: 2,
      playback: "forward",
      speed: 1,
      minimumDelayMs: 1000,
      maximumDelayMs: 2000,
    });
    const diagnostics = diagnoseMotionRange(project, 1, 4);
    expect(diagnostics.includedFrames).toEqual([1, 2, 4]);
    expect(diagnostics.excludedCount).toBe(1);
    expect(diagnostics.durationMs).toBe(150);
    expect(diagnostics.overlappingMotionIds).toEqual(["existing"]);
    expect(diagnostics.recommendedPoseAnchorId).toBe("east");
    expect(diagnostics.hasDirectionDrift).toBe(true);
  });

  it("rejects incomplete pose links and unsafe timing values", () => {
    const project = projectWithFrames();
    project.motionRanges.push({
      id: "broken",
      name: "Broken blink",
      poseAnchorIds: [],
      startFrame: 2,
      endFrame: 2,
      playback: "forward",
      speed: 8,
      minimumDelayMs: 9_000,
      maximumDelayMs: 2_000,
    });
    expect(validateMotionRanges(project)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/at least two included frames/),
        expect.stringMatching(/direction pose/),
        expect.stringMatching(/speed/),
        expect.stringMatching(/idle delay/),
      ]),
    );
  });
});
