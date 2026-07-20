import { describe, expect, it } from "vitest";
import { createCompanionProject } from "./model";
import {
  assignedPoseIdsForMotion,
  clampMotionRange,
  diagnoseMotionRange,
  motionPreviewFrames,
  motionRangeSignature,
  resolveMotionAudition,
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

  it("resolves the nearest pose and only exposes motions assigned to it", () => {
    const project = projectWithFrames();
    project.motionRanges.push(
      {
        id: "east-blink",
        name: "East blink",
        poseAnchorIds: ["east"],
        startFrame: 1,
        endFrame: 3,
        playback: "forward",
        speed: 1,
        minimumDelayMs: 1_000,
        maximumDelayMs: 2_000,
      },
      {
        id: "west-breathe",
        name: "West breathe",
        poseAnchorIds: ["west"],
        startFrame: 5,
        endFrame: 7,
        playback: "forward",
        speed: 1,
        minimumDelayMs: 1_000,
        maximumDelayMs: 2_000,
      },
    );

    const plan = resolveMotionAudition(project, 94);
    expect(plan.activeAnchor?.id).toBe("east");
    expect(plan.motions).toEqual([
      expect.objectContaining({
        id: "east-blink",
        frames: [1, 2, 3],
        frameDurationMs: 42,
        durationMs: 126,
      }),
    ]);
  });

  it("expands an anchor assignment across its interpolated pose sector", () => {
    const anchors = projectWithFrames().directionAnchors;
    const poses = [
      { id: "pose-0", angle: 0 },
      { id: "pose-1", angle: 30 },
      { id: "pose-2", angle: 70 },
      { id: "pose-3", angle: 100 },
      { id: "pose-4", angle: 340 },
    ];

    expect(assignedPoseIdsForMotion(poses, anchors, ["north"])).toEqual([
      "pose-0",
      "pose-1",
      "pose-4",
    ]);
    expect(assignedPoseIdsForMotion(poses, anchors, ["east"])).toEqual([
      "pose-2",
      "pose-3",
    ]);
  });

  it("handles the zero-degree seam, exclusions and unsafe draft speeds", () => {
    const project = projectWithFrames(5);
    project.frames[2]!.excluded = true;
    project.motionRanges.push({
      id: "north-idle",
      name: "",
      poseAnchorIds: ["north"],
      startFrame: 0,
      endFrame: 4,
      playback: "ping-pong",
      speed: 0,
      minimumDelayMs: 1_000,
      maximumDelayMs: 2_000,
    });

    const plan = resolveMotionAudition(project, 359);
    expect(plan.activeAnchor?.id).toBe("north");
    expect(plan.motions[0]).toMatchObject({
      name: "Idle motion",
      frames: [0, 1, 3, 4, 3, 1],
      frameDurationMs: 417,
      durationMs: 2_502,
    });
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
