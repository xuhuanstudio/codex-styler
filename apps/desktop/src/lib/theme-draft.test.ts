import { describe, expect, it } from "vitest";
import { builtinThemes } from "@codex-styler/theme-core";
import { assignThemeVariantField } from "./theme-draft";

describe("theme draft field updates", () => {
  it("rebuilds component harmony after a base appearance color changes", () => {
    const draft = structuredClone(
      builtinThemes.find(
        (theme) => theme.id === "codex-styler.gilded-grandeur",
      )!,
    );
    expect(draft.variants.dark.appearance.palette).toBeDefined();

    assignThemeVariantField(draft, "dark", "appearance", "accent", "#f4c95d");

    expect(draft.variants.dark.appearance.accent).toBe("#f4c95d");
    expect(draft.variants.dark.appearance.palette).toBeUndefined();
  });

  it("preserves an authored component palette for non-color adjustments", () => {
    const draft = structuredClone(
      builtinThemes.find(
        (theme) => theme.id === "codex-styler.gilded-grandeur",
      )!,
    );
    const authoredPalette = draft.variants.dark.appearance.palette;

    assignThemeVariantField(draft, "dark", "appearance", "radius", 16);

    expect(draft.variants.dark.appearance.palette).toEqual(authoredPalette);
  });
});
