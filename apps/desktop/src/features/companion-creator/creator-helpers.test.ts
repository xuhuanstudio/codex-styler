import { describe, expect, it } from "vitest";
import { createCompanionProject } from "./model";
import {
  clamp,
  cleanupIsNoop,
  defaultAtlas,
  extractionActionLabel,
  formatFileSize,
  projectStateSignature,
  sharedCanvasDimensions,
  sourceDescriptor,
} from "./creator-helpers";

describe("companion creator helpers", () => {
  it("builds predictable source defaults without mutating imported files", () => {
    const file = new File(["video"], "turn.mp4", { type: "video/mp4" });

    expect(sourceDescriptor("video", [file])).toMatchObject({
      kind: "video",
      files: [{ name: "turn.mp4", type: "video/mp4", size: 5 }],
      videoRange: { startMs: 0, endMs: 30_000 },
      extractionFps: 12,
    });
    expect(sourceDescriptor("atlas", [file]).atlas).toEqual(defaultAtlas());
  });

  it("keeps draft comparisons stable across autosave timestamps", () => {
    const before = createCompanionProject("stable-signature");
    const after = structuredClone(before);
    after.updatedAt = new Date(Date.now() + 10_000).toISOString();

    expect(projectStateSignature(after)).toBe(projectStateSignature(before));

    after.name = "Edited companion";
    expect(projectStateSignature(after)).not.toBe(
      projectStateSignature(before),
    );
  });

  it("recognizes no-op cleanup and reports compact user-facing values", () => {
    const project = createCompanionProject("cleanup-state");
    expect(cleanupIsNoop(project.cleanup)).toBe(true);

    project.cleanup.cornerMasks.push({
      corner: "top-right",
      width: 12,
      height: 12,
    });
    expect(cleanupIsNoop(project.cleanup)).toBe(false);
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1536)).toBe("1.5 KiB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MiB");
    expect(extractionActionLabel("video", "zh-CN")).toBe("抽取视频帧");
    expect(clamp(12, 0, 10)).toBe(10);
  });

  it("derives a shared canvas from the smallest source dimensions", () => {
    expect(sharedCanvasDimensions([])).toBeUndefined();
    expect(
      sharedCanvasDimensions([
        {
          id: "frame-a",
          sourceIndex: 0,
          blob: new Blob(),
          url: "blob:a",
          width: 640,
          height: 480,
        },
        {
          id: "frame-b",
          sourceIndex: 1,
          blob: new Blob(),
          url: "blob:b",
          width: 512,
          height: 720,
        },
      ]),
    ).toEqual({ width: 512, height: 480 });
  });
});
