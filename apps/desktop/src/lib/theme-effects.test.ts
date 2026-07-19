import { describe, expect, it } from "vitest";
import {
  gildedGrandeur,
  merryBigTop,
  nativeRefined,
} from "@codex-styler/theme-core";
import {
  resolveThemeEffectCoverage,
  resolveThemeMotionProfile,
  resolveThemeVisualPersonality,
} from "./theme-effects";

describe("resolveThemeEffectCoverage", () => {
  it("reports the semantic systems a theme can actually style", () => {
    const coverage = resolveThemeEffectCoverage(nativeRefined, "dark");

    expect(coverage.find((effect) => effect.id === "background")?.active).toBe(
      true,
    );
    expect(coverage.find((effect) => effect.id === "surfaces")?.active).toBe(
      true,
    );
    expect(coverage.find((effect) => effect.id === "readability")?.active).toBe(
      true,
    );
    expect(coverage.find((effect) => effect.id === "typography")?.active).toBe(
      true,
    );
  });

  it("does not promise semantic component styling for safe themes", () => {
    const theme = structuredClone(nativeRefined);
    theme.compatibility.codex.mode = "safe";

    const coverage = resolveThemeEffectCoverage(theme, "dark");

    expect(coverage.find((effect) => effect.id === "background")?.active).toBe(
      true,
    );
    expect(coverage.find((effect) => effect.id === "surfaces")?.active).toBe(
      false,
    );
    expect(coverage.find((effect) => effect.id === "controls")?.active).toBe(
      false,
    );
    expect(coverage.find((effect) => effect.id === "typography")?.active).toBe(
      false,
    );

    theme.variants.dark.motion.parallax = 0;
    theme.scene.layers.forEach((layer) => {
      layer.parallax = 0;
    });
    expect(
      resolveThemeEffectCoverage(theme, "dark").find(
        (effect) => effect.id === "motion",
      )?.active,
    ).toBe(false);
  });

  it("reports UI motion even when background parallax is disabled", () => {
    const theme = structuredClone(nativeRefined);
    theme.variants.dark.motion.intensity = 0.58;
    theme.variants.dark.motion.parallax = 0;
    theme.scene.layers.forEach((layer) => {
      layer.parallax = 0;
    });

    expect(
      resolveThemeEffectCoverage(theme, "dark").find(
        (effect) => effect.id === "motion",
      )?.active,
    ).toBe(true);
  });
});

describe("resolveThemeMotionProfile", () => {
  it.each([
    [-1, "still", 0, 0],
    [0.2, "calm", 140, 1],
    [0.55, "fluid", 190, 2],
    [0.9, "expressive", 240, 3],
    [4, "expressive", 240, 3],
  ] as const)(
    "maps intensity %s to the %s motion tier",
    (intensity, character, durationMs, hoverLiftPx) => {
      expect(resolveThemeMotionProfile(intensity)).toMatchObject({
        character,
        durationMs,
        hoverLiftPx,
      });
    },
  );
});

describe("resolveThemeVisualPersonality", () => {
  it("derives architectural and soft treatments from portable controls", () => {
    expect(resolveThemeVisualPersonality(gildedGrandeur, "dark")).toEqual({
      layout: "editorial",
      geometry: "precise",
      material: "frosted",
      iconStyle: "themed",
      decorations: "expressive",
      typography: "editorial",
      motion: "fluid",
    });
    expect(resolveThemeVisualPersonality(merryBigTop, "dark")).toEqual({
      layout: "immersive",
      geometry: "soft",
      material: "frosted",
      iconStyle: "themed",
      decorations: "expressive",
      typography: "cinematic",
      motion: "expressive",
    });
  });

  it("keeps low-motion native themes restrained", () => {
    const theme = structuredClone(nativeRefined);
    theme.variants.dark.motion.intensity = 0;

    expect(resolveThemeVisualPersonality(theme, "dark")).toMatchObject({
      layout: "native",
      geometry: "balanced",
      typography: "balanced",
      motion: "still",
    });
  });

  it.each([
    [{ surfaceOpacity: 0.96, focusOpacity: 0.98, focusBlur: 0 }, "solid"],
    [{ surfaceOpacity: 0.88, focusOpacity: 0.94, focusBlur: 10 }, "layered"],
    [{ surfaceOpacity: 0.78, focusOpacity: 0.9, focusBlur: 20 }, "frosted"],
  ] as const)(
    "derives a %s surface recipe as %s material",
    (appearance, expectedMaterial) => {
      const theme = structuredClone(nativeRefined);
      Object.assign(theme.variants.dark.appearance, appearance);

      expect(resolveThemeVisualPersonality(theme, "dark").material).toBe(
        expectedMaterial,
      );
    },
  );
});
