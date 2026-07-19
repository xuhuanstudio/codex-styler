import { describe, expect, it } from "vitest";
import {
  applyCompanionPlacementMode,
  resolveCompanionPlacementMode,
} from "./companion-placement-modes";

describe("companion placement modes", () => {
  it("distinguishes composer, free, and imported custom attachments", () => {
    expect(resolveCompanionPlacementMode(null)).toBe("free");
    expect(
      resolveCompanionPlacementMode({
        target: "composer",
        edge: "top",
        align: 0.8,
        offset: { x: 0, y: 3 },
      }),
    ).toBe("composer");
    expect(
      resolveCompanionPlacementMode({
        target: "thread-summary",
        edge: "top",
        align: 0.5,
        offset: { x: 0, y: 0 },
      }),
    ).toBe("custom");
  });

  it("preserves the free-position fallback while restoring package snapping", () => {
    const packageAttachment = {
      target: "composer" as const,
      edge: "top" as const,
      align: 0.72,
      offset: { x: 4, y: 2 },
    };
    const current = {
      anchor: { x: 63, y: 58 },
      attachment: null,
    };

    expect(applyCompanionPlacementMode("free", current)).toEqual(current);
    expect(
      applyCompanionPlacementMode("composer", current, packageAttachment),
    ).toEqual({
      anchor: current.anchor,
      attachment: packageAttachment,
    });
  });
});
