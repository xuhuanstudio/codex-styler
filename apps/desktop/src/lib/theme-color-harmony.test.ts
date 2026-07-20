import { builtinThemes, validateTheme } from "@codex-styler/theme-core";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import {
  assignThemeColorHarmony,
  createThemeColorHarmonyPalette,
  resolveThemeColorHarmonyMode,
} from "./theme-color-harmony";

describe("theme color harmony", () => {
  it("builds distinct tonal and contrast component palettes", () => {
    const variant = structuredClone(builtinThemes[0].variants.dark);
    variant.appearance.palette = undefined;
    const tonal = createThemeColorHarmonyPalette(variant, "tonal");
    const contrast = createThemeColorHarmonyPalette(variant, "contrast");

    expect(tonal.controlActive).not.toBe(contrast.controlActive);
    expect(tonal.surfaceRaised).not.toBe(contrast.surfaceRaised);
    expect(
      contrastRatio(tonal.onAccent!, variant.appearance.accent),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(contrast.onAccent!, variant.appearance.accent),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("recognizes generated recipes while preserving authored palettes", () => {
    const theme = structuredClone(builtinThemes[0]);

    expect(resolveThemeColorHarmonyMode(theme.variants.dark)).toBe("authored");
    assignThemeColorHarmony(theme, "dark", "tonal");
    expect(resolveThemeColorHarmonyMode(theme.variants.dark)).toBe("tonal");
    expect(validateTheme(theme)).toEqual({ ok: true, issues: [] });
    assignThemeColorHarmony(theme, "dark", "contrast");
    expect(resolveThemeColorHarmonyMode(theme.variants.dark)).toBe("contrast");
    expect(validateTheme(theme)).toEqual({ ok: true, issues: [] });
    assignThemeColorHarmony(theme, "dark", "automatic");
    expect(resolveThemeColorHarmonyMode(theme.variants.dark)).toBe("automatic");
    expect(theme.variants.dark.appearance.palette).toBeUndefined();
  });
});
