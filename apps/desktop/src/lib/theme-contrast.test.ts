import { describe, expect, it } from "vitest";
import {
  builtinThemes,
  nativeRefined,
  nocturneStudio,
} from "@codex-styler/theme-core";
import { minimumContrast } from "./contrast";
import { hasImageBackdrop, resolveThemeContrast } from "./theme-contrast";

describe("theme contrast system", () => {
  it("detects image scene layers even when the variant has no background image", () => {
    expect(nocturneStudio.variants.light.background.image).toBeUndefined();
    expect(hasImageBackdrop(nocturneStudio, "light")).toBe(true);
  });

  it("protects primary and secondary text across image-backed glass samples", () => {
    const system = resolveThemeContrast(nocturneStudio, "light");
    expect(system.hasImageBackdrop).toBe(true);
    expect(system.quietSurfaceOpacity).toBeGreaterThanOrEqual(0.64);
    expect(
      minimumContrast(system.textPrimary, system.quietBackgrounds),
    ).toBeGreaterThanOrEqual(4.49);
    expect(
      minimumContrast(system.textSecondary, system.quietBackgrounds),
    ).toBeGreaterThanOrEqual(4.49);
  });

  it("does not raise neutral themes to the image-backed opacity floor", () => {
    const system = resolveThemeContrast(nativeRefined, "light");
    expect(system.hasImageBackdrop).toBe(false);
    expect(system.quietSurfaceOpacity).toBeLessThan(0.64);
  });

  it("uses authored focus opacity for dialogs and other raised surfaces", () => {
    const theme = structuredClone(nocturneStudio);
    theme.variants.dark.appearance.focusOpacity = 0.97;

    const system = resolveThemeContrast(theme, "dark");

    expect(system.strongSurfaceOpacity).toBeGreaterThanOrEqual(0.97);
    expect(system.strongSurfaceOpacity).toBeGreaterThan(
      system.quietSurfaceOpacity,
    );
  });

  it("keeps every built-in variant readable on its quiet and strong UI surfaces", () => {
    for (const theme of builtinThemes) {
      for (const variant of ["light", "dark"] as const) {
        const system = resolveThemeContrast(theme, variant);
        const surfaces = [
          ...system.quietBackgrounds,
          ...system.strongBackgrounds,
          theme.variants[variant].appearance.surface,
        ];
        expect(
          minimumContrast(system.textPrimary, surfaces),
          `${theme.id} ${variant} primary`,
        ).toBeGreaterThanOrEqual(4.49);
        expect(
          minimumContrast(system.textSecondary, surfaces),
          `${theme.id} ${variant} secondary`,
        ).toBeGreaterThanOrEqual(4.49);
        expect(
          minimumContrast(system.textTertiary, surfaces),
          `${theme.id} ${variant} tertiary`,
        ).toBeGreaterThanOrEqual(2.99);
      }
    }
  });
});
