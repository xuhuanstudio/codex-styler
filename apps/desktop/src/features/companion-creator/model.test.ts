import { describe, expect, it } from "vitest";
import {
  companionProjectIsPristine,
  createCompanionProject,
  normalizeCompanionProject,
  resetCompanionProjectDerivedState,
  suggestedCompanionName,
  type CompanionCreatorProject,
} from "./model";

describe("companion creator project model", () => {
  it("does not treat a newly opened studio as a meaningful draft", () => {
    const project = createCompanionProject("local-empty-draft");

    expect(companionProjectIsPristine(project)).toBe(true);

    project.updatedAt = new Date(Date.now() + 1_000).toISOString();
    expect(companionProjectIsPristine(project)).toBe(true);

    project.source = {
      kind: "video",
      files: [],
      videoRange: { startMs: 0, endMs: 30_000 },
      extractionFps: 12,
    };
    expect(companionProjectIsPristine(project)).toBe(true);
  });

  it("keeps edited metadata and imported media as meaningful drafts", () => {
    const metadataProject = createCompanionProject("local-metadata-draft");
    metadataProject.name = "My companion";
    expect(companionProjectIsPristine(metadataProject)).toBe(false);

    const mediaProject = createCompanionProject("local-media-draft");
    mediaProject.source = {
      kind: "video",
      files: [
        {
          name: "turn.mp4",
          type: "video/mp4",
          size: 1024,
          lastModified: 1,
        },
      ],
      videoRange: { startMs: 0, endMs: 1_000 },
      extractionFps: 12,
    };
    expect(companionProjectIsPristine(mediaProject)).toBe(false);
  });

  it("adds creator metadata and placement defaults to older local drafts", () => {
    const current = createCompanionProject("local-legacy-draft");
    const legacy = structuredClone(current) as Partial<CompanionCreatorProject>;
    delete legacy.description;
    delete legacy.author;
    delete legacy.license;
    delete legacy.placement;
    delete legacy.contentScale;
    delete legacy.qualityReview;

    const migrated = normalizeCompanionProject(
      legacy as CompanionCreatorProject,
    );

    expect(migrated.description).toBe("");
    expect(migrated.author).toBe("");
    expect(migrated.license).toBe("");
    expect(migrated.contentScale).toBe(1);
    expect(migrated.qualityReview).toEqual({
      edgeBackdrops: [],
      edgeSignature: null,
    });
    expect(migrated.placement).toEqual({
      align: 0.82,
      offsetX: 0,
      offsetY: 2,
      size: 120,
    });
  });

  it("preserves placement and metadata from a current draft", () => {
    const project = createCompanionProject("local-current-draft");
    project.description = "A carefully calibrated local companion.";
    project.author = "Studio owner";
    project.license = "CC0-1.0";
    project.placement = {
      align: 0.35,
      offsetX: 4,
      offsetY: -6,
      size: 168,
    };

    expect(normalizeCompanionProject(project)).toMatchObject({
      description: "A carefully calibrated local companion.",
      author: "Studio owner",
      license: "CC0-1.0",
      placement: {
        align: 0.35,
        offsetX: 4,
        offsetY: -6,
        size: 168,
      },
    });
  });

  it("turns source filenames into concise editable companion names", () => {
    expect(suggestedCompanionName("pico-parrot-portrait.webp")).toBe(
      "Pico Parrot",
    );
    expect(suggestedCompanionName("resetGod_sprite.PNG")).toBe("Reset God");
    expect(suggestedCompanionName("小猫_透明.png")).toBe("小猫 透明");
  });

  it("clears source-derived editing data without erasing user metadata", () => {
    const project = createCompanionProject("replace-source-project");
    project.name = "Retained name";
    project.author = "Retained author";
    project.license = "CC0-1.0";
    project.step = "test";
    project.frames = [
      {
        id: "frame-0",
        sourceIndex: 0,
        excluded: false,
        visualDelta: 1,
        baselineOffset: { x: 2, y: 3 },
      },
    ];
    project.sharedCrop = { x: 1, y: 2, width: 30, height: 40 };
    project.groundLine = 42;
    project.contentScale = 0.72;
    project.cleanup.mode = "sampled-color";
    project.cleanup.strokes.push({
      frame: 0,
      mode: "erase",
      points: [{ x: 4, y: 5 }],
      radius: 12,
    });
    project.directionAnchors.push({
      id: "north",
      frameIndex: 0,
      angle: 0,
    });
    project.motionRanges.push({
      id: "blink",
      name: "Blink",
      poseAnchorIds: ["north"],
      startFrame: 0,
      endFrame: 0,
      playback: "forward",
      speed: 1,
      minimumDelayMs: 1_000,
      maximumDelayMs: 2_000,
    });
    project.qualityReview.edgeBackdrops = ["black", "white", "theme"];

    resetCompanionProjectDerivedState(project);

    expect(project).toMatchObject({
      name: "Retained name",
      author: "Retained author",
      license: "CC0-1.0",
      step: "import",
      frames: [],
      sharedCrop: null,
      groundLine: null,
      contentScale: 1,
      directionAnchors: [],
      motionRanges: [],
      qualityReview: { edgeBackdrops: [], edgeSignature: null },
      neutralFrame: 0,
      reducedMotionFrame: 0,
    });
    expect(project.cleanup).toEqual(createCompanionProject("defaults").cleanup);
  });
});
