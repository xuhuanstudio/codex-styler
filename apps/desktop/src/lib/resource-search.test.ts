import { describe, expect, it } from "vitest";
import {
  matchesResourceSearch,
  normalizeResourceSearchText,
} from "./resource-search";

describe("resource search", () => {
  it("normalizes case, spacing, and diacritics", () => {
    expect(normalizeResourceSearchText("  Café STUDIO  ")).toBe(
      "cafe studio",
    );
  });

  it("matches across all indexed resource fields", () => {
    expect(
      matchesResourceSearch("garden", [
        "Quiet Garden",
        "A calm workspace",
        "nature image",
      ]),
    ).toBe(true);
    expect(
      matchesResourceSearch("cinematic", [
        "Quiet Garden",
        "A calm workspace",
        "nature image",
      ]),
    ).toBe(false);
    expect(
      matchesResourceSearch("garden nature", [
        "Quiet Garden",
        "A calm workspace",
        "nature image",
      ]),
    ).toBe(true);
  });
});
