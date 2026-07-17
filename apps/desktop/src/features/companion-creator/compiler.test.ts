import { describe, expect, it } from "vitest";
import {
  atlasPackLayout,
  decodedPageLimit,
  expandMotionFrames,
} from "./compiler";

describe("companion atlas compiler limits", () => {
  it("keeps every decoded atlas page within the 48 MiB target", () => {
    const layout = atlasPackLayout(1000, 1000, 80);
    expect(layout.columns * layout.rows * 1000 * 1000 * 4).toBeLessThanOrEqual(
      decodedPageLimit,
    );
    expect(layout.pages).toBeLessThanOrEqual(8);
  });

  it("rejects a canvas that would require more than eight safe pages", () => {
    expect(() => atlasPackLayout(1000, 1000, 100)).toThrow(
      /eight safe atlas pages/,
    );
  });

  it("expands ping-pong motion without duplicating the endpoints", () => {
    expect(expandMotionFrames([0, 1, 2, 3], "ping-pong")).toEqual([
      0, 1, 2, 3, 2, 1,
    ]);
  });
});
